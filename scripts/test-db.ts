import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function checkProducts() {
  console.log("Fetching products as anonymous user (checking RLS)...")
  const { data: anonData, error: anonError } = await supabase.from('products').select('*')
  console.log("Anon Result:", anonData?.length, "products. Error:", anonError?.message || 'None')

  console.log("\nFetching products as service role...")
  const adminClient = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: adminData, error: adminError } = await adminClient.from('products').select('*')
  console.log("Admin Result:", adminData?.length, "products. Error:", adminError?.message || 'None')
}

checkProducts()
