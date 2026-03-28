import { supabase } from './supabase'
import type {
  Product,
  Order,
  OrderStatus,
  OrderStatusEntry,
  UserProfile,
  SiteContent,
  StoreSettings,
} from '@/types'

// ─── CONVERTERS ───────────────────────────────────────────────────────────────
function tsToDate(ts: any): Date {
  if (!ts) return new Date()
  return new Date(ts)
}

function removeUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as T
}

function rowToProduct(data: any): Product {
  return {
    ...data,
    isLimitedEdition: data.is_limited_edition,
    compareAtPrice: data.compare_at_price,
    inventory: typeof data.inventory === 'string' ? JSON.parse(data.inventory) : (data.inventory || { launchEditionLimit: 10, soldCount: 0 }),
    images: typeof data.images === 'string' ? JSON.parse(data.images) : (data.images || []),
    features: typeof data.features === 'string' ? JSON.parse(data.features) : (data.features || []),
    items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []),
    seo: typeof data.seo === 'string' ? JSON.parse(data.seo) : (data.seo || {}),
    createdAt: tsToDate(data.created_at),
    updatedAt: tsToDate(data.updated_at),
  } as Product
}

function rowToOrder(data: any): Order {
  const statusTimeline = typeof data.status_timeline === 'string' ? JSON.parse(data.status_timeline) : (data.status_timeline || [])
  return {
    ...data,
    orderNumber: data.order_number,
    userId: data.user_id,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    customerAltPhone: data.customer_alt_phone,
    customerEmail: data.customer_email,
    deliveryAddress: typeof data.delivery_address === 'string' ? JSON.parse(data.delivery_address) : data.delivery_address,
    items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items,
    shippingFee: Number(data.shipping_fee),
    paymentStatus: data.payment_status,
    paymentReference: data.payment_reference,
    createdAt: tsToDate(data.created_at),
    updatedAt: tsToDate(data.updated_at),
    statusTimeline: statusTimeline.map((e: any) => ({
      ...e,
      timestamp: tsToDate(e.timestamp),
    })),
  } as Order
}

function isPublicProductStatus(status: unknown): boolean {
  if (status === undefined || status === null) return true
  return status === 'active' || status === 'published'
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(rowToProduct)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const legacySlugAliases: Record<string, string[]> = {
    'afinju-authority-set-launch-edition': ['afinju-authority-set-launch-v1'],
    'afinju-authority-set-launch-v1': ['afinju-authority-set-launch-edition'],
  }

  const candidates = Array.from(new Set([slug, ...(legacySlugAliases[slug] || [])]))

  for (const candidate of candidates) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('slug', candidate)
      .eq('status', 'active')
      .limit(1)

    if (data && data.length > 0) return rowToProduct(data[0])

    const { data: legacyData } = await supabase
      .from('products')
      .select('*')
      .eq('slug', candidate)
      .limit(1)

    if (legacyData && legacyData.length > 0) return rowToProduct(legacyData[0])
  }

  const byId = await getProductById(slug)
  if (byId && isPublicProductStatus((byId as any).status)) return byId

  return null
}

export async function getProductById(id: string): Promise<Product | null> {
  // UUID validation check before query
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error || !data) return null
  return rowToProduct(data)
}

export async function getAdminProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(rowToProduct)
}

export async function upsertProduct(product: Partial<Product> & { id?: string }): Promise<string> {
  const payload = {
    ...product,
    updated_at: new Date().toISOString(),
  }
  
  // Transform camelCase keys to snake_case if necessary. 
  // In Supabase we use snake_case for built-ins, but Product has camelCase.
  // We should map properly:
  const dbPayload: any = {
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    price: payload.price,
    status: payload.status,
    inventory: payload.inventory,
    images: payload.images,
    features: payload.features,
    items: payload.items,
    compare_at_price: payload.compareAtPrice,
    currency: payload.currency,
    colors: payload.colors,
    seo: payload.seo,
    is_limited_edition: payload.isLimitedEdition,
    updated_at: payload.updated_at,
  }

  if (product.id) {
    const { error } = await supabase.from('products').update(removeUndefined(dbPayload)).eq('id', product.id)
    if (error) throw error
    return product.id
  }
  
  const { data, error } = await supabase.from('products').insert(removeUndefined(dbPayload)).select('id').single()
  if (error) throw error
  return data.id
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) throw error
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
  const { data: response, error } = await supabase.functions.invoke('create-order', {
    body: data,
  })
  
  if (error) throw new Error(error.message)
  return response
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
  if (error || !data) return null
  return rowToOrder(data)
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(rowToOrder)
}

