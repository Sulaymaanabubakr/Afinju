import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios from 'axios'

admin.initializeApp()
const db = admin.firestore()

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const PAYSTACK_SECRET = functions.config().paystack?.secret_key || process.env.PAYSTACK_SECRET_KEY || ''
const PAYSTACK_WEBHOOK_SECRET = functions.config().paystack?.webhook_secret || ''

// ─── HELPER: Verify Paystack Payment ─────────────────────────────────────────
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
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
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
    amount: data.amount / 100, // Convert from kobo
    currency: data.currency,
    metadata: data.metadata,
  }
}

// ─── CALLABLE: Verify Payment & Confirm Order ─────────────────────────────────
export const verifyPayment = functions
  .region('us-central1')
  .runWith({ timeoutSeconds: 30 })
  .https.onCall(async (data: { reference: string; orderId: string }, context) => {
    // Require authenticated user
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.')
    }

    const { reference, orderId } = data
    if (!reference || !orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'Reference and orderId are required.')
    }

    const orderRef = db.collection('orders').doc(orderId)
    const orderSnap = await orderRef.get()

    if (!orderSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found.')
    }

    const order = orderSnap.data()!

    // Security: ensure the caller owns this order
    if (order.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied.')
    }

    // Idempotency: if already paid, return success
    if (order.paymentStatus === 'paid') {
      return { success: true, alreadyPaid: true }
    }

    // Verify with Paystack
    let paymentData: Awaited<ReturnType<typeof verifyPaystackPayment>>
    try {
      paymentData = await verifyPaystackPayment(reference)
    } catch (err: any) {
      functions.logger.error('Paystack verification failed', { reference, orderId, error: err.message })
      throw new functions.https.HttpsError('failed-precondition', 'Payment could not be verified: ' + err.message)
    }

    // Verify amount matches (within ₦1 tolerance for floating point)
    const expectedAmount = order.total
    if (Math.abs(paymentData.amount - expectedAmount) > 1) {
      functions.logger.error('Amount mismatch', { paid: paymentData.amount, expected: expectedAmount, orderId })
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Payment amount mismatch. Expected ₦${expectedAmount}, received ₦${paymentData.amount}.`
      )
    }

    // Update order atomically
    await db.runTransaction(async (tx) => {
      const freshSnap = await tx.get(orderRef)
      if (!freshSnap.exists) throw new Error('Order disappeared')
      const fresh = freshSnap.data()!
      if (fresh.paymentStatus === 'paid') return // Already processed

      // Enforce inventory limit
      for (const item of order.items) {
        const productRef = db.collection('products').doc(item.productId)
        const productSnap = await tx.get(productRef)
        if (!productSnap.exists) throw new Error(`Product ${item.productId} not found`)
        const product = productSnap.data()!
        const remaining = product.inventory.launchEditionLimit - product.inventory.soldCount
        if (remaining < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}. Only ${remaining} unit(s) remain.`)
        }
        // Increment sold count
        tx.update(productRef, {
          'inventory.soldCount': admin.firestore.FieldValue.increment(item.quantity),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }

      // Mark order as paid
      const newTimeline = [
        ...(fresh.statusTimeline || []),
        {
          status: 'paid',
          timestamp: new Date(),
          note: `Payment of ₦${paymentData.amount.toLocaleString()} confirmed via Paystack. Reference: ${reference}`,
        },
      ]

      tx.update(orderRef, {
        paymentStatus: 'paid',
        paymentReference: reference,
        status: 'paid',
        statusTimeline: newTimeline,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // Log audit event
      tx.set(db.collection('audit_logs').doc(), {
        type: 'payment_confirmed',
        orderId,
        userId: context.auth!.uid,
        reference,
        amount: paymentData.amount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    functions.logger.info('Order paid successfully', { orderId, reference })
    return { success: true }
  })

// ─── WEBHOOK: Paystack Webhook (server-side verification fallback) ─────────────
export const paystackWebhook = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }

    // Verify webhook signature
    const crypto = await import('crypto')
    const hash = crypto
      .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex')

    if (hash !== req.headers['x-paystack-signature']) {
      functions.logger.warn('Invalid webhook signature')
      res.status(400).send('Invalid signature')
      return
    }

    const event = req.body
    functions.logger.info('Paystack webhook received', { event: event.event })

    if (event.event === 'charge.success') {
      const reference = event.data?.reference
      const metadata = event.data?.metadata

      if (!reference || !metadata?.orderId) {
        res.status(200).send('OK') // Acknowledge but skip
        return
      }

      const orderId = metadata.orderId
      const orderRef = db.collection('orders').doc(orderId)
      const orderSnap = await orderRef.get()

      if (!orderSnap.exists) {
        functions.logger.warn('Webhook: order not found', { orderId })
        res.status(200).send('OK')
        return
      }

      const order = orderSnap.data()!
      if (order.paymentStatus === 'paid') {
        res.status(200).send('OK') // Idempotent
        return
      }

      // Verify with Paystack to be sure
      try {
        const paymentData = await verifyPaystackPayment(reference)

        await db.runTransaction(async (tx) => {
          const fresh = (await tx.get(orderRef)).data()!
          if (fresh.paymentStatus === 'paid') return

          for (const item of order.items) {
            const productRef = db.collection('products').doc(item.productId)
            const product = (await tx.get(productRef)).data()!
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

        functions.logger.info('Webhook: order confirmed', { orderId, reference })
      } catch (err: any) {
        functions.logger.error('Webhook: verification failed', { error: err.message, reference })
      }
    }

    res.status(200).send('OK')
  })

// ─── CALLABLE: Set Admin Role ─────────────────────────────────────────────────
// Run this manually or via a one-time script to promote a user to admin
export const setAdminRole = functions
  .region('us-central1')
  .https.onCall(async (data: { uid: string; role: 'admin' | 'staff' | 'customer' }, context) => {
    // Only an existing admin can assign roles
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.')
    }

    const callerRecord = await admin.auth().getUser(context.auth.uid)
    const callerClaims = callerRecord.customClaims || {}
    if (callerClaims.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can assign roles.')
    }

    const { uid, role } = data
    if (!uid || !role) {
      throw new functions.https.HttpsError('invalid-argument', 'uid and role are required.')
    }

    await admin.auth().setCustomUserClaims(uid, { role })
    await db.collection('users').doc(uid).update({ role })

    functions.logger.info('Role assigned', { uid, role, by: context.auth.uid })
    return { success: true }
  })

// ─── HTTP: Bootstrap First Admin ──────────────────────────────────────────────
// One-time endpoint — disable after first use or secure with a secret
export const bootstrapAdmin = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    const { uid, secret } = req.query

    // Simple bootstrap secret — set this in functions config
    const bootstrapSecret = functions.config().bootstrap?.secret || process.env.BOOTSTRAP_SECRET
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

    functions.logger.info('Bootstrap admin set', { uid })
    res.status(200).json({ success: true, message: `User ${uid} is now admin. Disable this endpoint.` })
  })
