import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  onSnapshot,
  limit,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Product, Order, HomepageContent, StatusEvent } from '@/types'
import { useEffect, useState } from 'react'

// ─── Products ─────────────────────────────────────────────────────────────────

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const q = query(
        collection(db, 'products'),
        where('status', '==', 'active')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
    },
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const q = query(collection(db, 'products'), where('slug', '==', slug), limit(1))
      const snap = await getDocs(q)
      if (snap.empty) throw new Error('Product not found')
      const d = snap.docs[0]
      return { id: d.id, ...d.data() } as Product
    },
    enabled: !!slug,
  })
}

// ─── Live inventory count ─────────────────────────────────────────────────────

export function useLiveInventory(productId: string) {
  const [soldCount, setSoldCount] = useState<number | null>(null)

  useEffect(() => {
    if (!productId) return
    const unsub = onSnapshot(doc(db, 'products', productId), (snap) => {
      const data = snap.data()
      if (data) setSoldCount(data.inventory?.soldCount ?? 0)
    })
    return unsub
  }, [productId])

  return soldCount
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useMyOrders(userId: string | null) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: async () => {
      if (!userId) return []
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
    },
    enabled: !!userId,
  })
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'orders', orderId))
      if (!snap.exists()) throw new Error('Order not found')
      return { id: snap.id, ...snap.data() } as Order
    },
    enabled: !!orderId,
  })
}

// Admin: all orders
export function useAllOrders(statusFilter?: string) {
  return useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      if (statusFilter && statusFilter !== 'all') {
        q = query(
          collection(db, 'orders'),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        )
      }
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
    },
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      note,
      adminNote,
    }: {
      orderId: string
      status: string
      note?: string
      adminNote?: string
    }) => {
      const event: StatusEvent = {
        status: status as Order['status'],
        timestamp: new Date(),
        note,
        internalNote: adminNote,
      }
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        statusTimeline: arrayUnion(event),
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

// ─── Homepage Content ─────────────────────────────────────────────────────────

export function useHomepageContent() {
  return useQuery({
    queryKey: ['homepage-content'],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'config', 'content'))
      if (!snap.exists()) return null
      return snap.data() as HomepageContent
    },
    staleTime: 1000 * 60 * 10,
  })
}

// ─── Admin: all products ──────────────────────────────────────────────────────

export function useAllProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'products'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
    },
  })
}

export function useAllCustomers() {
  return useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
  })
}
