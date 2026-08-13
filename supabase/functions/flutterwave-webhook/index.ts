import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, buildEmailHtml, buildOrderDetailsHtml } from '../_shared/email.ts'
import { getAdminBaseUrl, getMailSender } from '../_shared/config.ts'

function normalizeStatusTimeline(timeline: unknown) {
  if (typeof timeline === 'string') {
    try {
      return JSON.parse(timeline)
    } catch {
      return []
    }
  }
  return Array.isArray(timeline) ? timeline : []
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  try {
    const flwWebhookHash = Deno.env.get('FLW_WEBHOOK_HASH')
    if (!flwWebhookHash) return new Response('Server misconfigured', { status: 500 })

    // Verify the webhook signature
    const signature = req.headers.get('verif-hash')
    if (!signature || signature !== flwWebhookHash) {
      return new Response('Invalid signature', { status: 401 })
    }

    const bodyText = await req.text()
    const event = JSON.parse(bodyText)

    if (event.event === 'charge.completed' && event.data.status === 'successful') {
      const transactionId = event.data.id
      const txRef = event.data.tx_ref
      const orderId = event.data.meta?.orderId

      if (orderId) {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Double-verify with Flutterwave API
        const flwSecretKey = Deno.env.get('FLW_SECRET_KEY')
        if (!flwSecretKey) return new Response('Server misconfigured', { status: 500 })
        const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
          headers: { Authorization: `Bearer ${flwSecretKey}` }
        })
        const verifyData = await verifyRes.json()
        if (!verifyRes.ok || verifyData.status !== 'success' || verifyData.data.status !== 'successful') {
          console.error('Webhook verification failed for transaction:', transactionId)
          return new Response('Verification failed', { status: 400 })
        }
        if (verifyData.data.tx_ref !== txRef || (verifyData.data.meta?.orderId && verifyData.data.meta.orderId !== orderId)) {
          return new Response('Payment reference mismatch', { status: 400 })
        }

        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()
        
        if (order && order.payment_status !== 'paid') {
          const paidAmount = Number(verifyData.data.amount)
          const paidCurrency = verifyData.data.currency

          if (!Number.isFinite(paidAmount) || Math.abs(paidAmount - Number(order.total)) > 0.01) {
            console.error('Flutterwave webhook amount mismatch:', { orderId, paidAmount, expected: order.total })
            return new Response('Amount mismatch', { status: 400 })
          }

          if (paidCurrency !== 'NGN') {
            console.error('Flutterwave webhook currency mismatch:', { orderId, paidCurrency })
            return new Response('Currency mismatch', { status: 400 })
          }

          const { data: finalized, error: finalizeError } = await supabaseAdmin.rpc('finalize_paid_order', {
            p_order_id: orderId,
            p_reference: txRef || String(transactionId),
            p_source: 'flutterwave_webhook',
          })
          if (finalizeError) throw finalizeError
          if (!finalized) return new Response('OK', { status: 200 })

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
            const fullOrder = order
            if (fullOrder) {
              const { fromEmail, fromName } = getMailSender()

              // Customer
              if (fullOrder.customer_email) {
                try {
                  await sendEmail({
                    to: fullOrder.customer_email,
                    subject: `Order Confirmed - ${fullOrder.order_number}`,
                    fromEmail, fromName, brevoApiKey,
                    htmlContent: buildEmailHtml({
                      heading: 'Payment Confirmed',
                      greetingName: fullOrder.customer_name,
                      bodyLines: [
                        `Your payment for ${fullOrder.order_number} has been confirmed.`,
                        'Our team is now preparing your request.',
                      ],
                      orderNumber: fullOrder.order_number,
                      detailsHtml: buildOrderDetailsHtml(paidOrder),
                    })
                  })
                } catch (e) { console.error('Webhook customer email error:', e) }
              }

              // Admin
              if (adminEmail) {
                try {
                  await sendEmail({
                    to: adminEmail,
                    subject: `WEBHOOK: PAID ORDER - ${fullOrder.order_number}`,
                    fromEmail, fromName, brevoApiKey,
                    htmlContent: buildEmailHtml({
                      heading: 'New Paid Order (Webhook)',
                      greetingName: 'Admin',
                      bodyLines: [
                        `Order ${fullOrder.order_number} has been successfully paid by ${fullOrder.customer_name}.`,
                        `Total received: N${Number(fullOrder.total).toLocaleString()}`,
                      ],
                      orderNumber: fullOrder.order_number,
                      detailsHtml: buildOrderDetailsHtml(paidOrder),
                      ctaLabel: 'View Order',
                      ctaUrl: `${getAdminBaseUrl()}/orders/${orderId}`,
                    })
                  })
                } catch (e) { console.error('Webhook admin email error:', e) }
              }
            }
          }
        }
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error: any) {
    return new Response(`Error: ${error.message}`, { status: 400 })
  }
})
