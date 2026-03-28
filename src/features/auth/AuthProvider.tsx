import { createContext, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserProfile, createUserProfile } from '@/lib/db'
import { useAuthStore } from '@/store/auth'
import type { UserProfile } from '@/types'
import { clearAdminAccess } from './adminSession'

const AuthContext = createContext<null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    let mounted = true

    async function handleUser(sessionUser: any | null) {
      if (!sessionUser) {
        if (mounted) {
          clearAdminAccess()
          setUser(null)
          setLoading(false)
        }
        return
      }

      const fallbackProfile: UserProfile = {
        uid: sessionUser.id,
        email: sessionUser.email || undefined,
        phone: sessionUser.phone || undefined,
        displayName: sessionUser.user_metadata?.full_name || undefined,
        role: 'customer',
        createdAt: new Date(),
      }

      try {
        let profile = await getUserProfile(sessionUser.id)

        if (!profile) {
          const newProfile: Omit<UserProfile, 'createdAt'> = {
            uid: fallbackProfile.uid,
            email: fallbackProfile.email,
            phone: fallbackProfile.phone,
            displayName: fallbackProfile.displayName,
            role: fallbackProfile.role,
          }
          await createUserProfile(newProfile)
          profile = { ...newProfile, createdAt: new Date() }
        }

        // Handle role from custom claims if they were using that in metadata
        // With Supabase it's safer to rely on the Postgres users table row which we just fetched
        if (profile.role !== 'admin' && profile.role !== 'staff') {
          clearAdminAccess()
        }

        if (mounted) {
          setUser(profile)
        }
      } catch (err) {
        console.error('Auth error:', err)
        if (mounted) {
          clearAdminAccess()
          setUser(fallbackProfile)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    // Initial check
    setLoading(true)
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUser(session?.user || null)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true)
      handleUser(session?.user || null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}
