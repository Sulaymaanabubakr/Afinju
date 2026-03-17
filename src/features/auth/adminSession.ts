const ADMIN_ACCESS_KEY = 'afinju_admin_access'
const ADMIN_ACCESS_TTL_MS = 15 * 60 * 1000

type AdminAccessSession = {
  uid: string
  grantedAt: number
}

export function grantAdminAccess(uid: string): void {
  const payload: AdminAccessSession = {
    uid,
    grantedAt: Date.now(),
  }
  sessionStorage.setItem(ADMIN_ACCESS_KEY, JSON.stringify(payload))
}

export function clearAdminAccess(): void {
  sessionStorage.removeItem(ADMIN_ACCESS_KEY)
}

export function hasFreshAdminAccess(uid?: string | null): boolean {
  if (!uid) return false

  const raw = sessionStorage.getItem(ADMIN_ACCESS_KEY)
  if (!raw) return false

  try {
    const parsed = JSON.parse(raw) as AdminAccessSession
    if (!parsed?.uid || typeof parsed?.grantedAt !== 'number') return false
    if (parsed.uid !== uid) return false
    if (Date.now() - parsed.grantedAt > ADMIN_ACCESS_TTL_MS) return false
    return true
  } catch {
    return false
  }
}

