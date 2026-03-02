import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, ProductColor } from '@/types'
import type { User as FirebaseUser } from 'firebase/auth'

// ─── Cart Store ───────────────────────────────────────────────────────────────

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({ items: [...get().items, item] })
        }
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
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

// ─── Auth Store ───────────────────────────────────────────────────────────────

interface AuthStore {
  user: FirebaseUser | null
  userRole: 'customer' | 'admin' | 'staff' | null
  loading: boolean
  setUser: (user: FirebaseUser | null) => void
  setUserRole: (role: 'customer' | 'admin' | 'staff' | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  userRole: null,
  loading: true,
  setUser: (user) => set({ user }),
  setUserRole: (userRole) => set({ userRole }),
  setLoading: (loading) => set({ loading }),
}))

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
