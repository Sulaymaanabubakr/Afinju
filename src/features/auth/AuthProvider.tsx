import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserProfile, createUserProfile } from '@/lib/db'
import { useAuthStore } from '@/store/auth'
import type { UserProfile } from '@/types'
import { clearAdminAccess } from './adminSession'

const AuthContext = createContext<null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true)

      if (!firebaseUser) {
        clearAdminAccess()
        setUser(null)
        setLoading(false)
        return
      }

      const fallbackProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || undefined,
        phone: firebaseUser.phoneNumber || undefined,
        displayName: firebaseUser.displayName || undefined,
        role: 'customer',
        createdAt: new Date(),
      }

      try {
        // Get or create user profile
        let profile = await getUserProfile(firebaseUser.uid)

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

        // Force-refresh token once so newly assigned admin/staff claims are picked up immediately.
        const tokenResult = await firebaseUser.getIdTokenResult(true)
        const claimRole = tokenResult.claims.role as UserProfile['role'] | undefined
        if (claimRole) {
          profile = { ...profile, role: claimRole }
        }
        if (profile.role !== 'admin' && profile.role !== 'staff') {
          clearAdminAccess()
        }

        setUser(profile)
      } catch (err) {
        console.error('Auth error:', err)
        // Keep authenticated UX working even if profile read/write fails transiently.
        clearAdminAccess()
        setUser(fallbackProfile)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [setUser, setLoading])

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}
