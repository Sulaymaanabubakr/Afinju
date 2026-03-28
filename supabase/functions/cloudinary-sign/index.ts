import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as crypto from 'https://deno.land/std@0.168.0/crypto/mod.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { requireStaffUser } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    await requireStaffUser(req)

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is missing')
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const folder = 'afinju/products'
    const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
    const signatureBuffer = await crypto.subtle.digest(
      'SHA-1',
      new TextEncoder().encode(signatureBase)
    )
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')

    return new Response(
      JSON.stringify({ timestamp, signature, apiKey, cloudName }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    const message = error?.message || 'Unknown error'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

