import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail, buildEmailHtml } from '../_shared/email.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    const adminEmail = Deno.env.get('ADMIN_EMAIL')

    if (!brevoApiKey || !adminEmail) {
      throw new Error(`Configuration missing: BREVO_API_KEY: ${!!brevoApiKey}, ADMIN_EMAIL: ${!!adminEmail}`)
    }

    const fromEmail = 'noreply@afinju247.com'
    const fromName = 'AFINJU TEST'

    await sendEmail({
      to: adminEmail,
      subject: `🚨 TEST NOTIFICATION - Setup Verified`,
      fromEmail,
      fromName,
      brevoApiKey,
      htmlContent: buildEmailHtml({
        heading: 'Email System Verified',
        greetingName: 'Admin',
        bodyLines: [
          'This is a test notification from your Afínjú Dashboard.',
          'If you are reading this, your Brevo API key and Supabase secrets are correctly configured.',
          `Timestamp: ${new Date().toLocaleString()}`,
        ],
        ctaLabel: 'Open Dashboard',
        ctaUrl: 'https://afinju247.com/admin',
      }),
    })

    return new Response(
      JSON.stringify({ success: true, message: `Test email sent to ${adminEmail}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
