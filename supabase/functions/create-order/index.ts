import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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
    
    // Create admin client for inventory and actual insert
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthenticated')

    const requestData = await req.json()
    const { items, customerName, customerPhone, customerAltPhone, customerEmail, deliveryAddress, notes } = requestData

    if (!items || !Array.isArray(items) || !items.length) {
      throw new Error('Cart is empty')
    }

    let subtotal = 0
    const orderItems: any[] = []

    for (const item of items) {
      if (!item.productId) throw new Error('ProductId required')
      const quantity = Number(item.quantity)
      if (quantity <= 0 || quantity > 20) throw new Error('Invalid quantity')

      const { data: product, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .single()
      
      if (error || !product) throw new Error(`Product ${item.productId} not found`)
      if (product.status !== 'active') throw new Error(`Product not available`)

      subtotal += product.price * quantity

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images?.[0]?.url || '',
        price: product.price,
        quantity,
        preferences: item.preferences || {}
      })
    }

    const { data: settings } = await supabaseAdmin.from('config').select('data').eq('id', 'settings').single()
    const shippingFee = settings?.data?.shippingFee || 0
    const total = subtotal + shippingFee

    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    const orderNumber = `AFJ-${timestamp}-${random}`

    const newOrder = {
      order_number: orderNumber,
      user_id: user.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_alt_phone: customerAltPhone || '',
      customer_email: customerEmail || '',
      delivery_address: deliveryAddress || {},
      items: orderItems,
      subtotal,
      shipping_fee: shippingFee,
      total,
      currency: 'NGN',
      payment_status: 'unpaid',
      status: 'pending_payment',
      status_timeline: [
        { status: 'pending_payment', timestamp: new Date().toISOString(), note: 'Order created' }
      ],
      notes: notes || ''
    }

    const { data: order, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert(newOrder)
      .select('id')
      .single()

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ success: true, orderId: order.id, orderNumber, total }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
