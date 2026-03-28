import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminProducts, upsertProduct } from '@/lib/db'
import { Package, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function AdminInventoryPage() {
  const qc = useQueryClient()
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products-inventory'],
    queryFn: getAdminProducts,
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ limit: 0, sold: 0 })

  const updateMutation = useMutation({
    mutationFn: async ({ id, limit, sold }: { id: string; limit: number; sold: number }) => {
      const product = products?.find(p => p.id === id)
      if (!product) throw new Error('Product not found')
      
      return upsertProduct({
        ...product,
        inventory: {
          ...product.inventory,
          launchEditionLimit: limit,
          soldCount: sold,
        }
      } as any)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products-inventory'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success('Inventory updated.')
      setEditingId(null)
    },
    onError: () => toast.error('Failed to update inventory.')
  })

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-gold" size={32} />
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl mb-1">Inventory Management</h1>
        <p className="font-sans text-sm text-afinju-black/40">Manage stock levels across all products</p>
      </div>

      <div className="bg-white border border-black/8 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/2 border-b border-black/8">
              <th className="px-6 py-4 font-display text-[10px] tracking-widest uppercase text-afinju-black/50">Product</th>
              <th className="px-6 py-4 font-display text-[10px] tracking-widest uppercase text-afinju-black/50">Current Stock</th>
              <th className="px-6 py-4 font-display text-[10px] tracking-widest uppercase text-afinju-black/50">Total Limit</th>
              <th className="px-6 py-4 font-display text-[10px] tracking-widest uppercase text-afinju-black/50">Units Sold</th>
              <th className="px-6 py-4 font-display text-[10px] tracking-widest uppercase text-afinju-black/50 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {products?.map((product) => {
              const limit = product.inventory.launchEditionLimit
              const sold = product.inventory.soldCount
              const remaining = Math.max(0, limit - sold)
              const isLow = remaining <= 3 && remaining > 0
              const isOut = remaining === 0
              const isEditing = editingId === product.id

              return (
                <tr key={product.id} className="hover:bg-black/[0.01] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-afinju-cream overflow-hidden border border-black/5">
                        <img src={product.images[0]?.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-sans text-sm font-medium">{product.name}</p>
                        <p className="font-sans text-[10px] text-afinju-black/40 mt-0.5 tracking-wider uppercase">/{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       {isOut ? (
                         <span className="flex items-center gap-1.5 text-red-600 font-sans text-xs font-bold uppercase tracking-tight">
                           <AlertTriangle size={12} /> Out of Stock
                         </span>
                       ) : isLow ? (
                         <span className="flex items-center gap-1.5 text-amber-600 font-sans text-xs font-bold uppercase tracking-tight">
                           <AlertTriangle size={12} /> Low Stock ({remaining})
                         </span>
                       ) : (
                         <span className="flex items-center gap-1.5 text-emerald-700 font-sans text-xs font-bold uppercase tracking-tight">
                           <CheckCircle2 size={12} /> {remaining} Available
                         </span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-20 border border-gold/30 bg-gold/5 px-2 py-1 font-sans text-sm"
                        value={editValues.limit}
                        onChange={e => setEditValues(v => ({ ...v, limit: Number(e.target.value) }))}
                      />
                    ) : (
                      <span className="font-sans text-sm text-afinju-black/60">{limit}</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-20 border border-gold/30 bg-gold/5 px-2 py-1 font-sans text-sm"
                        value={editValues.sold}
                        onChange={e => setEditValues(v => ({ ...v, sold: Number(e.target.value) }))}
                      />
                    ) : (
                      <span className="font-sans text-sm text-afinju-black/60">{sold}</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 font-sans text-[10px] uppercase tracking-wider text-afinju-black/40 hover:text-afinju-black transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => updateMutation.mutate({ id: product.id, limit: editValues.limit, sold: editValues.sold })}
                          disabled={updateMutation.isPending}
                          className="btn-gold px-4 py-1.5 text-[10px] uppercase tracking-wider disabled:opacity-50"
                        >
                           {updateMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(product.id)
                          setEditValues({ limit, sold })
                        }}
                        className="inline-flex items-center gap-2 font-display text-[10px] tracking-widest uppercase text-gold hover:text-gold-dark transition-colors"
                      >
                        Adjust Stock
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <div className="bg-gold/5 border border-gold/20 p-6 flex gap-4 items-start">
        <Package className="text-gold mt-1" size={20} />
        <div>
          <h3 className="font-heading text-base mb-1">Stock Calculation</h3>
          <p className="font-sans text-sm text-afinju-black/60 max-w-2xl leading-relaxed">
            The remaining stock is calculated as <strong>Total Limit - Units Sold</strong>. 
            Units sold increments automatically when an order is paid, but you can manually adjust either value here to fix mistakes or reflect manual stock additions.
          </p>
        </div>
      </div>
    </div>
  )
}
