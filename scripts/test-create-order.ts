import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!)

async function testOrder() {
  const tempEmail = 'testorder_2026@afinju.com'
  const password = 'password123'
  
  const res = await supabase.auth.signInWithPassword({ email: tempEmail, password })
  const session = res.data.session
  
  const { data: product } = await supabase.from('products').select('id').limit(1).single()

  const payload = {
    customerName: 'Test Buyer',
    customerPhone: '08000000000',
    deliveryAddress: { fullAddress: '123 Test St', city: 'Test', state: 'Lagos' },
    items: [{
      productId: product!.id,
      quantity: 1,
      preferences: { preferredColor: 'Black', shoeSize: '40', headSize: 'M' }
    }],
    notes: 'Testing order endpoint'
  }

  console.log('Fetching raw Edge Function endpoint...')
  const fetchRes = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session!.access_token}`,
      'apikey': process.env.VITE_SUPABASE_ANON_KEY!
    },
    body: JSON.stringify(payload)
  })

  console.log('Status:', fetchRes.status)
  console.log('Raw body:', await fetchRes.text())
}

testOrder()
