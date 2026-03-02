// Admin Products Page
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Edit, Eye } from 'lucide-react'
import { getProducts } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { cloudinaryUrl } from '@/lib/cloudinary'

export default function AdminProductsPage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">Products</h1>
          <p className="font-sans text-sm text-afinju-black/40">{products?.length || 0} products</p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 btn-luxury text-xs py-2.5 px-5"
        >
          <Plus size={14} strokeWidth={2} />
          Add Product
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="skeleton h-24" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(products || []).map(product => (
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
                <div className="flex items-center gap-4 mt-2">
                  <span className="font-sans text-sm">{formatPrice(product.price)}</span>
                  <span className="font-sans text-xs text-afinju-black/40">
                    {product.inventory.soldCount}/{product.inventory.launchEditionLimit} sold
                  </span>
                  <span className={`font-sans text-[10px] px-2 py-0.5 uppercase tracking-wider ${
                    product.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