export async function getAllOrders(statusFilter?: OrderStatus): Promise<Order[]> {
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
  
  if (statusFilter && statusFilter !== 'all' as any) {
    query = query.eq('status', statusFilter)
  }
  
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(rowToOrder)
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
  internalNote?: string
): Promise<void> {
  const { data: order, error: fetchError } = await supabase.from('orders').select('status_timeline').eq('id', orderId).single()
  if (fetchError || !order) throw new Error('Order not found')

  const statusTimeline = typeof order.status_timeline === 'string' ? JSON.parse(order.status_timeline) : (order.status_timeline || [])
  const newEntry: OrderStatusEntry = {
    status,
    timestamp: new Date() as any, // saved as ISO string via postgres JSON serialization
    ...(note ? { note } : {}),
    ...(internalNote ? { internalNote } : {}),
  }

  const { error } = await supabase.from('orders').update({
    status,
    status_timeline: [...statusTimeline, newEntry],
    updated_at: new Date().toISOString(),
  }).eq('id', orderId)

  if (error) throw error

  // Trigger customer notification (Fire and forget, don't block the UI)
  supabase.functions.invoke('order-status-notification', {
    body: { orderId, status, note },
  }).catch(err => console.error('Failed to trigger order status notification:', err))
}

export async function markOrderPaid(orderId: string, paymentReference: string): Promise<void> {
  const { data: order, error: fetchError } = await supabase.from('orders').select('status_timeline').eq('id', orderId).single()
  if (fetchError || !order) throw fetchError

  const statusTimeline = typeof order.status_timeline === 'string' ? JSON.parse(order.status_timeline) : (order.status_timeline || [])

  const { error } = await supabase.from('orders').update({
    payment_status: 'paid',
    payment_reference: paymentReference,
    status: 'paid',
    status_timeline: [
      ...statusTimeline,
      { status: 'paid', timestamp: new Date(), note: 'Payment confirmed via Flutterwave' },
    ],
    updated_at: new Date().toISOString(),
  }).eq('id', orderId)

  if (error) throw error
}

export function subscribeToOrder(orderId: string, callback: (order: Order | null) => void) {
  const channel = supabase.channel(`order-${orderId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, async (payload) => {
      if (payload.new) {
        callback(rowToOrder(payload.new))
      } else {
        callback(null)
      }
    })
    .subscribe()
    
  return () => {
    supabase.removeChannel(channel)
  }
}

// ─── USERS ────────────────────────────────────────────────────────────────────
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).single()
  if (error || !data) return null
  return {
    uid: data.id,
    email: data.email,
    displayName: data.display_name,
    phone: data.phone,
    role: data.role,
    createdAt: tsToDate(data.created_at),
  } as UserProfile
}

export async function createUserProfile(profile: Omit<UserProfile, 'createdAt'>): Promise<void> {
  const { error } = await supabase.from('users').insert({
    id: profile.uid,
    email: profile.email,
    display_name: profile.displayName,
    phone: profile.phone,
    role: profile.role,
  })
  if (error) throw error
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((data: any) => ({
    uid: data.id,
    email: data.email,
    displayName: data.display_name,
    phone: data.phone,
    role: data.role,
    createdAt: tsToDate(data.created_at),
  }))
}

// ─── CONTENT ──────────────────────────────────────────────────────────────────
export async function getSiteContent(): Promise<SiteContent | null> {
  const { data, error } = await supabase.from('config').select('data').eq('id', 'content').single()
  if (error || !data) return null
  return typeof data.data === 'string' ? JSON.parse(data.data) : data.data
}

export async function updateSiteContent(content: Partial<SiteContent>): Promise<void> {
  const existingData = await getSiteContent() || {}
  const merged = { ...existingData, ...content }
  
  const { error } = await supabase.from('config').upsert({ 
    id: 'content', 
    data: merged, 
    updated_at: new Date().toISOString() 
  })
  
  if (error) {
    console.error('Update Site Content Error:', error)
    throw new Error(error.message)
  }
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export async function getStoreSettings(): Promise<StoreSettings | null> {
  const { data, error } = await supabase.from('config').select('data').eq('id', 'settings').single()
  if (error || !data) return null
  return typeof data.data === 'string' ? JSON.parse(data.data) : data.data
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  const existingData = await getStoreSettings() || {}
  const merged = { ...existingData, ...settings }
  
  const { error } = await supabase.from('config').upsert({ 
    id: 'settings', 
    data: merged, 
    updated_at: new Date().toISOString() 
  })
  
  if (error) {
    console.error('Update Store Settings Error:', error)
    throw new Error(error.message)
  }
}

// ─── INVENTORY CHECK ─────────────────────────────────────────────────────────
export async function getRemainingUnits(productId: string): Promise<number> {
  const product = await getProductById(productId)
  if (!product) return 0
  return Math.max(0, product.inventory.launchEditionLimit - product.inventory.soldCount)
}

// ─── UPLOADS ─────────────────────────────────────────────────────────────────
export async function getCloudinaryUploadSignature() {
  const { data, error } = await supabase.functions.invoke('cloudinary-sign')
  if (error) throw new Error(error.message)
  return data
}

// ─── TEST SYSTEM ─────────────────────────────────────────────────────────────
export async function sendTestEmail() {
  const { data, error } = await supabase.functions.invoke('test-email')
  if (error) throw new Error(error.message)
  return data
}
