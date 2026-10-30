import type { AdminSession } from '~/types/api'

/**
 * Team session state backed by the HttpOnly rm_session cookie.
 * `me` is fetched once per navigation cycle via useState cache.
 */
export function useAdminAuth() {
  const api = useApi()
  const session = useState<AdminSession | null>('admin-session', () => null)
  const loading = useState<boolean>('admin-session-loading', () => false)

  async function fetchMe(force = false): Promise<AdminSession | null> {
    if (session.value && !force) return session.value
    loading.value = true
    try {
      session.value = await api.get<AdminSession>('/admin/me')
      return session.value
    } catch {
      session.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string): Promise<AdminSession> {
    const result = await api.post<AdminSession>('/admin/login', { email, password })
    session.value = result
    return result
  }

  async function logout() {
    try { await api.post('/admin/logout') } finally {
      session.value = null
      await navigateTo('/admin/login')
    }
  }

  function hasRole(...roles: string[]): boolean {
    return !!session.value && roles.includes(session.value.role)
  }

  return { session, loading, fetchMe, login, logout, hasRole }
}
