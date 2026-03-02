import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import type { ReactNode } from 'react'

interface GuardProps {
  children: ReactNode
}

export function RequireAuth({ children }: GuardProps) {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) {
    return <Navigate to={`/login?return=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}

export function RequireAdmin({ children }: GuardProps) {
  const { user, loading, isAdmin } = useAuthStore()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin()) return <Navigate to="/" replace />

  return <>{children}</>
}

export function RequireStaff({ children }: GuardProps) {
  const { user, loading, isStaff } = useAuthStore()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (!isStaff()) return <Navigate to="/" replace />

  return <>{children}</>
}

export function RedirectIfAuth({ children }: GuardProps) {
  const { user, loading } = useAuthStore()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (user) return <Navigate to="/account" replace />

  return <>{children}</>
}
