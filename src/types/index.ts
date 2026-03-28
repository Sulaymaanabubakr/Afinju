// ─── PRODUCT ──────────────────────────────────────────────────────────────────
export type ProductColor = 'Blue' | 'Red' | 'Black' | 'Brown'
export type ProductStatus = 'active' | 'draft'

export interface ProductImage {
  url: string
  alt: string
  publicId?: string
}

export interface ProductInventory {
  launchEditionLimit: number
  soldCount: number
  allowBackorder: boolean
}

export interface ProductSEO {
  title: string
  description: string
  ogImage?: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  features: string[]
  items: string[]  // what's included
  price: number
  compareAtPrice: number
  currency: 'NGN'
  colors: ProductColor[]
  images: ProductImage[]
  inventory: ProductInventory
  seo: ProductSEO
  status: ProductStatus
  createdAt: Date
  updatedAt: Date
}

// ─── CART ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  lineId: string
  productId: string
  productName: string
  productSlug: string
  productImage: string
  price: number
  quantity: number
  maxAvailable?: number
  preferences?: OrderPreferences
}

// ─── ORDER ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'confirmed'
  | 'packaging'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface OrderStatusEntry {
  status: OrderStatus
  timestamp: Date
  note?: string           // customer-facing
  internalNote?: string   // admin only
}

export interface OrderPreferences {
  shoeSize: string
  headSize: string
  preferredColor: ProductColor
}

export interface DeliveryAddress {
  fullAddress: string
  city: string
  state: string
  landmark?: string
}

export interface OrderItem {
  productId: string
  productName: string
  productSlug: string
  productImage: string
  price: number
  quantity: number
  preferences: OrderPreferences
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  customerName: string
  customerPhone: string
  customerAltPhone?: string
  customerEmail?: string
  deliveryAddress: DeliveryAddress
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  total: number
  currency: 'NGN'
  paymentReference?: string
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  status: OrderStatus
  statusTimeline: OrderStatusEntry[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// ─── USER ─────────────────────────────────────────────────────────────────────
export type UserRole = 'customer' | 'staff' | 'admin'

export interface UserProfile {
  uid: string
  email?: string
  phone?: string
  displayName?: string
  role: UserRole
  createdAt: Date
}

// ─── SITE CONTENT ──────────────────────────────────────────────────────────────
export interface SiteContent {
  announcementBar: {
    enabled: boolean
    text: string
  }
  hero: {
    headline: string
    subheadline: string
    ctaText: string
    imageUrl: string
  }
  scarcityBanner: {
    enabled: boolean
    text: string
  }
}

// ─── STORE SETTINGS ─────────────────────────────────────────────────────────
export interface StoreSettings {
  storeName: string
  whatsappNumber: string
  supportEmail: string
  shippingFee: number
  freeShippingThreshold?: number
  flutterwavePublicKey: string
  instagramUrl?: string
  twitterUrl?: string
  facebookUrl?: string
  tiktokUrl?: string
  whatsappUrl?: string
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending Payment',
  paid: 'Payment Received',
  confirmed: 'Order Confirmed',
  packaging: 'Being Packaged',
  dispatched: 'Dispatched',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export const SHOE_SIZES = ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47', 'Not sure']
export const HEAD_SIZES = ['54cm', '55cm', '56cm', '57cm', '58cm', '59cm', '60cm', '61cm', '62cm', '63cm', 'Not sure']
export const PRODUCT_COLORS: ProductColor[] = ['Blue', 'Red', 'Black', 'Brown']

// Legacy aliases for backward compatibility with existing code
export type HomepageContent = SiteContent
export type StatusEvent = OrderStatusEntry
