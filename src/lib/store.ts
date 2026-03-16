import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, ProductColor } from '@/types'

// ─── Cart Store ───────────────────────────────────────────────────────────────

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
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
        const itemLineId = getCartLineId(item)
        const existing = get().items.find((i) => getCartLineId(i) === itemLineId)
        if (existing) {
          set({
            items: get().items.map((i) =>
              getCartLineId(i) === itemLineId
                ? { ...i, lineId: itemLineId, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({ items: [...get().items, { ...item, lineId: itemLineId }] })
        }
      },

      removeItem: (lineId) =>
        set({ items: get().items.filter((i) => getCartLineId(i) !== lineId) }),

      updateQuantity: (lineId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineId)
          return
        }
        set({
          items: get().items.map((i) =>
            getCartLineId(i) === lineId ? { ...i, lineId, quantity } : i
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
