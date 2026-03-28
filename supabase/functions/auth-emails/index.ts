import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { sendEmail, buildEmailHtml } from '../_shared/email.ts'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  try {
    const { user, email_data } = await req.json()
    const { token, email_type, redirect_to } = email_data

    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    if (!brevoApiKey) throw new Error('BREVO_API_KEY not found')

    const fromEmail = 'noreply@afinju247.com'
    const fromName = 'AFINJU'
    
    let subject = ''
    let heading = ''
    let bodyLines: string[] = []
    let ctaLabel = ''
    let ctaUrl = ''

    switch (email_type) {
      case 'recovery':
        subject = 'Reset Your AFINJU Password'
        heading = 'Password Recovery'
        bodyLines = ['We received a request to reset your password. If you didn\'t make this request, you can safely ignore this email.']
        ctaLabel = 'Reset Password'
        ctaUrl = `${redirect_to}#token=${token}&type=recovery`
        break
      case 'magiclink':
        subject = 'Your AFINJU Magic Link'
        heading = 'Secure Sign In'
        bodyLines = ['Click the button below to sign in instantly to your AFINJU account.']
        ctaLabel = 'Sign In Now'
        ctaUrl = `${redirect_to}#token=${token}&type=magiclink`
        break
      case 'email_change':
        subject = 'Confirm Your New Email'
        heading = 'Email Update'
        bodyLines = ['Please confirm your new email address by clicking the link below.']
        ctaLabel = 'Confirm New Email'
        ctaUrl = `${redirect_to}#token=${token}&type=email_change`
        break
      case 'signup':
        subject = 'Welcome to AFINJU'
        heading = 'Account Confirmation'
        bodyLines = ['Thank you for joining AFINJU. Please confirm your account to get started.']
        ctaLabel = 'Confirm Account'
        ctaUrl = `${redirect_to}#token=${token}&type=signup`
        break
      default:
        console.warn('Unhandled email type:', email_type)
        return new Response(JSON.stringify({ message: 'Type not handled' }), { status: 200 })
    }

    await sendEmail({
      to: user.email,
      subject,
      fromEmail,
      fromName,
      brevoApiKey,
      htmlContent: buildEmailHtml({
        heading,
        greetingName: user.user_metadata?.full_name || 'there',
        bodyLines,
        ctaLabel,
        ctaUrl,
      }),
    })

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Auth Hook Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
