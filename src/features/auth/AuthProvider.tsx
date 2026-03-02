import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserProfile, createUserProfile } from '@/lib/db'
import { useAuthStore } from '@/store/auth'
import type { UserProfile } from '@/types'

const AuthContext = createContext<null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        // Get or create user profile
        let profile = await getUserProfile(firebaseUser.uid)

        if (!profile) {
          const newProfile: Omit<UserProfile, 'createdAt'> = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            phone: firebaseUser.phoneNumber || undefined,
            displayName: firebaseUser.displayName || undefined,
            role: 'customer',
          }
          await createUserProfile(newProfile)
          profile = { ...newProfile, createdAt: new Date() }
        }

        // Check custom claims for admin role
        const tokenResult = await firebaseUser.getIdTokenResult()
        if (tokenResult.claims.role) {
          profile = { ...profile, role: tokenResult.claims.role as UserProfile['role'] }
        }

        setUser(profile)
      } catch (err) {
        console.error('Auth error:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [setUser, setLoading])

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}
