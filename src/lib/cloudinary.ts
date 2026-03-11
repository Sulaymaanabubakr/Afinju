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

  // If it's already a full Cloudinary URL, inject transforms
  if (publicIdOrUrl.includes('cloudinary.com')) {
    return publicIdOrUrl.replace('/upload/', `/upload/${transformStr}/`)
  }

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
  // 1. Get secure signature from Cloud Function
  const { timestamp, signature, apiKey, cloudName } = await getCloudinaryUploadSignature()

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

  if (!response.ok) throw new Error('Cloudinary upload failed')

  const data = await response.json()
  return { publicId: data.public_id, url: data.secure_url }
}

// Placeholder images using Cloudinary samples
export const PLACEHOLDER = {
  product: 'https://res.cloudinary.com/demo/image/upload/w_800,h_1000,c_fill,q_auto,f_auto/sample',
  banner: 'https://res.cloudinary.com/demo/image/upload/w_1600,h_900,c_fill,q_auto,f_auto/sample',
}
