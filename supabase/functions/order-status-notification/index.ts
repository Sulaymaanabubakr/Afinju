import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail, buildEmailHtml } from '../_shared/email.ts'
import { requireStaffUser } from '../_shared/auth.ts'
import { getMailSender, getSiteBaseUrl } from '../_shared/config.ts'

const ORDER_STATUS_MESSAGES: Record<string, string> = {
  paid: 'Your commitment to the Afínjú brand has been recognized. Your payment has been successfully confirmed, and your Authority Set is now entering our artisanal workflow.',
  confirmed: 'Welcome to the club. Your order has been officially confirmed. Our team is now meticulously preparing your items for the next stage of our process.',
  packaging: 'Our artisans are currently preparing your Authority Set with the utmost care. Every piece is being inspected and packaged in our signature luxury presentation to ensure it arrives in perfect condition.',
  dispatched: 'Your Afínjú Authority Set has begun its journey. It has been securely dispatched and is currently in transit to your specified location. Prepare to command your space.',
  out_for_delivery: 'The final leg of the journey has begun. Our delivery partner is currently on-route to your location. Your authority is about to arrive.',
  delivered: 'The wait is over. Your Afínjú Authority Set has been delivered. We are honored to have you as a member of the elite who value true quality and style.',
  cancelled: 'We regret to inform you that your order has been cancelled. If you believe this is a mistake or require further assistance, our concierge team is standing by.',
  refunded: 'Your refund has been fully processed. The funds will be reflected in your original payment method within the standard banking timeframe.',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    const { supabaseAdmin } = await requireStaffUser(req)

    const { orderId, status, note } = await req.json()
    if (!orderId || !status) throw new Error('orderId and status required')

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !order) throw new Error('Order not found')
    if (!order.customer_email) {
      return new Response(JSON.stringify({ success: true, message: 'No customer email, skipping.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    if (!brevoApiKey) throw new Error('BREVO_API_KEY missing')

    const statusMessage = ORDER_STATUS_MESSAGES[status] || `Your order status has been updated to ${status.replace('_', ' ')}.`
    const { fromEmail, fromName } = getMailSender()
    
    await sendEmail({
      to: order.customer_email,
      subject: `Order Update: #${order.order_number} is now ${status.replace('_', ' ').toUpperCase()}`,
      fromEmail,
      fromName,
      brevoApiKey,
      htmlContent: buildEmailHtml({
        heading: 'Order Update',
        greetingName: order.customer_name,
        bodyLines: [
          statusMessage,
          note ? `<strong>Note from our team:</strong> "${note}"` : '',
        ].filter(Boolean),
        orderNumber: order.order_number,
        ctaLabel: 'View Order Details',
        ctaUrl: `${getSiteBaseUrl()}/account/orders/${orderId}`,
      }),
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    const status = error?.message === 'Unauthorized' ? 401 : error?.message === 'Forbidden' ? 403 : 400
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    })
  }
})
