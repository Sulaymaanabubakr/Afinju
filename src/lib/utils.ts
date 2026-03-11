import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `AFJ-${timestamp}-${random}`
}

export function whatsappLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export const BRAND_WHATSAPP = '2347071861932'

export function orderWhatsappLink(orderNumber: string): string {
  const message = `Hello Afínjú, I just placed order #${orderNumber}. I'm reaching out regarding my purchase.`
  return whatsappLink(BRAND_WHATSAPP, message)
}

export function helpWhatsappLink(): string {
  const message = `Hello Afínjú, I need help with sizing before placing my order.`
  return whatsappLink(BRAND_WHATSAPP, message)
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}

// Alias for formatNGN — used across pages
export const formatPrice = formatNGN

export function cloudinaryOptimize(url: string, width = 800): string {
  if (!url) return ''
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`)
  }
  return url
}

// Alias for whatsappLink — some files use getWhatsAppUrl
export const getWhatsAppUrl = whatsappLink
