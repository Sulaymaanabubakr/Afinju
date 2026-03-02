import { useEffect } from 'react'
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/lib/store'

export function useAuthInit() {
  const { setUser, setUserRole, setLoading } = useAuthStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        try {
          const tokenResult = await getIdTokenResult(user)
          const role = tokenResult.claims.role as string | undefined
          setUserRole((role as 'admin' | 'staff' | 'customer') ?? 'customer')
        } catch {
          setUserRole('customer')
        }
      } else {
        setUser(null)
        setUserRole(null)
      }
      setLoading(false)
    })
    return unsub
  }, [setUser, setUserRole, setLoading])
}
