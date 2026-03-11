"use strict";
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapAdmin = exports.onOrderUpdated = exports.getCloudinarySignature = exports.setAdminRole = exports.paystackWebhook = exports.verifyPayment = exports.createOrder = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const resend_1 = require("resend");
const cloudinary_1 = require("cloudinary");
admin.initializeApp();
const db = admin.firestore();
// ─── CONFIG ───────────────────────────────────────────────────────────────────
const PAYSTACK_SECRET = ((_a = functions.config().paystack) === null || _a === void 0 ? void 0 : _a.secret_key) || process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_WEBHOOK_SECRET = ((_b = functions.config().paystack) === null || _b === void 0 ? void 0 : _b.webhook_secret) || '';
const RESEND_API_KEY = ((_c = functions.config().resend) === null || _c === void 0 ? void 0 : _c.api_key) || process.env.RESEND_API_KEY || '';
const ADMIN_EMAIL = ((_d = functions.config().admin) === null || _d === void 0 ? void 0 : _d.email) || 'admin@afinju.com'; // Fallback for notifications
const resend = RESEND_API_KEY ? new resend_1.Resend(RESEND_API_KEY) : null;
// Cloudinary config
cloudinary_1.v2.config({
    cloud_name: ((_e = functions.config().cloudinary) === null || _e === void 0 ? void 0 : _e.cloud_name) || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: ((_f = functions.config().cloudinary) === null || _f === void 0 ? void 0 : _f.api_key) || process.env.CLOUDINARY_API_KEY,
    api_secret: ((_g = functions.config().cloudinary) === null || _g === void 0 ? void 0 : _g.api_secret) || process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
// ─── HELPERS ──────────────────────────────────────────────────────────────────
function generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `AFJ-${timestamp}-${random}`;
}
// ─── HELPER: Verify Paystack Payment ─────────────────────────────────────────
async function verifyPaystackPayment(reference) {
    var _a;
    const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            'Content-Type': 'application/json',
        },
        timeout: 10000,
    });
    const data = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data;
    if (!data || data.status !== 'success') {
        throw new Error(`Payment not successful. Status: ${(data === null || data === void 0 ? void 0 : data.status) || 'unknown'}`);
    }
    return {
        status: true,
        amount: data.amount / 100, // Convert from kobo
        currency: data.currency,
        metadata: data.metadata,
    };
}
// ─── CALLABLE: Create Order Securely ──────────────────────────────────────────
exports.createOrder = functions
    .region('europe-west1')
    .runWith({ timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to create an order.');
    }
    const { items, // { productId, quantity, preferences }
    customerName, customerPhone, customerEmail, deliveryAddress, notes, } = data;
    if (!items || !items.length) {
        throw new functions.https.HttpsError('invalid-argument', 'Cart is empty');
    }
    // Securely calculate total by fetching real prices from Firestore
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
        const productDoc = await db.collection('products').doc(item.productId).get();
        if (!productDoc.exists) {
            throw new functions.https.HttpsError('not-found', `Product ${item.productId} not found`);
        }
        const product = productDoc.data();
        if (product.status !== 'active') {
            throw new functions.https.HttpsError('failed-precondition', `Product ${product.name} is not available`);
        }
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        orderItems.push({
            productId: item.productId,
            productName: product.name,
            productSlug: product.slug,
            productImage: ((_b = (_a = product.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || '',
            price: product.price,
            quantity: item.quantity,
            preferences: item.preferences || {},
        });
    }
    // Fetch store settings for shipping fee
    const settingsDoc = await db.collection('config').doc('settings').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : { shippingFee: 0 };
    const shippingFee = settings.shippingFee || 0;
    const total = subtotal + shippingFee;
    // Construct Order
    const orderNumber = generateOrderNumber();
    const newOrder = {
        orderNumber,
        userId: context.auth.uid,
        customerName,
        customerPhone,
        customerAltPhone: '', // Not used in current form but required by type
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
            { status: 'pending_payment', timestamp: admin.firestore.FieldValue.serverTimestamp(), note: 'Order created, awaiting payment.' }
        ],
        notes: notes || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const orderRef = await db.collection('orders').add(newOrder);
    functions.logger.info(`Order ${orderNumber} securely created by user ${context.auth.uid}`, { orderId: orderRef.id });
    return {
        success: true,
        orderId: orderRef.id,
        orderNumber,
        total,
    };
});
// ─── CALLABLE: Verify Payment & Confirm Order ─────────────────────────────────
exports.verifyPayment = functions
    .region('europe-west1')
    .runWith({ timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    // Require authenticated user
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const { reference, orderId } = data;
    if (!reference || !orderId) {
        throw new functions.https.HttpsError('invalid-argument', 'Reference and orderId are required.');
    }
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Order not found.');
    }
    const order = orderSnap.data();
    // Security: ensure the caller owns this order
    if (order.userId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Access denied.');
    }
    // Idempotency: if already paid, return success
    if (order.paymentStatus === 'paid') {
        return { success: true, alreadyPaid: true };
    }
    // Verify with Paystack
    let paymentData;
    try {
        paymentData = await verifyPaystackPayment(reference);
    }
    catch (err) {
        functions.logger.error('Paystack verification failed', { reference, orderId, error: err.message });
        throw new functions.https.HttpsError('failed-precondition', 'Payment could not be verified: ' + err.message);
    }
    // Verify amount matches (within ₦1 tolerance for floating point)
    const expectedAmount = order.total;
    if (Math.abs(paymentData.amount - expectedAmount) > 1) {
        functions.logger.error('Amount mismatch', { paid: paymentData.amount, expected: expectedAmount, orderId });
        throw new functions.https.HttpsError('failed-precondition', `Payment amount mismatch. Expected ₦${expectedAmount}, received ₦${paymentData.amount}.`);
    }
    // Update order atomically
    await db.runTransaction(async (tx) => {
        const freshSnap = await tx.get(orderRef);
        if (!freshSnap.exists)
            throw new Error('Order disappeared');
        const fresh = freshSnap.data();
        if (fresh.paymentStatus === 'paid')
            return; // Already processed
        // Enforce inventory limit
        for (const item of order.items) {
            const productRef = db.collection('products').doc(item.productId);
            const productSnap = await tx.get(productRef);
            if (!productSnap.exists)
                throw new Error(`Product ${item.productId} not found`);
            const product = productSnap.data();
            const remaining = product.inventory.launchEditionLimit - product.inventory.soldCount;
            if (remaining < item.quantity) {
                throw new Error(`Insufficient stock for ${item.productName}. Only ${remaining} unit(s) remain.`);
            }
            // Increment sold count
            tx.update(productRef, {
                'inventory.soldCount': admin.firestore.FieldValue.increment(item.quantity),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // Mark order as paid
        const newTimeline = [
            ...(fresh.statusTimeline || []),
            {
                status: 'paid',
                timestamp: new Date(),
                note: `Payment of ₦${paymentData.amount.toLocaleString()} confirmed via Paystack. Reference: ${reference}`,
            },
        ];
        tx.update(orderRef, {
            paymentStatus: 'paid',
            paymentReference: reference,
            status: 'paid',
            statusTimeline: newTimeline,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Log audit event
        tx.set(db.collection('audit_logs').doc(), {
            type: 'payment_confirmed',
            orderId,
            userId: context.auth.uid,
            reference,
            amount: paymentData.amount,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    functions.logger.info('Order paid successfully', { orderId, reference });
    return { success: true };
});
// ─── WEBHOOK: Paystack Webhook (server-side verification fallback) ─────────────
exports.paystackWebhook = functions
    .region('europe-west1')
    .https.onRequest(async (req, res) => {
    var _a, _b;
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    // Verify webhook signature
    const crypto = await Promise.resolve().then(() => require('crypto'));
    const hash = crypto
        .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
        functions.logger.warn('Invalid webhook signature');
        res.status(400).send('Invalid signature');
        return;
    }
    const event = req.body;
    functions.logger.info('Paystack webhook received', { event: event.event });
    if (event.event === 'charge.success') {
        const reference = (_a = event.data) === null || _a === void 0 ? void 0 : _a.reference;
        const metadata = (_b = event.data) === null || _b === void 0 ? void 0 : _b.metadata;
        if (!reference || !(metadata === null || metadata === void 0 ? void 0 : metadata.orderId)) {
            res.status(200).send('OK'); // Acknowledge but skip
            return;
        }
        const orderId = metadata.orderId;
        const orderRef = db.collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            functions.logger.warn('Webhook: order not found', { orderId });
            res.status(200).send('OK');
            return;
        }
        const order = orderSnap.data();
        if (order.paymentStatus === 'paid') {
            res.status(200).send('OK'); // Idempotent
            return;
        }
        // Verify with Paystack to be sure
        try {
            const paymentData = await verifyPaystackPayment(reference);
            await db.runTransaction(async (tx) => {
                const fresh = (await tx.get(orderRef)).data();
                if (fresh.paymentStatus === 'paid')
                    return;
                for (const item of order.items) {
                    const productRef = db.collection('products').doc(item.productId);
                    const product = (await tx.get(productRef)).data();
                    tx.update(productRef, {
                        'inventory.soldCount': admin.firestore.FieldValue.increment(item.quantity),
                    });
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
                });
            });
            functions.logger.info('Webhook: order confirmed', { orderId, reference });
        }
        catch (err) {
            functions.logger.error('Webhook: verification failed', { error: err.message, reference });
        }
    }
    res.status(200).send('OK');
});
// ─── CALLABLE: Set Admin Role ─────────────────────────────────────────────────
// Run this manually or via a one-time script to promote a user to admin
exports.setAdminRole = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    // Only an existing admin can assign roles
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const callerRecord = await admin.auth().getUser(context.auth.uid);
    const callerClaims = callerRecord.customClaims || {};
    if (callerClaims.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can assign roles.');
    }
    const { uid, role } = data;
    if (!uid || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'uid and role are required.');
    }
    await admin.auth().setCustomUserClaims(uid, { role });
    await db.collection('users').doc(uid).update({ role });
    functions.logger.info('Role assigned', { uid, role, by: context.auth.uid });
    return { success: true };
});
// ─── CALLABLE: Secure Cloudinary Signature ────────────────────────────────────
exports.getCloudinarySignature = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    var _a;
    // Only admins/staff should generate upload signatures
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const callerRecord = await admin.auth().getUser(context.auth.uid);
    const role = (_a = callerRecord.customClaims) === null || _a === void 0 ? void 0 : _a.role;
    if (role !== 'admin' && role !== 'staff') {
        throw new functions.https.HttpsError('permission-denied', 'Only authorized staff can upload images');
    }
    const timestamp = Math.round(new Date().getTime() / 1000);
    // Cloudinary expects params to be signed. We sign the timestamp.
    const signature = cloudinary_1.v2.utils.api_sign_request({ timestamp }, cloudinary_1.v2.config().api_secret);
    return {
        timestamp,
        signature,
        apiKey: cloudinary_1.v2.config().api_key,
        cloudName: cloudinary_1.v2.config().cloud_name
    };
});
// ─── FIRESTORE TRIGGER: Transactional Emails ──────────────────────────────────
exports.onOrderUpdated = functions
    .region('us-central1')
    .firestore.document('orders/{orderId}')
    .onUpdate(async (change, context) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const orderBefore = change.before.data();
    const orderAfter = change.after.data();
    // Email sending requires RESEND API KEY
    if (!RESEND_API_KEY) {
        functions.logger.warn('RESEND_API_KEY missing - skipping transactional emails');
        return null;
    }
    if (!resend) {
        functions.logger.warn('Resend client unavailable - skipping transactional emails');
        return null;
    }
    // 1. Order Confirmed/Paid Email
    if (orderBefore.paymentStatus !== 'paid' && orderAfter.paymentStatus === 'paid') {
        try {
            // Send to Customer
            await resend.emails.send({
                from: 'AFINJU <orders@afinju.com>', // Replace with your verified domain
                to: orderAfter.customerEmail || ADMIN_EMAIL,
                subject: `AFINJU Order Confirmed - ${orderAfter.orderNumber}`,
                html: `
            <h1>Your AFINJU Authority Set is secured.</h1>
            <p>Dear ${orderAfter.customerName},</p>
            <p>We have received your payment of ₦${orderAfter.total.toLocaleString()} for order <strong>${orderAfter.orderNumber}</strong>.</p>
            <p>Your launch edition set has been reserved and our craftsmen have been notified. We will update you once your order is packaged and dispatched.</p>
            <br/>
            <h3>Order Details:</h3>
            <ul>
              ${orderAfter.items.map((i) => { var _a, _b, _c; return `<li>${i.quantity}x ${i.productName} (Shoe: ${(_a = i.preferences) === null || _a === void 0 ? void 0 : _a.shoeSize}, Head: ${(_b = i.preferences) === null || _b === void 0 ? void 0 : _b.headSize}, Color: ${(_c = i.preferences) === null || _c === void 0 ? void 0 : _c.preferredColor})</li>`; }).join('')}
            </ul>
            <p><strong>Delivery Address:</strong><br/>${(_a = orderAfter.deliveryAddress) === null || _a === void 0 ? void 0 : _a.fullAddress}<br/>${(_b = orderAfter.deliveryAddress) === null || _b === void 0 ? void 0 : _b.city}, ${(_c = orderAfter.deliveryAddress) === null || _c === void 0 ? void 0 : _c.state}</p>
            <br/>
            <p>If you have questions, reply to this email.</p>
            <p>Best regards,<br/>The AFINJU Team</p>
          `
            });
            // Notify Admin
            await resend.emails.send({
                from: 'AFINJU System <system@afinju.com>',
                to: ADMIN_EMAIL,
                subject: `🚨 NEW PAID ORDER - ${orderAfter.orderNumber}`,
                html: `<p>New Launch Edition order received for ${(_d = orderAfter.items[0]) === null || _d === void 0 ? void 0 : _d.quantity} units. Total: ₦${orderAfter.total.toLocaleString()}</p>`
            });
        }
        catch (err) {
            functions.logger.error('Failed to send Order Confirmation email', err);
        }
    }
    // 2. Order Shipped Email
    if (orderBefore.status !== 'dispatched' && orderAfter.status === 'dispatched') {
        try {
            await resend.emails.send({
                from: 'AFINJU <orders@afinju.com>',
                to: orderAfter.customerEmail || ADMIN_EMAIL,
                subject: `AFINJU Order Dispatched - ${orderAfter.orderNumber}`,
                html: `
            <h1>Your AFINJU Set is on its way.</h1>
            <p>Dear ${orderAfter.customerName},</p>
            <p>Your order <strong>${orderAfter.orderNumber}</strong> has been dispatched.</p>
            <p>Please ensure someone is available at the delivery address to receive it.</p>
            <p><strong>Delivery Address:</strong><br/>${(_e = orderAfter.deliveryAddress) === null || _e === void 0 ? void 0 : _e.fullAddress}<br/>${(_f = orderAfter.deliveryAddress) === null || _f === void 0 ? void 0 : _f.city}, ${(_g = orderAfter.deliveryAddress) === null || _g === void 0 ? void 0 : _g.state}</p>
            <br/>
            <p>Best regards,<br/>The AFINJU Team</p>
          `
            });
        }
        catch (err) {
            functions.logger.error('Failed to send Shipping email', err);
        }
    }
    return null;
});
// ─── HTTP: Bootstrap First Admin ──────────────────────────────────────────────
// One-time endpoint — disable after first use or secure with a secret
exports.bootstrapAdmin = functions
    .region('us-central1')
    .https.onRequest(async (req, res) => {
    var _a;
    const { uid, secret } = req.query;
    // Simple bootstrap secret — set this in functions config
    const bootstrapSecret = ((_a = functions.config().bootstrap) === null || _a === void 0 ? void 0 : _a.secret) || process.env.BOOTSTRAP_SECRET;
    if (!bootstrapSecret || secret !== bootstrapSecret) {
        res.status(403).send('Forbidden');
        return;
    }
    if (!uid || typeof uid !== 'string') {
        res.status(400).send('uid query param required');
        return;
    }
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    await db.collection('users').doc(uid).set({ role: 'admin' }, { merge: true });
    functions.logger.info('Bootstrap admin set', { uid });
    res.status(200).json({ success: true, message: `User ${uid} is now admin. Disable this endpoint.` });
});
//# sourceMappingURL=index.js.map