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

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatCurrency(amount: unknown) {
  const numericAmount = Number(amount || 0)
  return `N${numericAmount.toLocaleString()}`
}

export function buildOrderDetailsHtml(order: any) {
  const items = Array.isArray(order?.items) ? order.items : []
  const address = order?.delivery_address || {}
  const addressLines = [
    address.fullAddress,
    [address.city, address.state].filter(Boolean).join(', '),
    address.landmark ? `Landmark: ${address.landmark}` : '',
  ].filter(Boolean)

  const itemRows = items.map((item: any) => {
    const preferences = item?.preferences || {}
    const preferenceLines = [
      preferences.preferredColor ? `Colour: ${preferences.preferredColor}` : '',
      preferences.shoeSize ? `Shoe Size: ${preferences.shoeSize}` : '',
      preferences.headSize ? `Head Size: ${preferences.headSize}` : '',
    ].filter(Boolean)

    return `
      <tr>
        <td style="padding: 14px 0; border-bottom: 1px solid #ece7db; vertical-align: top;">
          <div style="font-size: 14px; color: #1a1a1a; font-weight: 600;">${escapeHtml(item?.productName || 'Product')}</div>
          ${preferenceLines.length ? `<div style="margin-top: 6px; font-size: 12px; color: #6b675f; line-height: 1.6;">${preferenceLines.map(line => escapeHtml(line)).join('<br>')}</div>` : ''}
        </td>
        <td style="padding: 14px 0; border-bottom: 1px solid #ece7db; text-align: center; font-size: 13px; color: #444;">${escapeHtml(item?.quantity || 0)}</td>
        <td style="padding: 14px 0; border-bottom: 1px solid #ece7db; text-align: right; font-size: 13px; color: #444;">${formatCurrency(item?.price || 0)}</td>
      </tr>
    `
  }).join('')

  return `
    <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a6c2f; margin-bottom: 18px;">
      Order Details
    </div>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
      <tr>
        <td style="padding: 0 0 10px 0; font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.08em;">Customer</td>
        <td style="padding: 0 0 10px 0; font-size: 14px; color: #1a1a1a; text-align: right;">${escapeHtml(order?.customer_name || '-')}</td>
      </tr>
      <tr>
        <td style="padding: 0 0 10px 0; font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.08em;">Phone</td>
        <td style="padding: 0 0 10px 0; font-size: 14px; color: #1a1a1a; text-align: right;">${escapeHtml(order?.customer_phone || '-')}</td>
      </tr>
      ${order?.customer_email ? `
      <tr>
        <td style="padding: 0 0 10px 0; font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.08em;">Email</td>
        <td style="padding: 0 0 10px 0; font-size: 14px; color: #1a1a1a; text-align: right;">${escapeHtml(order.customer_email)}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 0; font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.08em;">Payment Ref</td>
        <td style="padding: 0; font-size: 14px; color: #1a1a1a; text-align: right;">${escapeHtml(order?.payment_reference || '-')}</td>
      </tr>
    </table>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
      <tr>
        <td style="padding-bottom: 10px; font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.08em;">Delivery Address</td>
      </tr>
      <tr>
        <td style="font-size: 14px; color: #1a1a1a; line-height: 1.7;">${addressLines.length ? addressLines.map(line => escapeHtml(line)).join('<br>') : '-'}</td>
      </tr>
    </table>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <th align="left" style="padding: 0 0 10px 0; border-bottom: 1px solid #d9d2c2; font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.08em;">Items</th>
        <th align="center" style="padding: 0 0 10px 0; border-bottom: 1px solid #d9d2c2; font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.08em;">Qty</th>
        <th align="right" style="padding: 0 0 10px 0; border-bottom: 1px solid #d9d2c2; font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.08em;">Price</th>
      </tr>
      ${itemRows}
    </table>

    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding: 0 0 8px 0; font-size: 13px; color: #555;">Subtotal</td>
        <td style="padding: 0 0 8px 0; font-size: 13px; color: #555; text-align: right;">${formatCurrency(order?.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding: 0 0 8px 0; font-size: 13px; color: #555;">Shipping</td>
        <td style="padding: 0 0 8px 0; font-size: 13px; color: #555; text-align: right;">${formatCurrency(order?.shipping_fee)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0 0 0; border-top: 1px solid #d9d2c2; font-size: 14px; color: #1a1a1a; font-weight: 700;">Total Paid</td>
        <td style="padding: 8px 0 0 0; border-top: 1px solid #d9d2c2; font-size: 14px; color: #1a1a1a; font-weight: 700; text-align: right;">${formatCurrency(order?.total)}</td>
      </tr>
    </table>
  `
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
  const gold = '#c5a059'
  const offWhite = '#fdfbf7'
  const dark = '#1a1a1a'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@300;400;600&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${offWhite}; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${offWhite};">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              <!-- Header / Logo -->
              <tr>
                <td align="center" style="padding: 40px 0 20px 0;">
                  <div style="font-family: 'DM Serif Display', serif; font-size: 32px; color: ${dark}; letter-spacing: 0.15em; text-transform: uppercase; border-bottom: 2px solid ${gold}; display: inline-block; padding-bottom: 5px;">
                    AFÍNJÚ
                  </div>
                  <div style="font-size: 10px; color: ${gold}; letter-spacing: 0.4em; margin-top: 10px; text-transform: uppercase;">
                    The Authority Set
                  </div>
                </td>
              </tr>

              <!-- Hero Heading -->
              <tr>
                <td align="center" style="padding: 40px 40px 20px 40px;">
                  <h1 style="font-family: 'DM Serif Display', serif; color: ${dark}; font-size: 28px; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">
                    ${heading}
                  </h1>
                </td>
              </tr>

              <!-- Greeting & Body -->
              <tr>
                <td style="padding: 20px 60px;">
                  ${greetingName ? `<p style="font-size: 16px; color: ${dark}; margin-bottom: 24px; font-weight: 500;">Hello ${greetingName},</p>` : ''}
                  <div style="font-size: 15px; color: #444; line-height: 1.8;">
                    ${bodyLines.map(line => `<p style="margin-bottom: 16px;">${line}</p>`).join('')}
                  </div>
                </td>
              </tr>

              <!-- Order Number -->
              ${orderNumber ? `
              <tr>
                <td align="center" style="padding: 0 60px 40px 60px;">
                  <div style="padding: 15px; border: 1px dashed ${gold}; background-color: #fcfaf5; display: inline-block;">
                    <span style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">Order Ref</span>
                    <strong style="font-size: 18px; color: ${dark}; letter-spacing: 0.05em;">#${orderNumber}</strong>
                  </div>
                </td>
              </tr>
              ` : ''}

              <!-- Details Section -->
              ${detailsHtml ? `
              <tr>
                <td style="padding: 0 60px 40px 60px;">
                  <div style="background-color: #fafafa; padding: 30px; border-radius: 4px;">
                    ${detailsHtml}
                  </div>
                </td>
              </tr>
              ` : ''}

              <!-- CTA Button -->
              ${ctaLabel && ctaUrl ? `
              <tr>
                <td align="center" style="padding: 0 60px 60px 60px;">
                  <a href="${ctaUrl}" style="background-color: ${dark}; color: #ffffff; padding: 20px 40px; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; display: inline-block; transition: background 0.3s;">
                    ${ctaLabel}
                  </a>
                </td>
              </tr>
              ` : ''}

              <!-- Footer -->
              <tr>
                <td align="center" style="padding: 40px; background-color: #fdfdfd; border-top: 1px solid #f5f5f5;">
                  <p style="font-size: 11px; color: #999; margin: 0; letter-spacing: 0.1em; text-transform: uppercase;">
                    © 2026 AFÍNJÚ LUXURY. All rights reserved.
                  </p>
                  <p style="font-size: 10px; color: #bbb; margin-top: 10px; line-height: 1.6;">
                    You are receiving this because you placed an order at afinju247.com.<br>
                    Please do not reply directly to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
