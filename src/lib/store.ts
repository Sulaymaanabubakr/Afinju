import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, ProductColor } from '@/types'

// ─── Cart Store ───────────────────────────────────────────────────────────────

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => { addedQuantity: number; limited: boolean }
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  total: () => number
  itemCount: () => number
}

function getCartLineId(item: CartItem): string {
  return item.lineId || [
    item.productId,
    item.preferences?.preferredColor || '',
    item.preferences?.shoeSize || '',
    item.preferences?.headSize || '',
  ].join(':')
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const maxAvailable = typeof item.maxAvailable === 'number' ? Math.max(0, item.maxAvailable) : undefined
        const existingProductQty = get()
          .items
          .filter((i) => i.productId === item.productId)
          .reduce((sum, i) => sum + i.quantity, 0)
        const allowedAdditional = maxAvailable === undefined
          ? item.quantity
          : Math.max(0, maxAvailable - existingProductQty)
        const addedQuantity = Math.min(item.quantity, allowedAdditional)
        if (addedQuantity <= 0) return { addedQuantity: 0, limited: true }

        const itemLineId = getCartLineId(item)
        const existing = get().items.find((i) => getCartLineId(i) === itemLineId)
        if (existing) {
          set({
            items: get().items.map((i) =>
              getCartLineId(i) === itemLineId
                ? {
                  ...i,
                  lineId: itemLineId,
                  quantity: i.quantity + addedQuantity,
                  ...(maxAvailable !== undefined ? { maxAvailable } : {}),
                }
                : i
            ),
          })
        } else {
          set({
            items: [
              ...get().items,
              {
                ...item,
                lineId: itemLineId,
                quantity: addedQuantity,
                ...(maxAvailable !== undefined ? { maxAvailable } : {}),
              },
            ],
          })
        }

        return { addedQuantity, limited: addedQuantity < item.quantity }
      },

      removeItem: (lineId) =>
        set({ items: get().items.filter((i) => getCartLineId(i) !== lineId) }),

      updateQuantity: (lineId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineId)
          return
        }
        const current = get().items.find((i) => getCartLineId(i) === lineId)
        if (!current) return
        const maxAvailable = typeof current.maxAvailable === 'number' ? Math.max(0, current.maxAvailable) : undefined
        const otherLinesQty = get()
          .items
          .filter((i) => i.productId === current.productId && getCartLineId(i) !== lineId)
          .reduce((sum, i) => sum + i.quantity, 0)
        const maxForLine = maxAvailable === undefined
          ? quantity
          : Math.max(0, maxAvailable - otherLinesQty)
        const nextQuantity = Math.min(quantity, maxForLine)
        if (nextQuantity <= 0) {
          get().removeItem(lineId)
          return
        }
        set({
          items: get().items.map((i) =>
            getCartLineId(i) === lineId ? { ...i, lineId, quantity: nextQuantity } : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'afinju-cart' }
  )
)

// ─── Preferences Store (for product page state) ───────────────────────────────

interface PreferencesStore {
  shoeSize: string
  headSize: string
  preferredColor: ProductColor | ''
  setShoeSize: (size: string) => void
  setHeadSize: (size: string) => void
  setPreferredColor: (color: ProductColor) => void
  reset: () => void
}

export const usePreferencesStore = create<PreferencesStore>((set) => ({
  shoeSize: '',
  headSize: '',
  preferredColor: '',
  setShoeSize: (shoeSize) => set({ shoeSize }),
  setHeadSize: (headSize) => set({ headSize }),
  setPreferredColor: (preferredColor) => set({ preferredColor }),
  reset: () => set({ shoeSize: '', headSize: '', preferredColor: '' }),
}))
