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
 * Falls back to Base64 data URL if Cloudinary upload service is unreachable or unconfigured.
 */
export async function uploadToCloudinary(
  file: File,
  folder: string
): Promise<{ publicId: string; url: string }> {
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
    console.warn('Cloudinary upload signature/API failed, using local Data URL fallback:', err)
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve({ publicId: `local_${Date.now()}`, url: reader.result })
        } else {
          reject(err)
        }
      }
      reader.onerror = () => reject(err)
      reader.readAsDataURL(file)
    })
  }
}

// Placeholder images using Cloudinary samples
export const PLACEHOLDER = {
  product: 'https://res.cloudinary.com/demo/image/upload/w_800,h_1000,c_fill,q_auto,f_auto/sample',
  banner: 'https://res.cloudinary.com/demo/image/upload/w_1600,h_900,c_fill,q_auto,f_auto/sample',
}
