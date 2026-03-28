import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as crypto from 'https://deno.land/std@0.168.0/crypto/mod.ts'
import { sendEmail, buildEmailHtml } from '../_shared/email.ts'
import { getAdminBaseUrl, getMailSender } from '../_shared/config.ts'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  try {
    const webhookSecret = Deno.env.get('PAYSTACK_WEBHOOK_SECRET')
    if (!webhookSecret) return new Response('Server misconfigured', { status: 500 })

    const signature = req.headers.get('x-paystack-signature')
    if (!signature) return new Response('Invalid signature', { status: 400 })

    const bodyText = await req.text()
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    )
    const signedBuffer = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(bodyText))
    const expectedSignature = Array.from(new Uint8Array(signedBuffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')

    if (signature !== expectedSignature) {
      return new Response('Invalid signature', { status: 401 })
    }

    const event = JSON.parse(bodyText)

    if (event.event === 'charge.success') {
      const reference = event.data.reference
      const orderId = event.data.metadata?.orderId

      if (orderId) {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: order } = await supabaseAdmin.from('orders').select('payment_status').eq('id', orderId).single()
        
        if (order && order.payment_status !== 'paid') {
          await supabaseAdmin.from('orders').update({
            payment_status: 'paid',
            payment_reference: reference,
            status: 'paid',
          }).eq('id', orderId)

          // Send notifications
          const brevoApiKey = Deno.env.get('BREVO_API_KEY')
          const adminEmail = Deno.env.get('ADMIN_EMAIL')
          if (brevoApiKey) {
            const { data: fullOrder } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single()
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
                      bodyLines: [`Your payment for ${fullOrder.order_number} was successful via Paystack webhook.`],
                      orderNumber: fullOrder.order_number
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
                      bodyLines: [`Order ${fullOrder.order_number} paid via Paystack webhook.`],
                      orderNumber: fullOrder.order_number,
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
