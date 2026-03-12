import * as admin from 'firebase-admin'
import axios from 'axios'
import { Resend } from 'resend'
import { v2 as cloudinary } from 'cloudinary'
import { defineString } from 'firebase-functions/params'
import { logger } from 'firebase-functions/logger'
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'

admin.initializeApp()
const db = admin.firestore()

const PAYSTACK_SECRET_KEY = defineString('PAYSTACK_SECRET_KEY', { default: '' })
const PAYSTACK_WEBHOOK_SECRET = defineString('PAYSTACK_WEBHOOK_SECRET', { default: '' })
const RESEND_API_KEY = defineString('RESEND_API_KEY', { default: '' })
const ADMIN_EMAIL_PARAM = defineString('ADMIN_EMAIL', { default: 'admin@afinju.com' })
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

function getResendClient(): Resend | null {
  const key = readParam(RESEND_API_KEY, process.env.RESEND_API_KEY || '')
  return key ? new Resend(key) : null
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
      const productDoc = await db.collection('products').doc(item.productId).get()
      if (!productDoc.exists) {
        throw new HttpsError('not-found', `Product ${item.productId} not found`)
      }

      const product = productDoc.data()!
      if (product.status !== 'active') {
        throw new HttpsError('failed-precondition', `Product ${product.name} is not available`)
      }

      const itemTotal = product.price * item.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images?.[0]?.url || '',
        price: product.price,
        quantity: item.quantity,
        preferences: item.preferences || {},
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
      customerEmail,
      deliveryAddress,
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

    const orderRef = await db.collection('orders').add(newOrder)
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

    await db.runTransaction(async (tx) => {
      const freshSnap = await tx.get(orderRef)
      if (!freshSnap.exists) throw new Error('Order disappeared')
      const fresh = freshSnap.data()!
      if (fresh.paymentStatus === 'paid') return

      for (const item of order.items) {
        const productRef = db.collection('products').doc(item.productId)
        const productSnap = await tx.get(productRef)
        if (!productSnap.exists) throw new Error(`Product ${item.productId} not found`)
        const product = productSnap.data()!
        const remaining = product.inventory.launchEditionLimit - product.inventory.soldCount
        if (remaining < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}. Only ${remaining} unit(s) remain.`)
        }

        tx.update(productRef, {
          'inventory.soldCount': admin.firestore.FieldValue.increment(item.quantity),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }

      const newTimeline = [
        ...(fresh.statusTimeline || []),
        {
          status: 'paid',
          timestamp: new Date(),
          note: `Payment of N${paymentData.amount.toLocaleString()} confirmed via Paystack. Reference: ${reference}`,
        },
      ]

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

    if (hash !== req.headers['x-paystack-signature']) {
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
        await verifyPaystackPayment(reference)

        await db.runTransaction(async (tx) => {
          const fresh = (await tx.get(orderRef)).data()!
          if (fresh.paymentStatus === 'paid') return

          for (const item of order.items) {
            const productRef = db.collection('products').doc(item.productId)
            tx.update(productRef, {
              'inventory.soldCount': admin.firestore.FieldValue.increment(item.quantity),
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

    const resend = getResendClient()
    if (!resend) {
      logger.warn('RESEND_API_KEY missing or client unavailable - skipping transactional emails')
      return null
    }

    const adminEmail = getAdminEmail()

    if (orderBefore.paymentStatus !== 'paid' && orderAfter.paymentStatus === 'paid') {
      try {
        await resend.emails.send({
          from: 'AFINJU <orders@afinju.com>',
          to: orderAfter.customerEmail || adminEmail,
          subject: `AFINJU Order Confirmed - ${orderAfter.orderNumber}`,
          html: `
            <h1>Your AFINJU Authority Set is secured.</h1>
            <p>Dear ${orderAfter.customerName},</p>
            <p>We have received your payment of N${orderAfter.total.toLocaleString()} for order <strong>${orderAfter.orderNumber}</strong>.</p>
            <p>Your launch edition set has been reserved and our craftsmen have been notified. We will update you once your order is packaged and dispatched.</p>
          `,
        })

        await resend.emails.send({
          from: 'AFINJU System <system@afinju.com>',
          to: adminEmail,
          subject: `NEW PAID ORDER - ${orderAfter.orderNumber}`,
          html: `<p>New Launch Edition order received. Total: N${orderAfter.total.toLocaleString()}</p>`,
        })
      } catch (err: any) {
        logger.error('Failed to send Order Confirmation email', err)
      }
    }

    if (orderBefore.status !== 'dispatched' && orderAfter.status === 'dispatched') {
      try {
        await resend.emails.send({
          from: 'AFINJU <orders@afinju.com>',
          to: orderAfter.customerEmail || adminEmail,
          subject: `AFINJU Order Dispatched - ${orderAfter.orderNumber}`,
          html: `
            <h1>Your AFINJU Set is on its way.</h1>
            <p>Dear ${orderAfter.customerName},</p>
            <p>Your order <strong>${orderAfter.orderNumber}</strong> has been dispatched.</p>
          `,
        })
      } catch (err: any) {
        logger.error('Failed to send Shipping email', err)
      }
    }

    return null
  }
)

export const bootstrapAdmin = onRequest(
  { region: 'europe-west1' },
  async (req: any, res: any) => {
    const uid = req.query.uid
    const secret = req.query.secret

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
