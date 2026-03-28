// Admin Products Page
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronDown, Download, Plus, Edit, Eye, Trash2 } from 'lucide-react'
import { deleteProduct, getAdminProducts } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { cloudinaryUrl } from '@/lib/cloudinary'
import toast from 'react-hot-toast'
import { useMemo, useRef, useState } from 'react'
import { exportDatasetAs, type ExportFormat } from '@/lib/adminExport'
import { useDismissiblePanel } from '@/hooks/useDismissiblePanel'
import { useConfirm } from '@/components/shared/ConfirmProvider'

export default function AdminProductsPage() {
  const confirm = useConfirm()
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement | null>(null)
  useDismissiblePanel(exportMenuRef, exportOpen, () => setExportOpen(false))
  const qc = useQueryClient()
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: getAdminProducts,
  })

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted.')
    },
    onError: () => toast.error('Failed to delete product.'),
  })

  const allProducts = products || []
  const activeProducts = allProducts.filter((p) => p.status === 'active')
  const draftProducts = allProducts.filter((p) => p.status !== 'active')
  const exportRows = useMemo(
    () =>
      allProducts.map((p) => {
        const limit = Number(p.inventory?.launchEditionLimit || 0)
        const sold = Number(p.inventory?.soldCount || 0)
        const remaining = Math.max(0, limit - sold)
        return [
          p.name,
          p.slug,
          p.status,
          p.price,
          sold,
          limit,
          remaining,
          p.colors.join(', '),
          p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '',
        ]
      }),
    [allProducts]
  )

  const runExport = async (formatType: ExportFormat) => {
    if (!allProducts.length) {
      toast.error('No products to export.')
      return
    }
    setExporting(true)
    setExportOpen(false)
    try {
      await exportDatasetAs(formatType, {
        fileBase: `afinju-products-${Date.now()}`,
        title: 'AFINJU Products Report',
        headers: ['Name', 'Slug', 'Status', 'Price (NGN)', 'Sold', 'Limit', 'Remaining', 'Colours', 'Created'],
        rows: exportRows,
      })
      toast.success(`${formatType.toUpperCase()} exported.`)
    } catch (err) {
      console.error(err)
      toast.error('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const renderSection = (title: string, sectionProducts: typeof allProducts) => (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xs tracking-[0.2em] uppercase text-afinju-black/55">{title}</h2>
        <span className="font-sans text-xs text-afinju-black/45">{sectionProducts.length} item(s)</span>
      </div>
      {sectionProducts.length === 0 ? (
        <div className="bg-white border border-black/8 p-5">
          <p className="font-sans text-sm text-afinju-black/40">No products in this section.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sectionProducts.map((product) => {
            const limit = Number(product.inventory?.launchEditionLimit || 0)
            const sold = Number(product.inventory?.soldCount || 0)
            const remaining = Math.max(0, limit - sold)

            return (
              <div key={product.id} className="bg-white border border-black/8 p-6 flex items-center gap-6">
                <div className="w-16 h-20 flex-shrink-0 bg-afinju-cream overflow-hidden">
                  <img
                    src={cloudinaryUrl(product.images[0]?.url || '', { width: 128, height: 160, quality: 'auto' })}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-base">{product.name}</p>
                  <p className="font-sans text-xs text-afinju-black/40 mt-1">/{product.slug}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="font-sans text-sm">{formatPrice(product.price)}</span>
                    <span className="font-sans text-xs text-afinju-black/50">
                      Inventory: {sold}/{limit} sold
                    </span>
                    <span className={`font-sans text-xs ${remaining <= 2 ? 'text-red-600' : 'text-emerald-700'}`}>
                      Remaining: {remaining}
                    </span>
                    <span className={`font-sans text-[10px] px-2 py-0.5 uppercase tracking-wider ${
                      product.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/product/${product.slug}`}
                    className="flex items-center gap-1.5 border border-black/15 px-3 py-2 font-sans text-xs hover:border-afinju-black transition-colors"
                  >
                    <Eye size={12} strokeWidth={1.5} /> View
                  </Link>
                  <Link
                    to={`/admin/products/${product.id}/edit`}
                    className="flex items-center gap-1.5 btn-luxury text-xs py-2 px-3"
                  >
                    <Edit size={12} strokeWidth={1.5} /> Edit
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Delete Product',
                        message: `Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`,
                        confirmText: 'Delete',
                        variant: 'danger'
                      })
                      if (ok) deleteMutation.mutate(product.id)
                    }}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5 border border-red-200 text-red-700 px-3 py-2 font-sans text-xs hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} strokeWidth={1.5} /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">Products</h1>
          <p className="font-sans text-sm text-afinju-black/40">{allProducts.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              disabled={exporting}
              className="flex items-center gap-2 font-sans text-xs tracking-wider uppercase border border-black/20 px-4 py-2 hover:border-gold transition-colors disabled:opacity-50"
            >
              <Download size={13} strokeWidth={1.5} />
              {exporting ? 'Exporting...' : 'Export'}
              <ChevronDown size={12} strokeWidth={1.8} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-black/10 shadow-lg z-20">
                {[
                  ['pdf', 'Export as PDF'],
                  ['excel', 'Export as Excel'],
                  ['doc', 'Export as DOC'],
                  ['csv', 'Export as CSV'],
                  ['png', 'Export as PNG'],
                  ['jpg', 'Export as JPG'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => runExport(value as ExportFormat)}
                    className="w-full text-left px-3 py-2 text-xs font-sans tracking-wide hover:bg-black/5 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link
            to="/admin/products/new"
            className="flex items-center gap-2 btn-luxury text-xs py-2.5 px-5"
          >
            <Plus size={14} strokeWidth={2} />
            Add Product
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="skeleton h-24" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {renderSection('Active Products', activeProducts)}
          {renderSection('Draft Products', draftProducts)}
        </div>
      )}
    </div>
  )
}
