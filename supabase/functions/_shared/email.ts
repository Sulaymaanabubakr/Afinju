export async function sendEmail({
  to,
  subject,
  htmlContent,
  fromEmail,
  fromName,
  brevoApiKey,
}: {
  to: string
  subject: string
  htmlContent: string
  fromEmail: string
  fromName: string
  brevoApiKey: string
}) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': brevoApiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Brevo API Error:', error)
    throw new Error(`Failed to send email: ${error}`)
  }

  return await response.json()
}

export function buildEmailHtml({
  heading,
  greetingName,
  bodyLines,
  orderNumber,
  ctaLabel,
  ctaUrl,
  detailsHtml,
}: {
  heading: string
  greetingName?: string
  bodyLines: string[]
  orderNumber?: string
  ctaLabel?: string
  ctaUrl?: string
  detailsHtml?: string
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; line-height: 1.6;">
      <h1 style="color: #c5a059; font-size: 24px; margin-bottom: 30px; letter-spacing: 0.1em; text-transform: uppercase;">${heading}</h1>
      ${greetingName ? `<p style="font-size: 16px; margin-bottom: 20px;">Hello ${greetingName},</p>` : ''}
      <div style="margin-bottom: 30px;">
        ${bodyLines.map(line => `<p style="font-size: 15px; margin-bottom: 10px;">${line}</p>`).join('')}
      </div>
      ${orderNumber ? `<p style="font-size: 14px; color: #666; margin-bottom: 10px;">Order: <strong>${orderNumber}</strong></p>` : ''}
      ${detailsHtml ? `<div style="background: #f9f9f9; padding: 20px; border-radius: 4px; margin: 30px 0;">${detailsHtml}</div>` : ''}
      ${ctaLabel && ctaUrl ? `
        <div style="margin: 40px 0;">
          <a href="${ctaUrl}" style="background: #c5a059; color: #000; padding: 16px 32px; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase;">${ctaLabel}</a>
        </div>
      ` : ''}
      <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0;" />
      <p style="font-size: 12px; color: #999;">© 2026 AFÍNJÚ. All rights reserved.</p>
    </div>
  `
}
