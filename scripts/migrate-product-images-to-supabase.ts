/**
 * Migrate existing product images from local public assets and Cloudinary to
 * Supabase Storage.
 *
 * Required environment variables:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run only after the product-images bucket migration has been applied:
 *   npx tsx scripts/migrate-product-images-to-supabase.ts
 */
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

function browserSafeCloudinaryUrl(url: string): string {
  if (!url.includes('res.cloudinary.com') || !/\.heic(?:$|\?)/i.test(url)) return url
  return url.replace('/image/upload/', '/image/upload/f_jpg,q_auto/')
}

async function readImage(url: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  if (url.startsWith('/')) {
    const filePath = path.join(projectRoot, 'public', url)
    const bytes = await fs.readFile(filePath)
    const contentType = path.extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg'
    return { bytes: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), contentType }
  }

  if (url.startsWith('http')) {
    const response = await fetch(browserSafeCloudinaryUrl(url))
    if (!response.ok) throw new Error(`Unable to download ${url} (${response.status})`)
    const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg'
    return { bytes: await response.arrayBuffer(), contentType: contentType === 'image/heic' ? 'image/jpeg' : contentType }
  }

  return null
}

async function main() {
  const { data: products, error } = await supabase.from('products').select('id, slug, images')
  if (error) throw error

  for (const product of products || []) {
    const nextImages = []
    for (const [index, image] of (product.images || []).entries()) {
      const sourceUrl = image?.url
      if (!sourceUrl) continue

      const source = await readImage(sourceUrl)
      if (!source) {
        console.warn(`Skipping unsupported image URL for ${product.slug}: ${sourceUrl}`)
        nextImages.push(image)
        continue
      }

      const extension = source.contentType === 'image/png' ? 'png' : 'jpg'
      const storagePath = `products/${product.id}/${index}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(storagePath, source.bytes, {
          cacheControl: '31536000',
          contentType: source.contentType,
          upsert: true,
        })
      if (uploadError) throw uploadError

      const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(storagePath)
      nextImages.push({ ...image, url: publicUrl.publicUrl, publicId: storagePath })
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ images: nextImages, updated_at: new Date().toISOString() })
      .eq('id', product.id)
    if (updateError) throw updateError
    console.log(`Migrated ${product.slug}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
