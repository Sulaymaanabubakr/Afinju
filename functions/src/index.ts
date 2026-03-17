import * as admin from 'firebase-admin'
import axios from 'axios'
import { v2 as cloudinary } from 'cloudinary'
import { defineString } from 'firebase-functions/params'
import { logger } from 'firebase-functions/logger'
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'

admin.initializeApp()
const db = admin.firestore()

const PAYSTACK_SECRET_KEY = defineString('PAYSTACK_SECRET_KEY', { default: '' })
const PAYSTACK_WEBHOOK_SECRET = defineString('PAYSTACK_WEBHOOK_SECRET', { default: '' })
const BREVO_API_KEY = defineString('BREVO_API_KEY', { default: '' })
const ADMIN_EMAIL_PARAM = defineString('ADMIN_EMAIL', { default: 'admin@afinju.com' })
const ADMIN_DASHBOARD_BASE_URL_PARAM = defineString('ADMIN_DASHBOARD_BASE_URL', {
  default: 'https://afinju247.com/admin',
})
const MAIL_FROM_EMAIL_PARAM = defineString('MAIL_FROM_EMAIL', { default: 'noreply@afinju247.com' })
const MAIL_FROM_NAME_PARAM = defineString('MAIL_FROM_NAME', { default: 'AFINJU' })
const CLOUDINARY_CLOUD_NAME = defineString('CLOUDINARY_CLOUD_NAME', { default: '' })
const CLOUDINARY_API_KEY = defineString('CLOUDINARY_API_KEY', { default: '' })
const CLOUDINARY_API_SECRET = defineString('CLOUDINARY_API_SECRET', { default: '' })
const BOOTSTRAP_SECRET = defineString('BOOTSTRAP_SECRET', { default: '' })

function readParam(param: { value: () => string }, fallback = ''): string {
  try {
    const value = param.value()
    return value || fallback
  } catch {
    return fallback
  }
}

function getPaystackSecret(): string {
  return readParam(PAYSTACK_SECRET_KEY, process.env.PAYSTACK_SECRET_KEY || '')
}

function getWebhookSecret(): string {
  return readParam(PAYSTACK_WEBHOOK_SECRET, process.env.PAYSTACK_WEBHOOK_SECRET || '')
}

function getAdminEmail(): string {
  return readParam(ADMIN_EMAIL_PARAM, process.env.ADMIN_EMAIL || 'admin@afinju.com')
}

function getAdminDashboardBaseUrl(): string {
  return readParam(
    ADMIN_DASHBOARD_BASE_URL_PARAM,
    process.env.ADMIN_DASHBOARD_BASE_URL || 'https://afinju247.com/admin'
  )
}

function normalizeSecret(raw: string): string {
  const value = (raw || '').trim()
  if (!value) return ''
  const lowered = value.toLowerCase()
  if (['disabled', 'none', 'null', 'false', '0'].includes(lowered)) return ''
  return value
}

function getBrevoApiKey(): string {
  return normalizeSecret(readParam(BREVO_API_KEY, process.env.BREVO_API_KEY || ''))
}

function getMailFromEmail(): string {
  return readParam(MAIL_FROM_EMAIL_PARAM, process.env.MAIL_FROM_EMAIL || 'noreply@afinju247.com')
}

function getMailFromName(): string {
  return readParam(MAIL_FROM_NAME_PARAM, process.env.MAIL_FROM_NAME || 'AFINJU')
}

function parseFrom(from: string): { email: string; name?: string } {
  const match = from.match(/^(.*)<([^>]+)>$/)
  if (!match) return { email: from.trim() }
  const name = match[1].trim().replace(/^"|"$/g, '')
  const email = match[2].trim()
  return { email, ...(name ? { name } : {}) }
}

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

async function resolveCustomerEmail(order: any): Promise<string | null> {
  if (isValidEmail(order?.customerEmail)) return order.customerEmail.trim()

  const userId = typeof order?.userId === 'string' ? order.userId.trim() : ''
  if (!userId) return null

  try {
    const user = await admin.auth().getUser(userId)
    if (isValidEmail(user.email)) return user.email.trim()
  } catch (err: any) {
    logger.warn('Could not resolve customer email from auth user', {
      userId,
      error: err?.message || 'unknown',
    })
  }

  return null
}

function statusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function statusEmailCopy(status: string): { title: string; message: string } {
  const map: Record<string, { title: string; message: string }> = {
    pending_payment: {
      title: 'Order Received',
      message: 'Your request has been received and reserved briefly while payment is confirmed.',
    },
    paid: {
      title: 'Payment Confirmed',
      message: 'Payment is confirmed. Your set is now in private preparation.',
    },
    confirmed: {
      title: 'Order Confirmed',
      message: 'Your order has been formally confirmed and moved to production.',
    },
    packaging: {
      title: 'Now Packaging',
      message: 'Your pieces are being hand-finished and packaged.',
    },
    dispatched: {
      title: 'Order Dispatched',
      message: 'Your order has left our studio and is in transit.',
    },
    out_for_delivery: {
      title: 'Out For Delivery',
      message: 'Your order is with the final courier for delivery today.',
    },
    delivered: {
      title: 'Delivered',
      message: 'Delivery is complete. We trust it arrived in excellent condition.',
    },
    cancelled: {
      title: 'Order Cancelled',
      message: 'This order has been cancelled. Our concierge can assist with next steps.',
    },
    refunded: {
      title: 'Refund Processed',
      message: 'A refund has been issued for this order.',
    },
  }

  return map[status] || {
    title: `Status Updated: ${statusLabel(status)}`,
    message: `Your order status has been updated to ${statusLabel(status)}.`,
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildEmailHtml(args: {
  heading: string
  greetingName?: string
  bodyLines: string[]
  orderNumber?: string
  detailsHtml?: string
  ctaLabel?: string
  ctaUrl?: string
}): string {
  const heading = escapeHtml(args.heading)
  const greetingName = escapeHtml(args.greetingName || 'Valued Customer')
  const body = args.bodyLines
    .map((line) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#d5c6a1;">${escapeHtml(line)}</p>`)
    .join('')
  const orderLine = args.orderNumber
    ? `<p style="margin:20px 0 0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#b89a5f;">Order Number</p><p style="margin:6px 0 0;font-size:16px;font-family:Georgia,'Times New Roman',serif;color:#f6e6bf;">${escapeHtml(args.orderNumber)}</p>`
    : ''
  const detailsHtml = args.detailsHtml || ''
  const ctaHtml =
    args.ctaLabel && args.ctaUrl
      ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:22px;">
          <tr>
            <td style="background:#b89a5f;">
              <a href="${escapeHtml(args.ctaUrl)}" style="display:inline-block;padding:12px 18px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#111111;text-decoration:none;font-weight:700;">${escapeHtml(args.ctaLabel)}</a>
            </td>
          </tr>
        </table>`
      : ''

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:26px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#101010;border:1px solid #4a3a1f;">
            <tr>
              <td style="padding:0;background:#101010;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="height:4px;background:#b89a5f;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 6px;text-align:center;">
                <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#b89a5f;">AFINJU</p>
                <p style="margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8f7a4a;">Authority Set</p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 20px;">
                <h1 style="margin:0 0 18px;font-size:31px;line-height:1.22;font-weight:500;font-family:Georgia,'Times New Roman',serif;color:#f6e6bf;">${heading}</h1>
                <p style="margin:0 0 16px;font-size:15px;color:#efe4cb;">Dear ${greetingName},</p>
                ${body}
                ${orderLine}
                ${detailsHtml}
                ${ctaHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <hr style="border:none;border-top:1px solid #4a3a1f;margin:0 0 14px;" />
                <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.13em;text-transform:uppercase;color:#8f7a4a;">Crafted for Men of Authority</p>
                <p style="margin:0;font-size:12px;color:#7f7f7f;">AFINJU Concierge</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function formatNaira(value: unknown): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'N0'
  return `N${amount.toLocaleString()}`
}

function getAdminOrderUrl(orderId: string): string {
  const base = getAdminDashboardBaseUrl().trim().replace(/\/+$/, '')
  const adminBase = base.endsWith('/admin') ? base : `${base}/admin`
  return `${adminBase}/orders/${encodeURIComponent(orderId)}`
}

function formatPreferenceKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatOrderCreatedAt(value: any): string {
  try {
    if (value?.toDate && typeof value.toDate === 'function') {
      return value.toDate().toLocaleString()
    }
    if (value instanceof Date) {
      return value.toLocaleString()
    }
  } catch {
    // Ignore formatting failure and return a neutral fallback.
  }
  return 'Just now'
}

function buildAdminOrderDetailsHtml(order: any): string {
  const items = Array.isArray(order?.items) ? order.items : []
  const itemRows = items
    .map((item: any, index: number) => {
      const preferences =
        item?.preferences && typeof item.preferences === 'object'
          ? Object.entries(item.preferences)
              .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
              .map(([k, v]) => `${formatPreferenceKey(k)}: ${String(v)}`)
              .join(' | ')
          : ''

      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;vertical-align:top;color:#efe4cb;font-size:14px;line-height:1.5;">
          <strong style="color:#f6e6bf;">${index + 1}. ${escapeHtml(item?.productName || 'Item')}</strong><br/>
          Qty: ${escapeHtml(item?.quantity ?? 1)} · Unit: ${escapeHtml(formatNaira(item?.price))} · Subtotal: ${escapeHtml(formatNaira(Number(item?.price || 0) * Number(item?.quantity || 1)))}<br/>
          ${preferences ? `Preferences: ${escapeHtml(preferences)}` : 'Preferences: None'}
        </td>
      </tr>`
    })
    .join('')

  const address = [
    order?.deliveryAddress?.fullAddress,
    order?.deliveryAddress?.city,
    order?.deliveryAddress?.state,
    order?.deliveryAddress?.landmark ? `Landmark: ${order.deliveryAddress.landmark}` : '',
  ]
    .filter(Boolean)
    .join(', ')

  return `
    <div style="margin-top:22px;padding:16px;border:1px solid #3a2f1e;background:#0f0f0f;">
      <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#b89a5f;">Customer</p>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#d5c6a1;">
        ${escapeHtml(order?.customerName || 'Unknown')}<br/>
        Email: ${escapeHtml(order?.customerEmail || 'N/A')}<br/>
        Phone: ${escapeHtml(order?.customerPhone || 'N/A')}${order?.customerAltPhone ? `<br/>Alt Phone: ${escapeHtml(order.customerAltPhone)}` : ''}
      </p>
      <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#b89a5f;">Delivery Address</p>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#d5c6a1;">${escapeHtml(address || 'N/A')}</p>
      <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#b89a5f;">Order Items</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${itemRows || '<tr><td style="color:#d5c6a1;">No items.</td></tr>'}</table>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.7;color:#efe4cb;">
        Subtotal: ${escapeHtml(formatNaira(order?.subtotal))}<br/>
        Shipping: ${escapeHtml(formatNaira(order?.shippingFee))}<br/>
        <strong style="color:#f6e6bf;">Total: ${escapeHtml(formatNaira(order?.total))}</strong><br/>
        Payment: ${escapeHtml(String(order?.paymentStatus || 'unpaid'))} · Status: ${escapeHtml(String(order?.status || 'pending_payment'))}<br/>
        Created: ${escapeHtml(formatOrderCreatedAt(order?.createdAt))}
      </p>
      ${order?.notes ? `<p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#d5c6a1;"><strong style="color:#f6e6bf;">Customer Note:</strong> ${escapeHtml(order.notes)}</p>` : ''}
    </div>
  `
}

async function sendTransactionalEmail(args: {
  brevoApiKey: string
  from: string
  to: string
  subject: string
  html: string
}): Promise<void> {
  const { brevoApiKey, from, to, subject, html } = args
  if (brevoApiKey) {
    const sender = parseFrom(from)
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': brevoApiKey,
        },
        timeout: 10000,
      }
    )
    return
  }
  throw new Error('No email provider configured (BREVO_API_KEY missing)')
}

function configureCloudinary(): void {
  cloudinary.config({
    cloud_name: readParam(CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_CLOUD_NAME || ''),
    api_key: readParam(CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_KEY || ''),
    api_secret: readParam(CLOUDINARY_API_SECRET, process.env.CLOUDINARY_API_SECRET || ''),
    secure: true,
  })
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `AFJ-${timestamp}-${random}`
}

function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as T
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, sanitizeForFirestore(v)])
    return Object.fromEntries(entries) as T
  }
  return value
}

function normalizeInventory(product: any): { limit: number; sold: number } {
  const rawLimit = Number(product?.inventory?.launchEditionLimit)
  const sold = Number(product?.inventory?.soldCount ?? 0)
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : Number.MAX_SAFE_INTEGER
  return {
    limit,
    sold: Number.isFinite(sold) && sold >= 0 ? sold : 0,
  }
}

function validateQuantity(input: unknown): number {
  const quantity = Number(input)
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 20) {
    throw new HttpsError('invalid-argument', 'Each item quantity must be an integer between 1 and 20.')
  }
  return quantity
}

async function verifyPaystackPayment(reference: string): Promise<{
  status: boolean
  amount: number
  currency: string
  metadata?: any
}> {
  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${getPaystackSecret()}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  )

  const data = response.data?.data
  if (!data || data.status !== 'success') {
    throw new Error(`Payment not successful. Status: ${data?.status || 'unknown'}`)
  }

  return {
    status: true,
    amount: data.amount / 100,
    currency: data.currency,
    metadata: data.metadata,
  }
}

export const createOrder = onCall(
  { region: 'europe-west1', timeoutSeconds: 30 },
  async (request: any) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to create an order.')
    }

    const {
      items,
      customerName,
      customerPhone,
      customerAltPhone,
      customerEmail,
      deliveryAddress,
      notes,
    } = request.data || {}

    if (!items || !Array.isArray(items) || !items.length) {
      throw new HttpsError('invalid-argument', 'Cart is empty')
    }

    let subtotal = 0
    const orderItems: any[] = []

    for (const item of items) {
      if (!item || typeof item.productId !== 'string' || !item.productId.trim()) {
        throw new HttpsError('invalid-argument', 'Each cart item must include a valid productId.')
      }
      const quantity = validateQuantity(item.quantity)

      const productDoc = await db.collection('products').doc(item.productId).get()
      if (!productDoc.exists) {
        throw new HttpsError('not-found', `Product ${item.productId} not found`)
      }

      const product = productDoc.data()!
      if (product.status !== 'active') {
        throw new HttpsError('failed-precondition', `Product ${product.name} is not available`)
      }

      const itemTotal = product.price * quantity
      subtotal += itemTotal

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images?.[0]?.url || '',
        price: product.price,
        quantity,
        preferences: sanitizeForFirestore(item.preferences || {}),
      })
    }

    const settingsDoc = await db.collection('config').doc('settings').get()
    const settings = settingsDoc.exists ? settingsDoc.data()! : { shippingFee: 0 }
    const shippingFee = settings.shippingFee || 0
    const total = subtotal + shippingFee

    const orderNumber = generateOrderNumber()
    const newOrder = {
      orderNumber,
      userId: request.auth.uid,
      customerName,
      customerPhone,
      customerAltPhone: customerAltPhone || '',
      customerEmail: customerEmail || '',
      deliveryAddress: sanitizeForFirestore({
        fullAddress: deliveryAddress?.fullAddress || '',
        city: deliveryAddress?.city || '',
        state: deliveryAddress?.state || '',
        landmark: deliveryAddress?.landmark || '',
      }),
      items: orderItems,
      subtotal,
      shippingFee,
      total,
      currency: 'NGN',
      paymentStatus: 'unpaid',
      status: 'pending_payment',
      statusTimeline: [
        {
          status: 'pending_payment',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          note: 'Order created, awaiting payment.',
        },
      ],
      notes: notes || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const orderRef = await db.collection('orders').add(sanitizeForFirestore(newOrder))
    logger.info(`Order ${orderNumber} securely created by user ${request.auth.uid}`, { orderId: orderRef.id })

    return {
      success: true,
      orderId: orderRef.id,
      orderNumber,
      total,
    }
  }
)

export const verifyPayment = onCall(
  { region: 'europe-west1', timeoutSeconds: 30 },
  async (request: any) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.')
    }

    const { reference, orderId } = request.data || {}
    if (!reference || !orderId) {
      throw new HttpsError('invalid-argument', 'Reference and orderId are required.')
    }

    const orderRef = db.collection('orders').doc(orderId)
    const orderSnap = await orderRef.get()
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', 'Order not found.')
    }

    const order = orderSnap.data()!
    if (order.userId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Access denied.')
    }
    if (order.paymentStatus === 'paid') {
      return { success: true, alreadyPaid: true }
    }

    const duplicateRefSnap = await db
      .collection('orders')
      .where('paymentReference', '==', reference)
      .where('paymentStatus', '==', 'paid')
      .limit(1)
      .get()
    if (!duplicateRefSnap.empty && duplicateRefSnap.docs[0].id !== orderId) {
      throw new HttpsError('failed-precondition', 'Payment reference has already been used.')
    }

    let paymentData: Awaited<ReturnType<typeof verifyPaystackPayment>>
    try {
      paymentData = await verifyPaystackPayment(reference)
    } catch (err: any) {
      logger.error('Paystack verification failed', { reference, orderId, error: err.message })
      throw new HttpsError('failed-precondition', `Payment could not be verified: ${err.message}`)
    }

    const expectedAmount = order.total
    if (Math.abs(paymentData.amount - expectedAmount) > 1) {
      logger.error('Amount mismatch', { paid: paymentData.amount, expected: expectedAmount, orderId })
      throw new HttpsError(
        'failed-precondition',
        `Payment amount mismatch. Expected N${expectedAmount}, received N${paymentData.amount}.`
      )
    }
    if (paymentData.currency !== 'NGN') {
      throw new HttpsError('failed-precondition', `Unexpected payment currency: ${paymentData.currency}`)
    }
    if (paymentData.metadata?.orderId && paymentData.metadata.orderId !== orderId) {
      throw new HttpsError('failed-precondition', 'Payment metadata does not match this order.')
    }

    try {
      await db.runTransaction(async (tx) => {
        const freshSnap = await tx.get(orderRef)
        if (!freshSnap.exists) throw new Error('Order disappeared')
        const fresh = freshSnap.data()!
        if (fresh.paymentStatus === 'paid') return

        const paymentReferenceRef = db.collection('payment_references').doc(reference)
        const paymentReferenceSnap = await tx.get(paymentReferenceRef)
        if (paymentReferenceSnap.exists) {
          const lockedOrderId = paymentReferenceSnap.data()?.orderId
          if (lockedOrderId !== orderId) {
            throw new Error('Payment reference has already been used.')
          }
        }

        const productUpdates: Array<{ ref: FirebaseFirestore.DocumentReference; quantity: number }> = []
        for (const item of fresh.items || []) {
          const quantity = Number(item.quantity)
          if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error(`Invalid quantity for ${item.productName || item.productId}`)
          }

          const productRef = db.collection('products').doc(item.productId)
          const productSnap = await tx.get(productRef)
          if (!productSnap.exists) throw new Error(`Product ${item.productId} not found`)
          const product = productSnap.data()!
          const { limit, sold } = normalizeInventory(product)
          const remaining = limit - sold
          if (remaining < quantity) {
            throw new Error(`Insufficient stock for ${item.productName}. Only ${Math.max(0, remaining)} unit(s) remain.`)
          }

          productUpdates.push({ ref: productRef, quantity })
        }

        const newTimeline = [
          ...(fresh.statusTimeline || []),
          {
            status: 'paid',
            timestamp: new Date(),
            note: `Payment of N${paymentData.amount.toLocaleString()} confirmed via Paystack. Reference: ${reference}`,
          },
        ]

        if (!paymentReferenceSnap.exists) {
          tx.set(paymentReferenceRef, {
            orderId,
            userId: request.auth.uid,
            source: 'callable',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        }

        for (const update of productUpdates) {
          tx.update(update.ref, {
            'inventory.soldCount': admin.firestore.FieldValue.increment(update.quantity),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        }

        tx.update(orderRef, {
          paymentStatus: 'paid',
          paymentReference: reference,
          status: 'paid',
          statusTimeline: newTimeline,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        tx.set(db.collection('audit_logs').doc(), {
          type: 'payment_confirmed',
          orderId,
          userId: request.auth.uid,
          reference,
          amount: paymentData.amount,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })
      })
    } catch (err: any) {
      const message = err?.message || 'Unknown transaction failure'
      logger.error('verifyPayment transaction failed', { orderId, reference, message })
      if (
        message.includes('Insufficient stock') ||
        message.includes('already been used') ||
        message.includes('not found') ||
        message.includes('Invalid quantity')
      ) {
        throw new HttpsError('failed-precondition', message)
      }
      throw new HttpsError('internal', 'Payment verified, but order finalization failed. Please contact support.')
    }

    logger.info('Order paid successfully', { orderId, reference })
    return { success: true }
  }
)

export const paystackWebhook = onRequest(
  { region: 'europe-west1' },
  async (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }

    const webhookSecret = getWebhookSecret()
    if (!webhookSecret) {
      logger.error('PAYSTACK_WEBHOOK_SECRET missing')
      res.status(500).send('Server misconfigured')
      return
    }

    const crypto = await import('crypto')
    const hash = crypto
      .createHmac('sha512', webhookSecret)
      .update(req.rawBody || JSON.stringify(req.body))
      .digest('hex')
    const receivedSignatureHeader = req.headers['x-paystack-signature']
    const receivedSignature = Array.isArray(receivedSignatureHeader)
      ? receivedSignatureHeader[0]
      : receivedSignatureHeader
    if (typeof receivedSignature !== 'string') {
      logger.warn('Missing webhook signature')
      res.status(400).send('Invalid signature')
      return
    }
    const expectedSig = Buffer.from(hash, 'hex')
    const providedSig = Buffer.from(receivedSignature, 'hex')
    if (
      expectedSig.length !== providedSig.length ||
      !crypto.timingSafeEqual(expectedSig, providedSig)
    ) {
      logger.warn('Invalid webhook signature')
      res.status(400).send('Invalid signature')
      return
    }

    const event = req.body
    logger.info('Paystack webhook received', { event: event?.event })

    if (event?.event === 'charge.success') {
      const reference = event.data?.reference
      const metadata = event.data?.metadata

      if (!reference || !metadata?.orderId) {
        res.status(200).send('OK')
        return
      }

      const orderId = metadata.orderId
      const orderRef = db.collection('orders').doc(orderId)
      const orderSnap = await orderRef.get()
      if (!orderSnap.exists) {
        logger.warn('Webhook: order not found', { orderId })
        res.status(200).send('OK')
        return
      }

      const order = orderSnap.data()!
      if (order.paymentStatus === 'paid') {
        res.status(200).send('OK')
        return
      }

      try {
        const paymentData = await verifyPaystackPayment(reference)
        if (paymentData.currency !== 'NGN') {
          throw new Error(`Unexpected payment currency: ${paymentData.currency}`)
        }
        if (paymentData.metadata?.orderId && paymentData.metadata.orderId !== orderId) {
          throw new Error('Payment metadata does not match order')
        }
        const duplicateRefSnap = await db
          .collection('orders')
          .where('paymentReference', '==', reference)
          .where('paymentStatus', '==', 'paid')
          .limit(1)
          .get()
        if (!duplicateRefSnap.empty && duplicateRefSnap.docs[0].id !== orderId) {
          throw new Error('Payment reference already used by another order')
        }

        await db.runTransaction(async (tx) => {
          const fresh = (await tx.get(orderRef)).data()!
          if (fresh.paymentStatus === 'paid') return

          const paymentReferenceRef = db.collection('payment_references').doc(reference)
          const paymentReferenceSnap = await tx.get(paymentReferenceRef)
          if (paymentReferenceSnap.exists) {
            const lockedOrderId = paymentReferenceSnap.data()?.orderId
            if (lockedOrderId !== orderId) {
              throw new Error('Payment reference has already been used.')
            }
          }

          const productUpdates: Array<{ ref: FirebaseFirestore.DocumentReference; quantity: number }> = []
          for (const item of fresh.items || []) {
            const quantity = Number(item.quantity)
            if (!Number.isFinite(quantity) || quantity <= 0) {
              throw new Error(`Invalid quantity for ${item.productName || item.productId}`)
            }
            const productRef = db.collection('products').doc(item.productId)
            const productSnap = await tx.get(productRef)
            if (!productSnap.exists) throw new Error(`Product ${item.productId} not found`)
            const product = productSnap.data()!
            const { limit, sold } = normalizeInventory(product)
            const remaining = limit - sold
            if (remaining < quantity) {
              throw new Error(`Insufficient stock for ${item.productName}. Only ${Math.max(0, remaining)} unit(s) remain.`)
            }

            productUpdates.push({ ref: productRef, quantity })
          }

          if (!paymentReferenceSnap.exists) {
            tx.set(paymentReferenceRef, {
              orderId,
              userId: fresh.userId || null,
              source: 'webhook',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            })
          }

          for (const update of productUpdates) {
            tx.update(update.ref, {
              'inventory.soldCount': admin.firestore.FieldValue.increment(update.quantity),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            })
          }

          tx.update(orderRef, {
            paymentStatus: 'paid',
            paymentReference: reference,
            status: 'paid',
            statusTimeline: admin.firestore.FieldValue.arrayUnion({
              status: 'paid',
              timestamp: new Date(),
              note: `Payment confirmed via Paystack webhook. Reference: ${reference}`,
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        })

        logger.info('Webhook: order confirmed', { orderId, reference })
      } catch (err: any) {
        logger.error('Webhook: verification failed', { error: err.message, reference })
      }
    }

    res.status(200).send('OK')
  }
)

export const setAdminRole = onCall(
  { region: 'europe-west1' },
  async (request: any) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.')
    }

    const callerRecord = await admin.auth().getUser(request.auth.uid)
    if (callerRecord.customClaims?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can assign roles.')
    }

    const { uid, role } = request.data || {}
    if (!uid || !role) {
      throw new HttpsError('invalid-argument', 'uid and role are required.')
    }

    await admin.auth().setCustomUserClaims(uid, { role })
    await db.collection('users').doc(uid).set({ role }, { merge: true })

    logger.info('Role assigned', { uid, role, by: request.auth.uid })
    return { success: true }
  }
)

export const getCloudinarySignature = onCall(
  { region: 'europe-west1' },
  async (request: any) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated')
    }

    const callerRecord = await admin.auth().getUser(request.auth.uid)
    const role = callerRecord.customClaims?.role
    if (role !== 'admin' && role !== 'staff') {
      throw new HttpsError('permission-denied', 'Only authorized staff can upload images')
    }

    configureCloudinary()
    const timestamp = Math.round(Date.now() / 1000)
    const signature = cloudinary.utils.api_sign_request(
      { timestamp },
      cloudinary.config().api_secret as string
    )

    return {
      timestamp,
      signature,
      apiKey: cloudinary.config().api_key,
      cloudName: cloudinary.config().cloud_name,
    }
  }
)

export const onOrderUpdated = onDocumentUpdated(
  { region: 'europe-west1', document: 'orders/{orderId}' },
  async (event: any) => {
    const orderBefore = event.data?.before?.data()
    const orderAfter = event.data?.after?.data()
    if (!orderBefore || !orderAfter) return null

    const brevoApiKey = getBrevoApiKey()
    if (!brevoApiKey) {
      logger.warn('No transactional email provider configured (set BREVO_API_KEY)')
      return null
    }

    const adminEmail = getAdminEmail()
    const mailFrom = `${getMailFromName()} <${getMailFromEmail()}>`
    const customerEmail = await resolveCustomerEmail(orderAfter)

    if (orderBefore.paymentStatus !== 'paid' && orderAfter.paymentStatus === 'paid') {
      if (customerEmail) {
        try {
          await sendTransactionalEmail({
            brevoApiKey,
            from: mailFrom,
            to: customerEmail,
            subject: `AFINJU Order Confirmed - ${orderAfter.orderNumber}`,
            html: buildEmailHtml({
              heading: 'Your AFINJU Authority Set is secured.',
              greetingName: orderAfter.customerName,
              bodyLines: [
                `We have received N${orderAfter.total.toLocaleString()} in full.`,
                'Your launch edition allocation is secured, and private preparation has begun.',
                'You will receive discreet updates at each milestone.',
              ],
              orderNumber: orderAfter.orderNumber,
            }),
          })
        } catch (err: any) {
          logger.error('Failed to send customer order confirmation email', {
            orderId: event.params?.orderId,
            to: customerEmail,
            error: err?.message || 'unknown',
            providerResponse: err?.response?.data || null,
          })
        }
      } else {
        logger.warn('Skipping customer confirmation email: no valid customer email', {
          orderId: event.params?.orderId,
        })
      }

      try {
        await sendTransactionalEmail({
          brevoApiKey,
          from: mailFrom,
          to: adminEmail,
          subject: `NEW PAID ORDER - ${orderAfter.orderNumber}`,
          html: buildEmailHtml({
            heading: 'New paid order received',
            greetingName: 'Admin',
            bodyLines: [
              'A Launch Edition order has been successfully paid.',
              `Customer: ${orderAfter.customerName || 'Unknown'}`,
              `Total: N${orderAfter.total.toLocaleString()}`,
            ],
            orderNumber: orderAfter.orderNumber,
          }),
        })
      } catch (err: any) {
        logger.error('Failed to send admin paid-order notification email', {
          orderId: event.params?.orderId,
          to: adminEmail,
          error: err?.message || 'unknown',
          providerResponse: err?.response?.data || null,
        })
      }
    }

    const statusChanged = orderBefore.status !== orderAfter.status
    const paymentJustConfirmed = orderBefore.paymentStatus !== 'paid' && orderAfter.paymentStatus === 'paid'

    if (statusChanged) {
      if (!customerEmail) {
        logger.warn('Skipping status email: no valid customer email', {
          orderId: event.params?.orderId,
          status: orderAfter.status,
        })
      } else if (orderAfter.status === 'paid' && paymentJustConfirmed) {
        // Already sent the richer payment confirmation email above.
      } else {
        const copy = statusEmailCopy(String(orderAfter.status || 'updated'))
        try {
          await sendTransactionalEmail({
            brevoApiKey,
            from: mailFrom,
            to: customerEmail,
            subject: `AFINJU Order Update - ${orderAfter.orderNumber} (${statusLabel(String(orderAfter.status || 'updated'))})`,
            html: buildEmailHtml({
              heading: copy.title,
              greetingName: orderAfter.customerName,
              bodyLines: [copy.message],
              orderNumber: orderAfter.orderNumber,
            }),
          })
        } catch (err: any) {
          logger.error('Failed to send customer status email', {
            orderId: event.params?.orderId,
            status: orderAfter.status,
            to: customerEmail,
            error: err?.message || 'unknown',
            providerResponse: err?.response?.data || null,
          })
        }
      }
    }

    return null
  }
)

export const onOrderCreated = onDocumentCreated(
  { region: 'europe-west1', document: 'orders/{orderId}' },
  async (event: any) => {
    const order = event.data?.data()
    if (!order) return null

    const brevoApiKey = getBrevoApiKey()
    if (!brevoApiKey) {
      logger.warn('No transactional email provider configured (set BREVO_API_KEY)')
      return null
    }

    const orderId = String(event.params?.orderId || '')
    const adminEmail = getAdminEmail()
    const mailFrom = `${getMailFromName()} <${getMailFromEmail()}>`
    const adminOrderUrl = getAdminOrderUrl(orderId)

    try {
      await sendTransactionalEmail({
        brevoApiKey,
        from: mailFrom,
        to: adminEmail,
        subject: `NEW ORDER RECEIVED - ${order.orderNumber || orderId}`,
        html: buildEmailHtml({
          heading: 'New order received',
          greetingName: 'Admin',
          bodyLines: [
            'A new customer order has been placed and is awaiting your review.',
            'Use the button below to open this exact order in the admin dashboard.',
          ],
          orderNumber: order.orderNumber || orderId,
          detailsHtml: buildAdminOrderDetailsHtml(order),
          ctaLabel: 'Open Order in Admin Dashboard',
          ctaUrl: adminOrderUrl,
        }),
      })
    } catch (err: any) {
      logger.error('Failed to send new-order admin notification email', {
        orderId,
        to: adminEmail,
        error: err?.message || 'unknown',
        providerResponse: err?.response?.data || null,
      })
    }

    return null
  }
)

export const bootstrapAdmin = onRequest(
  { region: 'europe-west1' },
  async (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }
    const uid = req.body?.uid
    const secret = req.get('x-bootstrap-secret') || req.body?.secret

    const bootstrapSecret = readParam(BOOTSTRAP_SECRET, process.env.BOOTSTRAP_SECRET || '')
    if (!bootstrapSecret || secret !== bootstrapSecret) {
      res.status(403).send('Forbidden')
      return
    }

    if (!uid || typeof uid !== 'string') {
      res.status(400).send('uid query param required')
      return
    }

    await admin.auth().setCustomUserClaims(uid, { role: 'admin' })
    await db.collection('users').doc(uid).set({ role: 'admin' }, { merge: true })

    logger.info('Bootstrap admin set', { uid })
    res.status(200).json({ success: true, message: `User ${uid} is now admin. Disable this endpoint.` })
  }
)
