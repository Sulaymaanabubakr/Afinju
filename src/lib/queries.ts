import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import {
  getProducts,
  getProductBySlug,
  getUserOrders,
  getOrderById,
  getAllOrders,
  getAdminProducts,
  getAllUsers,
  updateOrderStatus as updateOrderStatusDb
} from './db'
import type { Product, Order, HomepageContent, StatusEvent } from '@/types'
import { useEffect, useState } from 'react'

// ─── Products ─────────────────────────────────────────────────────────────────

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const product = await getProductBySlug(slug)
      if (!product) throw new Error('Product not found')
      return product
    },
    enabled: !!slug,
  })
}

// ─── Live inventory count ─────────────────────────────────────────────────────

export function useLiveInventory(productId: string) {
  const [soldCount, setSoldCount] = useState<number | null>(null)

  useEffect(() => {
    if (!productId) return

    // Fetch initial state
    supabase.from('products').select('inventory').eq('id', productId).single().then(({ data }) => {
      if (data && data.inventory) {
        setSoldCount(data.inventory.soldCount ?? 0)
      }
    })

    const channel = supabase.channel(`product-${productId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${productId}` }, (payload) => {
        if (payload.new && payload.new.inventory) {
          const inventory = typeof payload.new.inventory === 'string' ? JSON.parse(payload.new.inventory) : payload.new.inventory
          setSoldCount(inventory.soldCount ?? 0)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productId])

  return soldCount
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useMyOrders(userId: string | null) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: () => getUserOrders(userId!),
    enabled: !!userId,
  })
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const order = await getOrderById(orderId)
      if (!order) throw new Error('Order not found')
      return order
    },
    enabled: !!orderId,
  })
}

// Admin: all orders
export function useAllOrders(statusFilter?: string) {
  return useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => getAllOrders(statusFilter as any),
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
      await updateOrderStatusDb(orderId, status as Order['status'], note, adminNote)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

// ─── Homepage Content ─────────────────────────────────────────────────────────
// (Assuming getHomepageContent exists or is replaced by getSiteContent)
import { getSiteContent } from './db'

export function useHomepageContent() {
  return useQuery({
    queryKey: ['homepage-content'],
    queryFn: async () => {
      const content = await getSiteContent()
      return content as HomepageContent | null
    },
    staleTime: 1000 * 60 * 10,
  })
}

// ─── Admin: all products ──────────────────────────────────────────────────────

export function useAllProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: getAdminProducts,
  })
}

export function useAllCustomers() {
  return useQuery({
    queryKey: ['admin-customers'],
    queryFn: getAllUsers,
  })
}
