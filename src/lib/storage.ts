import { supabase } from './supabase'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function uploadProductImage(
  file: File,
  folder: string,
): Promise<{ publicId: string; url: string }> {
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

export const PLACEHOLDER = {
  product: '/products/afinju-new-01.jpeg',
  banner: '/products/afinju-new-02.jpeg',
}
