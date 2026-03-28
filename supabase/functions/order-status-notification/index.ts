import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail, buildEmailHtml } from '../_shared/email.ts'

const ORDER_STATUS_MESSAGES: Record<string, string> = {
  paid: 'Your payment has been successfully confirmed. We are now processing your order.',
  confirmed: 'Your order has been confirmed and is being prepared.',
  packaging: 'We are currently packaging your authority set with care.',
  dispatched: 'Your order has been dispatched! It is on its way to you.',
  out_for_delivery: 'Our delivery partner is currently out with your package.',
  delivered: 'Your Afínjú Authority Set has been delivered. Welcome to the club.',
  cancelled: 'Your order has been cancelled.',
  refunded: 'Your refund has been processed.',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
    
    await sendEmail({
      to: order.customer_email,
      subject: `Order Update: #${order.order_number} is now ${status.replace('_', ' ').toUpperCase()}`,
      fromEmail: 'noreply@afinju247.com',
      fromName: 'AFINJU',
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
        ctaUrl: `https://afinju247.com/orders/${orderId}`,
      }),
    })

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
