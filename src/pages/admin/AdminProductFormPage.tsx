import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Upload, Loader2 } from 'lucide-react'
import { getProductById, upsertProduct } from '@/lib/db'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { PRODUCT_COLORS } from '@/types'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: product } = useQuery({
    queryKey: ['product-admin', id],
    queryFn: () => getProductById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    features: [''],
    items: [''],
    price: 200000,
    compareAtPrice: 250000,
    colors: PRODUCT_COLORS as string[],
    status: 'active' as 'active' | 'draft',
    launchEditionLimit: 10,
    soldCount: 0,
  })
  const [images, setImages] = useState<Array<{ url: string; alt: string }>>([])
  const [uploadingImg, setUploadingImg] = useState(false)

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description,
        features: product.features?.length ? product.features : [''],
        items: product.items?.length ? product.items : [''],
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        colors: product.colors as string[],
        status: product.status,
        launchEditionLimit: product.inventory.launchEditionLimit,
        soldCount: product.inventory.soldCount,
      })
      setImages(product.images)
    }
  }, [product])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...(isEdit ? { id } : {}),
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description,
        features: form.features.filter(Boolean),
        items: form.items.filter(Boolean),
        price: form.price,
        compareAtPrice: form.compareAtPrice,
        currency: 'NGN' as const,
        colors: form.colors.filter(Boolean) as any,
        images,
        inventory: {
          launchEditionLimit: form.launchEditionLimit,
          soldCount: form.soldCount,
          allowBackorder: false,
        },
        status: form.status,
        seo: {
          title: form.name + ' — Afínjú Authority Set',
          description: form.description.slice(0, 160),
        },
      }
      return upsertProduct(data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success(isEdit ? 'Product updated.' : 'Product created.')
      navigate('/admin/products')
    },
    onError: () => toast.error('Failed to save product.'),
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const { url } = await uploadToCloudinary(file, 'products')
      setImages(prev => [...prev, { url, alt: form.name }])
      toast.success('Image uploaded.')
    } catch {
      toast.error('Image upload failed.')
    } finally {
      setUploadingImg(false)
    }
  }

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="font-sans text-xs tracking-[0.12em] uppercase text-afinju-black/50">{label}</label>
      {children}
    </div>
  )

  const inputClass = "w-full border border-black/15 px-3 py-2.5 font-sans text-sm bg-white focus:outline-none focus:border-gold transition-colors"

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/products" className="font-sans text-xs text-afinju-black/40 hover:text-gold mb-2 block">← Products</Link>
          <h1 className="font-heading text-2xl">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.name}
          className="btn-luxury text-xs py-2.5 px-6 disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving...</span>
          ) : (isEdit ? 'Save Changes' : 'Create Product')}
        </button>
      </div>

      <div className="bg-white border border-black/8 p-8 space-y-6">
        <h2 className="font-display text-xs tracking-[0.2em]">BASIC INFO</h2>
        <F label="Product Name">
          <input
            value={form.name}
            onChange={e => { setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) })) }}
            placeholder="Afínjú Authority Set — Launch Edition"
            className={inputClass}
          />
        </F>
        <F label="URL Slug">
          <input
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            placeholder="afinju-authority-set-launch-edition"
            className={inputClass}
          />
        </F>
        <F label="Description">
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </F>
        <div className="grid grid-cols-2 gap-4">
          <F label="Price (₦)">
            <input
              type="number"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
              className={inputClass}
            />
          </F>
          <F label="Compare At Price (₦)">
            <input
              type="number"
              value={form.compareAtPrice}
              onChange={e => setForm(f => ({ ...f, compareAtPrice: Number(e.target.value) }))}
              className={inputClass}
            />
          </F>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <F label="Edition Limit">
            <input
              type="number"
              value={form.launchEditionLimit}
              onChange={e => setForm(f => ({ ...f, launchEditionLimit: Number(e.target.value) }))}
              className={inputClass}
            />
          </F>
          <F label="Units Sold">
            <input
              type="number"
              value={form.soldCount}
              onChange={e => setForm(f => ({ ...f, soldCount: Number(e.target.value) }))}
              className={inputClass}
            />
          </F>
        </div>
        <F label="Status">
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
            className={inputClass}
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        </F>
      </div>

      {/* What's Included */}
      <div className="bg-white border border-black/8 p-8 space-y-4">
        <h2 className="font-display text-xs tracking-[0.2em]">WHAT'S INCLUDED</h2>
        {form.items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? e.target.value : x) }))}
              placeholder={`Item ${i + 1}`}
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}
              className="p-2 text-afinju-black/30 hover:text-destructive transition-colors"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        <button
          onClick={() => setForm(f => ({ ...f, items: [...f.items, ''] }))}
          className="flex items-center gap-2 font-sans text-xs text-gold hover:text-gold-dark"
        >
          <Plus size={12} /> Add Item
        </button>
      </div>

      {/* Features */}
      <div className="bg-white border border-black/8 p-8 space-y-4">
        <h2 className="font-display text-xs tracking-[0.2em]">FEATURES / DETAILS</h2>
        {form.features.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={f}
              onChange={e => setForm(form => ({ ...form, features: form.features.map((x, j) => j === i ? e.target.value : x) }))}
              placeholder={`Feature ${i + 1}`}
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={() => setForm(form => ({ ...form, features: form.features.filter((_, j) => j !== i) }))}
              className="p-2 text-afinju-black/30 hover:text-destructive"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        <button
          onClick={() => setForm(f => ({ ...f, features: [...f.features, ''] }))}
          className="flex items-center gap-2 font-sans text-xs text-gold hover:text-gold-dark"
        >
          <Plus size={12} /> Add Feature
        </button>
      </div>

      {/* Product Colors */}
      <div className="bg-white border border-black/8 p-8 space-y-4">
        <h2 className="font-display text-xs tracking-[0.2em]">PRODUCT COLOURS</h2>
        <div className="p-3 bg-black/5 mb-2">
          <p className="font-sans text-xs text-afinju-black/60">
            Define the available colours for this product (e.g., Red, Blue, Black).
            If the product has no variations, you can leave this empty.
          </p>
        </div>
        
        {form.colors.map((color, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={color}
              onChange={e => setForm(f => ({ ...f, colors: f.colors.map((x, j) => j === i ? e.target.value : x) }))}
              placeholder="e.g. Red"
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={() => setForm(f => ({ ...f, colors: f.colors.filter((_, j) => j !== i) }))}
              className="p-2 text-afinju-black/30 hover:text-destructive transition-colors"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        <button
          onClick={() => setForm(f => ({ ...f, colors: [...f.colors, ''] }))}
          className="flex items-center gap-2 font-sans text-xs text-gold hover:text-gold-dark"
        >
          <Plus size={12} /> Add Colour
        </button>
      </div>

      {/* Images */}
      <div className="bg-white border border-black/8 p-8 space-y-4">
        <h2 className="font-display text-xs tracking-[0.2em]">PRODUCT IMAGES</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-[3/4] bg-afinju-cream overflow-hidden group">
              <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
              <button
                onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-6 h-6 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={11} strokeWidth={2} className="text-destructive" />
              </button>
            </div>
          ))}
          <label className={`aspect-[3/4] border-2 border-dashed border-black/15 flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors ${uploadingImg ? 'opacity-50' : ''}`}>
            {uploadingImg ? (
              <Loader2 size={20} className="animate-spin text-afinju-black/30" />
            ) : (
              <>
                <Upload size={20} strokeWidth={1.5} className="text-afinju-black/30" />
                <p className="font-sans text-[10px] text-afinju-black/30 mt-2 tracking-wider">Upload</p>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImg} />
          </label>
        </div>
      </div>
    </div>
  )
}
