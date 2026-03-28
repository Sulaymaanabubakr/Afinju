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

    if (!transactionId || !orderId) throw new Error('transactionId and orderId required')

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

    const paidAmount = verifyData.data.amount
    if (Math.abs(paidAmount - order.total) > 1) {
      throw new Error(`Payment amount mismatch. Expected ${order.total}, received ${paidAmount}.`)
    }

    if (verifyData.data.currency !== 'NGN') {
      throw new Error(`Currency mismatch. Expected NGN, received ${verifyData.data.currency}.`)
    }

    // Update product inventory and order status
    for (const item of order.items) {
      const { data: product } = await supabaseAdmin.from('products').select('inventory').eq('id', item.productId).single()
      if (product) {
        const inventory = product.inventory || { soldCount: 0 }
        inventory.soldCount = (inventory.soldCount || 0) + item.quantity
        await supabaseAdmin.from('products').update({ inventory }).eq('id', item.productId)
      }
    }

    const { error: updateError } = await supabaseAdmin.from('orders').update({
      payment_status: 'paid',
      payment_reference: txRef || String(transactionId),
      status: 'paid',
      status_timeline: [
        ...(order.status_timeline || []),
        { status: 'paid', timestamp: new Date().toISOString(), note: 'Payment confirmed via Flutterwave' }
      ]
    }).eq('id', orderId)

    if (updateError) throw updateError

    const paidOrder = {
      ...order,
      payment_reference: txRef || String(transactionId),
      payment_status: 'paid',
      status: 'paid',
    }

    // Send notifications
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
