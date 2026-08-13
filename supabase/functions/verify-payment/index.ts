import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail, buildEmailHtml, buildOrderDetailsHtml } from '../_shared/email.ts'
import { getAdminBaseUrl, getMailSender } from '../_shared/config.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthenticated')

    const requestData = await req.json()
    const { transactionId, txRef, orderId } = requestData

    if (!transactionId || !txRef || !orderId) throw new Error('transactionId, txRef and orderId required')

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) throw new Error('Order not found')
    if (order.user_id !== user.id) throw new Error('Access denied')
    if (order.payment_status === 'paid') return new Response(JSON.stringify({ success: true, alreadyPaid: true }), { headers: corsHeaders })

    // Verify with Flutterwave
    const flwSecretKey = Deno.env.get('FLW_SECRET_KEY')
    if (!flwSecretKey) throw new Error('Flutterwave not configured')

    const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
      headers: { Authorization: `Bearer ${flwSecretKey}` }
    })
    
    if (!verifyRes.ok) throw new Error('Flutterwave verification failed')
    const verifyData = await verifyRes.json()

    if (verifyData.status !== 'success' || verifyData.data.status !== 'successful') {
      throw new Error('Payment not successful')
    }

    const verified = verifyData.data
    if (verified.tx_ref !== txRef) throw new Error('Payment reference mismatch')
    if (verified.meta?.orderId && verified.meta.orderId !== orderId) throw new Error('Payment order mismatch')
    if (verified.meta?.userId && verified.meta.userId !== user.id) throw new Error('Payment user mismatch')

    const paidAmount = Number(verified.amount)
    if (!Number.isFinite(paidAmount) || Math.abs(paidAmount - Number(order.total)) > 0.01) {
      throw new Error(`Payment amount mismatch. Expected ${order.total}, received ${paidAmount}.`)
    }

    if (verified.currency !== 'NGN') {
      throw new Error(`Currency mismatch. Expected NGN, received ${verified.currency}.`)
    }

    const { data: finalized, error: finalizeError } = await supabaseAdmin.rpc('finalize_paid_order', {
      p_order_id: orderId,
      p_reference: txRef,
      p_source: 'flutterwave',
    })
    if (finalizeError) throw finalizeError

    const paidOrder = {
      ...order,
      payment_reference: txRef || String(transactionId),
      payment_status: 'paid',
      status: 'paid',
    }

    if (!finalized) {
      return new Response(JSON.stringify({ success: true, alreadyPaid: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send notifications only after the atomic database finalization succeeds.
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    const adminEmail = Deno.env.get('ADMIN_EMAIL')
    if (brevoApiKey) {
      const { fromEmail, fromName } = getMailSender()

      // Notify Customer
      if (order.customer_email) {
        try {
          await sendEmail({
            to: order.customer_email,
            subject: `Order Confirmed - ${order.order_number}`,
            fromEmail,
            fromName,
            brevoApiKey,
            htmlContent: buildEmailHtml({
              heading: 'Your Order is Confirmed',
              greetingName: order.customer_name,
              bodyLines: [
                `We have received your payment of N${order.total.toLocaleString()} for order ${order.order_number}.`,
                'Our team is now preparing your request.',
              ],
              orderNumber: order.order_number,
              detailsHtml: buildOrderDetailsHtml(paidOrder),
            }),
          })
        } catch (err) {
          console.error('Failed to send customer confirmation:', err)
        }
      }

      // Notify Admin
      if (adminEmail) {
        try {
          await sendEmail({
            to: adminEmail,
            subject: `PAID ORDER RECEIVED - ${order.order_number}`,
            fromEmail,
            fromName,
            brevoApiKey,
            htmlContent: buildEmailHtml({
              heading: 'New Paid Order',
              greetingName: 'Admin',
              bodyLines: [
                `Order ${order.order_number} has been successfully paid by ${order.customer_name}.`,
                `Total received: N${order.total.toLocaleString()}`,
              ],
              orderNumber: order.order_number,
              detailsHtml: buildOrderDetailsHtml(paidOrder),
              ctaLabel: 'View Order',
              ctaUrl: `${getAdminBaseUrl()}/orders/${orderId}`,
            }),
          })
        } catch (err) {
          console.error('Failed to notify admin of payment:', err)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
