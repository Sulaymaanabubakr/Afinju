const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

export interface CloudinaryTransform {
  width?: number
  height?: number
  quality?: 'auto' | number
  format?: 'auto' | 'webp' | 'jpg' | 'png'
  crop?: 'fill' | 'fit' | 'scale' | 'pad'
  gravity?: 'face' | 'center' | 'auto'
  dpr?: 'auto' | number
}

/**
 * Cloudinary accepts HEIC uploads, but many browsers cannot render the
 * resulting URL directly. Request a JPEG delivery variant for existing HEIC
 * records while preserving the original Cloudinary asset.
 */
export function browserSafeImageUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com') || !/\.heic(?:$|\?)/i.test(url)) return url
  return url.replace('/image/upload/', '/image/upload/f_jpg,q_auto/')
}

/**
 * Build a Cloudinary URL with transformations for optimal delivery.
 */
export function cloudinaryUrl(
  publicIdOrUrl: string,
  transforms: CloudinaryTransform = {}
): string {
  if (!publicIdOrUrl) return ''

  // Support local images and external full URLs directly. Existing HEIC
  // records are converted at delivery time for browser compatibility.
  if (publicIdOrUrl.startsWith('/') || publicIdOrUrl.startsWith('http')) {
    return browserSafeImageUrl(publicIdOrUrl)
  }

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'center',
    dpr = 'auto',
  } = transforms

  const parts: string[] = [
    `f_${format}`,
    `q_${quality}`,
    `dpr_${dpr}`,
  ]

  if (width) parts.push(`w_${width}`)
  if (height) parts.push(`h_${height}`)
  if (width || height) parts.push(`c_${crop}`, `g_${gravity}`)

  const transformStr = parts.join(',')

  // Otherwise build from public_id
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformStr}/${publicIdOrUrl}`
}

import { supabase } from './supabase'

/** Responsive srcset for Cloudinary images */
export function cloudinarySrcSet(publicIdOrUrl: string, widths = [400, 800, 1200, 1600]) {
  return widths
    .map(w => `${cloudinaryUrl(publicIdOrUrl, { width: w, format: 'auto', quality: 'auto' })} ${w}w`)
    .join(', ')
}

/**
 * Upload an image to Cloudinary securely using a signed request from the backend.
 */
export async function uploadProductImage(
  file: File,
  folder: string
): Promise<{ publicId: string; url: string }> {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  if (!allowedTypes.has(file.type.toLowerCase())) {
    throw new Error('Please upload a JPEG, PNG, WebP, or GIF image. HEIC files are not supported.')
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('Image must be smaller than 10 MB.')
  const extension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
  const path = `${folder}/${crypto.randomUUID()}.${extension}`

  try {
    const { error } = await supabase.storage.from('product-images').upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    })
    if (error) throw error

    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return { publicId: path, url: data.publicUrl }
  } catch (err: any) {
    console.error('Product image upload failed:', err)
    throw err instanceof Error ? err : new Error('Image upload failed.')
  }
}

// Placeholder images using Cloudinary samples
export const PLACEHOLDER = {
  product: '/products/afinju-new-01.jpeg',
  banner: '/products/afinju-new-02.jpeg',
}
