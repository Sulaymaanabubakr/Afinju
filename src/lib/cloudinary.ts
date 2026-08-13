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
 * Build a Cloudinary URL with transformations for optimal delivery.
 */
export function cloudinaryUrl(
  publicIdOrUrl: string,
  transforms: CloudinaryTransform = {}
): string {
  if (!publicIdOrUrl) return ''

  // Support local images and external full URLs directly
  if (publicIdOrUrl.startsWith('/') || publicIdOrUrl.startsWith('http')) {
    return publicIdOrUrl
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

import { getCloudinaryUploadSignature } from './db'

/** Responsive srcset for Cloudinary images */
export function cloudinarySrcSet(publicIdOrUrl: string, widths = [400, 800, 1200, 1600]) {
  return widths
    .map(w => `${cloudinaryUrl(publicIdOrUrl, { width: w, format: 'auto', quality: 'auto' })} ${w}w`)
    .join(', ')
}

/**
 * Upload an image to Cloudinary securely using a signed request from the backend.
 */
export async function uploadToCloudinary(
  file: File,
  folder: string
): Promise<{ publicId: string; url: string }> {
  if (!file.type.startsWith('image/')) throw new Error('Please select an image file.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Image must be smaller than 10 MB.')
  if (!CLOUD_NAME) throw new Error('Cloudinary is not configured for this deployment.')

  try {
    // 1. Get secure signature from Cloud Function
    const sig = await getCloudinaryUploadSignature()
    const { timestamp, signature, apiKey, cloudName } = sig || {}

    if (!timestamp || !signature || !apiKey) {
      throw new Error('Incomplete signature returned from server')
    }

    // 2. Upload directly to Cloudinary using the signature
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)
    formData.append('folder', `afinju/${folder}`)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName || CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    )

    if (!response.ok) {
      const errData = await response.json().catch(() => null)
      throw new Error(errData?.error?.message || `Cloudinary upload failed (${response.status})`)
    }

    const data = await response.json()
    return { publicId: data.public_id, url: data.secure_url }
  } catch (err: any) {
    console.error('Cloudinary upload failed:', err)
    throw err instanceof Error ? err : new Error('Image upload failed.')
  }
}

// Placeholder images using Cloudinary samples
export const PLACEHOLDER = {
  product: '/products/afinju-new-01.jpeg',
  banner: '/products/afinju-new-02.jpeg',
}
