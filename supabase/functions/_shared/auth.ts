import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getSupabaseUrl() {
  return Deno.env.get('SUPABASE_URL') ?? ''
}

function getAnonKey() {
  return Deno.env.get('SUPABASE_ANON_KEY') ?? ''
}

function getServiceRoleKey() {
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
}

export async function getRequestUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Missing Authorization header')

  const supabaseClient = createClient(getSupabaseUrl(), getAnonKey(), {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser()

  if (error || !user) throw new Error('Unauthorized')
  return user
}

export async function requireStaffUser(req: Request) {
  const user = await getRequestUser(req)
  const supabaseAdmin = createClient(getSupabaseUrl(), getServiceRoleKey())

  const { data: profile, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile) throw new Error('Forbidden')
  if (profile.role !== 'admin' && profile.role !== 'staff') throw new Error('Forbidden')

  return { user, profile, supabaseAdmin }
}

