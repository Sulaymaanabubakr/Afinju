"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapAdmin = exports.onOrderUpdated = exports.getCloudinarySignature = exports.setAdminRole = exports.paystackWebhook = exports.verifyPayment = exports.createOrder = void 0;
const admin = require("firebase-admin");
const axios_1 = require("axios");
const cloudinary_1 = require("cloudinary");
const params_1 = require("firebase-functions/params");
const logger_1 = require("firebase-functions/logger");
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
admin.initializeApp();
const db = admin.firestore();
const PAYSTACK_SECRET_KEY = (0, params_1.defineString)('PAYSTACK_SECRET_KEY', { default: '' });
const PAYSTACK_WEBHOOK_SECRET = (0, params_1.defineString)('PAYSTACK_WEBHOOK_SECRET', { default: '' });
const BREVO_API_KEY = (0, params_1.defineString)('BREVO_API_KEY', { default: '' });
const ADMIN_EMAIL_PARAM = (0, params_1.defineString)('ADMIN_EMAIL', { default: 'admin@afinju.com' });
const MAIL_FROM_EMAIL_PARAM = (0, params_1.defineString)('MAIL_FROM_EMAIL', { default: 'noreply@afinju247.com' });
const MAIL_FROM_NAME_PARAM = (0, params_1.defineString)('MAIL_FROM_NAME', { default: 'AFINJU' });
const CLOUDINARY_CLOUD_NAME = (0, params_1.defineString)('CLOUDINARY_CLOUD_NAME', { default: '' });
const CLOUDINARY_API_KEY = (0, params_1.defineString)('CLOUDINARY_API_KEY', { default: '' });
const CLOUDINARY_API_SECRET = (0, params_1.defineString)('CLOUDINARY_API_SECRET', { default: '' });
const BOOTSTRAP_SECRET = (0, params_1.defineString)('BOOTSTRAP_SECRET', { default: '' });
function readParam(param, fallback = '') {
    try {
        const value = param.value();
        return value || fallback;
    }
    catch (_a) {
        return fallback;
    }
}
function getPaystackSecret() {
    return readParam(PAYSTACK_SECRET_KEY, process.env.PAYSTACK_SECRET_KEY || '');
}
function getWebhookSecret() {
    return readParam(PAYSTACK_WEBHOOK_SECRET, process.env.PAYSTACK_WEBHOOK_SECRET || '');
}
function getAdminEmail() {
    return readParam(ADMIN_EMAIL_PARAM, process.env.ADMIN_EMAIL || 'admin@afinju.com');
}
function normalizeSecret(raw) {
    const value = (raw || '').trim();
    if (!value)
        return '';
    const lowered = value.toLowerCase();
    if (['disabled', 'none', 'null', 'false', '0'].includes(lowered))
        return '';
    return value;
}
function getBrevoApiKey() {
    return normalizeSecret(readParam(BREVO_API_KEY, process.env.BREVO_API_KEY || ''));
}
function getMailFromEmail() {
    return readParam(MAIL_FROM_EMAIL_PARAM, process.env.MAIL_FROM_EMAIL || 'noreply@afinju247.com');
}
function getMailFromName() {
    return readParam(MAIL_FROM_NAME_PARAM, process.env.MAIL_FROM_NAME || 'AFINJU');
}
function parseFrom(from) {
    const match = from.match(/^(.*)<([^>]+)>$/);
    if (!match)
        return { email: from.trim() };
    const name = match[1].trim().replace(/^"|"$/g, '');
    const email = match[2].trim();
    return Object.assign({ email }, (name ? { name } : {}));
}
function isValidEmail(value) {
    return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
async function resolveCustomerEmail(order) {
    if (isValidEmail(order === null || order === void 0 ? void 0 : order.customerEmail))
        return order.customerEmail.trim();
    const userId = typeof (order === null || order === void 0 ? void 0 : order.userId) === 'string' ? order.userId.trim() : '';
    if (!userId)
        return null;
    try {
        const user = await admin.auth().getUser(userId);
        if (isValidEmail(user.email))
            return user.email.trim();
    }
    catch (err) {
        logger_1.logger.warn('Could not resolve customer email from auth user', {
            userId,
            error: (err === null || err === void 0 ? void 0 : err.message) || 'unknown',
        });
    }
    return null;
}
function statusLabel(status) {
    return status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase());
}
function statusEmailCopy(status) {
    const map = {
        pending_payment: {
            title: 'Order Received',
            message: 'We have received your order and we are currently awaiting payment confirmation.',
        },
        paid: {
            title: 'Payment Confirmed',
            message: 'Your payment has been confirmed and your order is now being prepared.',
        },
        confirmed: {
            title: 'Order Confirmed',
            message: 'Your order has been confirmed and moved into processing.',
        },
        packaging: {
            title: 'Now Packaging',
            message: 'Your order is currently being packaged by our team.',
        },
        dispatched: {
            title: 'Order Dispatched',
            message: 'Your order has been dispatched and is on the way.',
        },
        out_for_delivery: {
            title: 'Out For Delivery',
            message: 'Your order is now out for delivery.',
        },
        delivered: {
            title: 'Delivered',
            message: 'Your order has been marked as delivered.',
        },
        cancelled: {
            title: 'Order Cancelled',
            message: 'Your order has been cancelled. Contact support if you need assistance.',
        },
        refunded: {
            title: 'Refund Processed',
            message: 'A refund has been processed for your order.',
        },
    };
    return map[status] || {
        title: `Status Updated: ${statusLabel(status)}`,
        message: `Your order status has been updated to ${statusLabel(status)}.`,
    };
}
async function sendTransactionalEmail(args) {
    const { brevoApiKey, from, to, subject, html } = args;
    if (brevoApiKey) {
        const sender = parseFrom(from);
        await axios_1.default.post('https://api.brevo.com/v3/smtp/email', {
            sender,
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }, {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'api-key': brevoApiKey,
            },
            timeout: 10000,
        });
        return;
    }
    throw new Error('No email provider configured (BREVO_API_KEY missing)');
}
function configureCloudinary() {
    cloudinary_1.v2.config({
        cloud_name: readParam(CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_CLOUD_NAME || ''),
        api_key: readParam(CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_KEY || ''),
        api_secret: readParam(CLOUDINARY_API_SECRET, process.env.CLOUDINARY_API_SECRET || ''),
        secure: true,
    });
}
function generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `AFJ-${timestamp}-${random}`;
}
function sanitizeForFirestore(value) {
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeForFirestore(item));
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, sanitizeForFirestore(v)]);
        return Object.fromEntries(entries);
    }
    return value;
}
function normalizeInventory(product) {
    var _a, _b, _c;
    const rawLimit = Number((_a = product === null || product === void 0 ? void 0 : product.inventory) === null || _a === void 0 ? void 0 : _a.launchEditionLimit);
    const sold = Number((_c = (_b = product === null || product === void 0 ? void 0 : product.inventory) === null || _b === void 0 ? void 0 : _b.soldCount) !== null && _c !== void 0 ? _c : 0);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : Number.MAX_SAFE_INTEGER;
    return {
        limit,
        sold: Number.isFinite(sold) && sold >= 0 ? sold : 0,
    };
}
function validateQuantity(input) {
    const quantity = Number(input);
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 20) {
        throw new https_1.HttpsError('invalid-argument', 'Each item quantity must be an integer between 1 and 20.');
    }
    return quantity;
}
async function verifyPaystackPayment(reference) {
    var _a;
    const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
            Authorization: `Bearer ${getPaystackSecret()}`,
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
        amount: data.amount / 100,
        currency: data.currency,
        metadata: data.metadata,
    };
}
exports.createOrder = (0, https_1.onCall)({ region: 'europe-west1', timeoutSeconds: 30 }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated to create an order.');
    }
    const { items, customerName, customerPhone, customerAltPhone, customerEmail, deliveryAddress, notes, } = request.data || {};
    if (!items || !Array.isArray(items) || !items.length) {
        throw new https_1.HttpsError('invalid-argument', 'Cart is empty');
    }
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
        if (!item || typeof item.productId !== 'string' || !item.productId.trim()) {
            throw new https_1.HttpsError('invalid-argument', 'Each cart item must include a valid productId.');
        }
        const quantity = validateQuantity(item.quantity);
        const productDoc = await db.collection('products').doc(item.productId).get();
        if (!productDoc.exists) {
            throw new https_1.HttpsError('not-found', `Product ${item.productId} not found`);
        }
        const product = productDoc.data();
        if (product.status !== 'active') {
            throw new https_1.HttpsError('failed-precondition', `Product ${product.name} is not available`);
        }
        const itemTotal = product.price * quantity;
        subtotal += itemTotal;
        orderItems.push({
            productId: item.productId,
            productName: product.name,
            productSlug: product.slug,
            productImage: ((_b = (_a = product.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || '',
            price: product.price,
            quantity,
            preferences: sanitizeForFirestore(item.preferences || {}),
        });
    }
    const settingsDoc = await db.collection('config').doc('settings').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : { shippingFee: 0 };
    const shippingFee = settings.shippingFee || 0;
    const total = subtotal + shippingFee;
    const orderNumber = generateOrderNumber();
    const newOrder = {
        orderNumber,
        userId: request.auth.uid,
        customerName,
        customerPhone,
        customerAltPhone: customerAltPhone || '',
        customerEmail: customerEmail || '',
        deliveryAddress: sanitizeForFirestore({
            fullAddress: (deliveryAddress === null || deliveryAddress === void 0 ? void 0 : deliveryAddress.fullAddress) || '',
            city: (deliveryAddress === null || deliveryAddress === void 0 ? void 0 : deliveryAddress.city) || '',
            state: (deliveryAddress === null || deliveryAddress === void 0 ? void 0 : deliveryAddress.state) || '',
            landmark: (deliveryAddress === null || deliveryAddress === void 0 ? void 0 : deliveryAddress.landmark) || '',
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
    };
    const orderRef = await db.collection('orders').add(sanitizeForFirestore(newOrder));
    logger_1.logger.info(`Order ${orderNumber} securely created by user ${request.auth.uid}`, { orderId: orderRef.id });
    return {
        success: true,
        orderId: orderRef.id,
        orderNumber,
        total,
    };
});
exports.verifyPayment = (0, https_1.onCall)({ region: 'europe-west1', timeoutSeconds: 30 }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    }
    const { reference, orderId } = request.data || {};
    if (!reference || !orderId) {
        throw new https_1.HttpsError('invalid-argument', 'Reference and orderId are required.');
    }
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Order not found.');
    }
    const order = orderSnap.data();
    if (order.userId !== request.auth.uid) {
        throw new https_1.HttpsError('permission-denied', 'Access denied.');
    }
    if (order.paymentStatus === 'paid') {
        return { success: true, alreadyPaid: true };
    }
    const duplicateRefSnap = await db
        .collection('orders')
        .where('paymentReference', '==', reference)
        .where('paymentStatus', '==', 'paid')
        .limit(1)
        .get();
    if (!duplicateRefSnap.empty && duplicateRefSnap.docs[0].id !== orderId) {
        throw new https_1.HttpsError('failed-precondition', 'Payment reference has already been used.');
    }
    let paymentData;
    try {
        paymentData = await verifyPaystackPayment(reference);
    }
    catch (err) {
        logger_1.logger.error('Paystack verification failed', { reference, orderId, error: err.message });
        throw new https_1.HttpsError('failed-precondition', `Payment could not be verified: ${err.message}`);
    }
    const expectedAmount = order.total;
    if (Math.abs(paymentData.amount - expectedAmount) > 1) {
        logger_1.logger.error('Amount mismatch', { paid: paymentData.amount, expected: expectedAmount, orderId });
        throw new https_1.HttpsError('failed-precondition', `Payment amount mismatch. Expected N${expectedAmount}, received N${paymentData.amount}.`);
    }
    if (paymentData.currency !== 'NGN') {
        throw new https_1.HttpsError('failed-precondition', `Unexpected payment currency: ${paymentData.currency}`);
    }
    if (((_a = paymentData.metadata) === null || _a === void 0 ? void 0 : _a.orderId) && paymentData.metadata.orderId !== orderId) {
        throw new https_1.HttpsError('failed-precondition', 'Payment metadata does not match this order.');
    }
    try {
        await db.runTransaction(async (tx) => {
            var _a;
            const freshSnap = await tx.get(orderRef);
            if (!freshSnap.exists)
                throw new Error('Order disappeared');
            const fresh = freshSnap.data();
            if (fresh.paymentStatus === 'paid')
                return;
            const paymentReferenceRef = db.collection('payment_references').doc(reference);
            const paymentReferenceSnap = await tx.get(paymentReferenceRef);
            if (paymentReferenceSnap.exists) {
                const lockedOrderId = (_a = paymentReferenceSnap.data()) === null || _a === void 0 ? void 0 : _a.orderId;
                if (lockedOrderId !== orderId) {
                    throw new Error('Payment reference has already been used.');
                }
            }
            const productUpdates = [];
            for (const item of fresh.items || []) {
                const quantity = Number(item.quantity);
                if (!Number.isFinite(quantity) || quantity <= 0) {
                    throw new Error(`Invalid quantity for ${item.productName || item.productId}`);
                }
                const productRef = db.collection('products').doc(item.productId);
                const productSnap = await tx.get(productRef);
                if (!productSnap.exists)
                    throw new Error(`Product ${item.productId} not found`);
                const product = productSnap.data();
                const { limit, sold } = normalizeInventory(product);
                const remaining = limit - sold;
                if (remaining < quantity) {
                    throw new Error(`Insufficient stock for ${item.productName}. Only ${Math.max(0, remaining)} unit(s) remain.`);
                }
                productUpdates.push({ ref: productRef, quantity });
            }
            const newTimeline = [
                ...(fresh.statusTimeline || []),
                {
                    status: 'paid',
                    timestamp: new Date(),
                    note: `Payment of N${paymentData.amount.toLocaleString()} confirmed via Paystack. Reference: ${reference}`,
                },
            ];
            if (!paymentReferenceSnap.exists) {
                tx.set(paymentReferenceRef, {
                    orderId,
                    userId: request.auth.uid,
                    source: 'callable',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            for (const update of productUpdates) {
                tx.update(update.ref, {
                    'inventory.soldCount': admin.firestore.FieldValue.increment(update.quantity),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            tx.update(orderRef, {
                paymentStatus: 'paid',
                paymentReference: reference,
                status: 'paid',
                statusTimeline: newTimeline,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            tx.set(db.collection('audit_logs').doc(), {
                type: 'payment_confirmed',
                orderId,
                userId: request.auth.uid,
                reference,
                amount: paymentData.amount,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
    }
    catch (err) {
        const message = (err === null || err === void 0 ? void 0 : err.message) || 'Unknown transaction failure';
        logger_1.logger.error('verifyPayment transaction failed', { orderId, reference, message });
        if (message.includes('Insufficient stock') ||
            message.includes('already been used') ||
            message.includes('not found') ||
            message.includes('Invalid quantity')) {
            throw new https_1.HttpsError('failed-precondition', message);
        }
        throw new https_1.HttpsError('internal', 'Payment verified, but order finalization failed. Please contact support.');
    }
    logger_1.logger.info('Order paid successfully', { orderId, reference });
    return { success: true };
});
exports.paystackWebhook = (0, https_1.onRequest)({ region: 'europe-west1' }, async (req, res) => {
    var _a, _b, _c;
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) {
        logger_1.logger.error('PAYSTACK_WEBHOOK_SECRET missing');
        res.status(500).send('Server misconfigured');
        return;
    }
    const crypto = await Promise.resolve().then(() => require('crypto'));
    const hash = crypto
        .createHmac('sha512', webhookSecret)
        .update(req.rawBody || JSON.stringify(req.body))
        .digest('hex');
    const receivedSignatureHeader = req.headers['x-paystack-signature'];
    const receivedSignature = Array.isArray(receivedSignatureHeader)
        ? receivedSignatureHeader[0]
        : receivedSignatureHeader;
    if (typeof receivedSignature !== 'string') {
        logger_1.logger.warn('Missing webhook signature');
        res.status(400).send('Invalid signature');
        return;
    }
    const expectedSig = Buffer.from(hash, 'hex');
    const providedSig = Buffer.from(receivedSignature, 'hex');
    if (expectedSig.length !== providedSig.length ||
        !crypto.timingSafeEqual(expectedSig, providedSig)) {
        logger_1.logger.warn('Invalid webhook signature');
        res.status(400).send('Invalid signature');
        return;
    }
    const event = req.body;
    logger_1.logger.info('Paystack webhook received', { event: event === null || event === void 0 ? void 0 : event.event });
    if ((event === null || event === void 0 ? void 0 : event.event) === 'charge.success') {
        const reference = (_a = event.data) === null || _a === void 0 ? void 0 : _a.reference;
        const metadata = (_b = event.data) === null || _b === void 0 ? void 0 : _b.metadata;
        if (!reference || !(metadata === null || metadata === void 0 ? void 0 : metadata.orderId)) {
            res.status(200).send('OK');
            return;
        }
        const orderId = metadata.orderId;
        const orderRef = db.collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            logger_1.logger.warn('Webhook: order not found', { orderId });
            res.status(200).send('OK');
            return;
        }
        const order = orderSnap.data();
        if (order.paymentStatus === 'paid') {
            res.status(200).send('OK');
            return;
        }
        try {
            const paymentData = await verifyPaystackPayment(reference);
            if (paymentData.currency !== 'NGN') {
                throw new Error(`Unexpected payment currency: ${paymentData.currency}`);
            }
            if (((_c = paymentData.metadata) === null || _c === void 0 ? void 0 : _c.orderId) && paymentData.metadata.orderId !== orderId) {
                throw new Error('Payment metadata does not match order');
            }
            const duplicateRefSnap = await db
                .collection('orders')
                .where('paymentReference', '==', reference)
                .where('paymentStatus', '==', 'paid')
                .limit(1)
                .get();
            if (!duplicateRefSnap.empty && duplicateRefSnap.docs[0].id !== orderId) {
                throw new Error('Payment reference already used by another order');
            }
            await db.runTransaction(async (tx) => {
                var _a;
                const fresh = (await tx.get(orderRef)).data();
                if (fresh.paymentStatus === 'paid')
                    return;
                const paymentReferenceRef = db.collection('payment_references').doc(reference);
                const paymentReferenceSnap = await tx.get(paymentReferenceRef);
                if (paymentReferenceSnap.exists) {
                    const lockedOrderId = (_a = paymentReferenceSnap.data()) === null || _a === void 0 ? void 0 : _a.orderId;
                    if (lockedOrderId !== orderId) {
                        throw new Error('Payment reference has already been used.');
                    }
                }
                const productUpdates = [];
                for (const item of fresh.items || []) {
                    const quantity = Number(item.quantity);
                    if (!Number.isFinite(quantity) || quantity <= 0) {
                        throw new Error(`Invalid quantity for ${item.productName || item.productId}`);
                    }
                    const productRef = db.collection('products').doc(item.productId);
                    const productSnap = await tx.get(productRef);
                    if (!productSnap.exists)
                        throw new Error(`Product ${item.productId} not found`);
                    const product = productSnap.data();
                    const { limit, sold } = normalizeInventory(product);
                    const remaining = limit - sold;
                    if (remaining < quantity) {
                        throw new Error(`Insufficient stock for ${item.productName}. Only ${Math.max(0, remaining)} unit(s) remain.`);
                    }
                    productUpdates.push({ ref: productRef, quantity });
                }
                if (!paymentReferenceSnap.exists) {
                    tx.set(paymentReferenceRef, {
                        orderId,
                        userId: fresh.userId || null,
                        source: 'webhook',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
                for (const update of productUpdates) {
                    tx.update(update.ref, {
                        'inventory.soldCount': admin.firestore.FieldValue.increment(update.quantity),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
            logger_1.logger.info('Webhook: order confirmed', { orderId, reference });
        }
        catch (err) {
            logger_1.logger.error('Webhook: verification failed', { error: err.message, reference });
        }
    }
    res.status(200).send('OK');
});
exports.setAdminRole = (0, https_1.onCall)({ region: 'europe-west1' }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    }
    const callerRecord = await admin.auth().getUser(request.auth.uid);
    if (((_a = callerRecord.customClaims) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Only admins can assign roles.');
    }
    const { uid, role } = request.data || {};
    if (!uid || !role) {
        throw new https_1.HttpsError('invalid-argument', 'uid and role are required.');
    }
    await admin.auth().setCustomUserClaims(uid, { role });
    await db.collection('users').doc(uid).set({ role }, { merge: true });
    logger_1.logger.info('Role assigned', { uid, role, by: request.auth.uid });
    return { success: true };
});
exports.getCloudinarySignature = (0, https_1.onCall)({ region: 'europe-west1' }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const callerRecord = await admin.auth().getUser(request.auth.uid);
    const role = (_a = callerRecord.customClaims) === null || _a === void 0 ? void 0 : _a.role;
    if (role !== 'admin' && role !== 'staff') {
        throw new https_1.HttpsError('permission-denied', 'Only authorized staff can upload images');
    }
    configureCloudinary();
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary_1.v2.utils.api_sign_request({ timestamp }, cloudinary_1.v2.config().api_secret);
    return {
        timestamp,
        signature,
        apiKey: cloudinary_1.v2.config().api_key,
        cloudName: cloudinary_1.v2.config().cloud_name,
    };
});
exports.onOrderUpdated = (0, firestore_1.onDocumentUpdated)({ region: 'europe-west1', document: 'orders/{orderId}' }, async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const orderBefore = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.data();
    const orderAfter = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after) === null || _d === void 0 ? void 0 : _d.data();
    if (!orderBefore || !orderAfter)
        return null;
    const brevoApiKey = getBrevoApiKey();
    if (!brevoApiKey) {
        logger_1.logger.warn('No transactional email provider configured (set BREVO_API_KEY)');
        return null;
    }
    const adminEmail = getAdminEmail();
    const mailFrom = `${getMailFromName()} <${getMailFromEmail()}>`;
    const customerEmail = await resolveCustomerEmail(orderAfter);
    if (orderBefore.paymentStatus !== 'paid' && orderAfter.paymentStatus === 'paid') {
        if (customerEmail) {
            try {
                await sendTransactionalEmail({
                    brevoApiKey,
                    from: mailFrom,
                    to: customerEmail,
                    subject: `AFINJU Order Confirmed - ${orderAfter.orderNumber}`,
                    html: `
              <h1>Your AFINJU Authority Set is secured.</h1>
              <p>Dear ${orderAfter.customerName},</p>
              <p>We have received your payment of N${orderAfter.total.toLocaleString()} for order <strong>${orderAfter.orderNumber}</strong>.</p>
              <p>Your launch edition set has been reserved and our craftsmen have been notified. We will update you once your order is packaged and dispatched.</p>
            `,
                });
            }
            catch (err) {
                logger_1.logger.error('Failed to send customer order confirmation email', {
                    orderId: (_e = event.params) === null || _e === void 0 ? void 0 : _e.orderId,
                    to: customerEmail,
                    error: (err === null || err === void 0 ? void 0 : err.message) || 'unknown',
                    providerResponse: ((_f = err === null || err === void 0 ? void 0 : err.response) === null || _f === void 0 ? void 0 : _f.data) || null,
                });
            }
        }
        else {
            logger_1.logger.warn('Skipping customer confirmation email: no valid customer email', {
                orderId: (_g = event.params) === null || _g === void 0 ? void 0 : _g.orderId,
            });
        }
        try {
            await sendTransactionalEmail({
                brevoApiKey,
                from: mailFrom,
                to: adminEmail,
                subject: `NEW PAID ORDER - ${orderAfter.orderNumber}`,
                html: `<p>New Launch Edition order received. Total: N${orderAfter.total.toLocaleString()}</p>`,
            });
        }
        catch (err) {
            logger_1.logger.error('Failed to send admin paid-order notification email', {
                orderId: (_h = event.params) === null || _h === void 0 ? void 0 : _h.orderId,
                to: adminEmail,
                error: (err === null || err === void 0 ? void 0 : err.message) || 'unknown',
                providerResponse: ((_j = err === null || err === void 0 ? void 0 : err.response) === null || _j === void 0 ? void 0 : _j.data) || null,
            });
        }
    }
    const statusChanged = orderBefore.status !== orderAfter.status;
    const paymentJustConfirmed = orderBefore.paymentStatus !== 'paid' && orderAfter.paymentStatus === 'paid';
    if (statusChanged) {
        if (!customerEmail) {
            logger_1.logger.warn('Skipping status email: no valid customer email', {
                orderId: (_k = event.params) === null || _k === void 0 ? void 0 : _k.orderId,
                status: orderAfter.status,
            });
        }
        else if (orderAfter.status === 'paid' && paymentJustConfirmed) {
            // Already sent the richer payment confirmation email above.
        }
        else {
            const copy = statusEmailCopy(String(orderAfter.status || 'updated'));
            try {
                await sendTransactionalEmail({
                    brevoApiKey,
                    from: mailFrom,
                    to: customerEmail,
                    subject: `AFINJU Order Update - ${orderAfter.orderNumber} (${statusLabel(String(orderAfter.status || 'updated'))})`,
                    html: `
              <h1>${copy.title}</h1>
              <p>Dear ${orderAfter.customerName},</p>
              <p>${copy.message}</p>
              <p>Order: <strong>${orderAfter.orderNumber}</strong></p>
            `,
                });
            }
            catch (err) {
                logger_1.logger.error('Failed to send customer status email', {
                    orderId: (_l = event.params) === null || _l === void 0 ? void 0 : _l.orderId,
                    status: orderAfter.status,
                    to: customerEmail,
                    error: (err === null || err === void 0 ? void 0 : err.message) || 'unknown',
                    providerResponse: ((_m = err === null || err === void 0 ? void 0 : err.response) === null || _m === void 0 ? void 0 : _m.data) || null,
                });
            }
        }
    }
    return null;
});
exports.bootstrapAdmin = (0, https_1.onRequest)({ region: 'europe-west1' }, async (req, res) => {
    var _a, _b;
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const uid = (_a = req.body) === null || _a === void 0 ? void 0 : _a.uid;
    const secret = req.get('x-bootstrap-secret') || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.secret);
    const bootstrapSecret = readParam(BOOTSTRAP_SECRET, process.env.BOOTSTRAP_SECRET || '');
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
    logger_1.logger.info('Bootstrap admin set', { uid });
    res.status(200).json({ success: true, message: `User ${uid} is now admin. Disable this endpoint.` });
});
//# sourceMappingURL=index.js.map