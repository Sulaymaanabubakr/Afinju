import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
import type {
  Product,
  Order,
  OrderStatus,
  OrderStatusEntry,
  UserProfile,
  SiteContent,
  StoreSettings,
} from '@/types'
import { generateOrderNumber } from './utils'

// ─── CONVERTERS ───────────────────────────────────────────────────────────────
function tsToDate(ts: any): Date {
  if (ts instanceof Timestamp) return ts.toDate()
  if (ts instanceof Date) return ts
  return new Date()
}

function removeUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as T
}

function docToProduct(id: string, data: DocumentData): Product {
  return {
    ...data,
    id,
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
  } as Product
}

function docToOrder(id: string, data: DocumentData): Order {
  return {
    ...data,
    id,
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
    statusTimeline: (data.statusTimeline || []).map((e: any) => ({
      ...e,
      timestamp: tsToDate(e.timestamp),
    })),
  } as Order
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  const q = query(
    collection(db, 'products'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToProduct(d.id, d.data()))
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const legacySlugAliases: Record<string, string[]> = {
    'afinju-authority-set-launch-edition': ['afinju-authority-set-launch-v1'],
    'afinju-authority-set-launch-v1': ['afinju-authority-set-launch-edition'],
  }

  const candidates = Array.from(new Set([slug, ...(legacySlugAliases[slug] || [])]))

  for (const candidate of candidates) {
    const q = query(
      collection(db, 'products'),
      where('slug', '==', candidate),
      where('status', '==', 'active'),
      limit(1)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
      const d = snap.docs[0]
      return docToProduct(d.id, d.data())
    }
  }

  // Backward-compatible fallback for links using product ID in the URL
  const byId = await getProductById(slug)
  if (byId?.status === 'active') return byId

  return null
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, 'products', id))
  if (!snap.exists()) return null
  return docToProduct(snap.id, snap.data())
}

export async function upsertProduct(product: Partial<Product> & { id?: string }): Promise<string> {
  const now = serverTimestamp()
  if (product.id) {
    await updateDoc(doc(db, 'products', product.id), {
      ...product,
      updatedAt: now,
    })
    return product.id
  }
  const ref = await addDoc(collection(db, 'products'), {
    ...product,
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export async function createOrder(data: {
  items: any[]
  customerName: string
  customerPhone: string
  customerAltPhone?: string
  customerEmail?: string
  deliveryAddress: any
  notes?: string
}): Promise<{ orderId: string; orderNumber: string; total: number }> {
  const createOrderCallable = httpsCallable<{
    items: any[]
    customerName: string
    customerPhone: string
    customerAltPhone?: string
    customerEmail?: string
    deliveryAddress: any
    notes?: string
  }, { orderId: string; orderNumber: string; total: number }>(functions, 'createOrder')

  const result = await createOrderCallable(data)
  return result.data
}

export async function getOrderById(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, 'orders', id))
  if (!snap.exists()) return null
  return docToOrder(snap.id, snap.data())
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToOrder(d.id, d.data()))
}

export async function getAllOrders(statusFilter?: OrderStatus): Promise<Order[]> {
  let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
  if (statusFilter) {
    q = query(
      collection(db, 'orders'),
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc')
    )
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToOrder(d.id, d.data()))
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
  internalNote?: string
): Promise<void> {
  const orderRef = doc(db, 'orders', orderId)
  const snap = await getDoc(orderRef)
  if (!snap.exists()) throw new Error('Order not found')

  const data = snap.data()
  const newEntry: OrderStatusEntry = {
    status,
    timestamp: new Date(),
    ...(note ? { note } : {}),
    ...(internalNote ? { internalNote } : {}),
  }

  await updateDoc(orderRef, {
    status,
    statusTimeline: [...(data.statusTimeline || []), newEntry],
    updatedAt: serverTimestamp(),
  })
}

export async function markOrderPaid(orderId: string, paymentReference: string): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), {
    paymentStatus: 'paid',
    paymentReference,
    status: 'paid',
    statusTimeline: [
      { status: 'paid', timestamp: new Date(), note: 'Payment confirmed via Paystack' },
    ],
    updatedAt: serverTimestamp(),
  })
}

export function subscribeToOrder(orderId: string, callback: (order: Order | null) => void) {
  return onSnapshot(doc(db, 'orders', orderId), (snap) => {
    if (!snap.exists()) { callback(null); return }
    callback(docToOrder(snap.id, snap.data()))
  })
}

// ─── USERS ────────────────────────────────────────────────────────────────────
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return { ...data, uid, createdAt: tsToDate(data.createdAt) } as UserProfile
}

export async function createUserProfile(profile: Omit<UserProfile, 'createdAt'>): Promise<void> {
  await setDoc(doc(db, 'users', profile.uid), {
    ...removeUndefined(profile as Record<string, any>),
    createdAt: serverTimestamp(),
  })
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map((d) => {
    const data = d.data()
    return { ...data, uid: d.id, createdAt: tsToDate(data.createdAt) } as UserProfile
  })
}

// ─── CONTENT ──────────────────────────────────────────────────────────────────
export async function getSiteContent(): Promise<SiteContent | null> {
  const snap = await getDoc(doc(db, 'config', 'content'))
  if (!snap.exists()) return null
  return snap.data() as SiteContent
}

export async function updateSiteContent(content: Partial<SiteContent>): Promise<void> {
  await setDoc(doc(db, 'config', 'content'), content, { merge: true })
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export async function getStoreSettings(): Promise<StoreSettings | null> {
  const snap = await getDoc(doc(db, 'config', 'settings'))
  if (!snap.exists()) return null
  return snap.data() as StoreSettings
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  await setDoc(doc(db, 'config', 'settings'), settings, { merge: true })
}

// ─── INVENTORY CHECK ─────────────────────────────────────────────────────────
export async function getRemainingUnits(productId: string): Promise<number> {
  const product = await getProductById(productId)
  if (!product) return 0
  return Math.max(0, product.inventory.launchEditionLimit - product.inventory.soldCount)
}

// ─── UPLOADS ─────────────────────────────────────────────────────────────────
export async function getCloudinaryUploadSignature() {
  const getSignature = httpsCallable<void, { timestamp: number; signature: string; apiKey: string; cloudName: string }>(
    functions,
    'getCloudinarySignature'
  )
  const result = await getSignature()
  return result.data
}
