import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function syncUsers() {
  console.log('Fetching auth users...')
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()
  if (authError) { console.error('Auth fetch error:', authError); return }

  console.log(`Found ${authData.users.length} auth users.`)

  for (const user of authData.users) {
    const { data: publicUser } = await supabaseAdmin.from('users').select('id').eq('id', user.id).single()
    if (!publicUser) {
      console.log(`User ${user.email} missing from public.users. Inserting...`)
      const { error: insertError } = await supabaseAdmin.from('users').insert({
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        phone: user.phone || '',
        role: 'customer'
      })
      if (insertError) {
        console.error(`Failed to insert ${user.email}:`, insertError.message)
      } else {
        console.log(`Successfully inserted ${user.email}`)
      }
    } else {
      console.log(`User ${user.email} already exists in public.users.`)
    }
  }
}

syncUsers()
