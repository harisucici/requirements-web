import type { User } from '~/types/api'

/**
 * User session state backed by the rm_user_session HttpOnly cookie (P1).
 */
export function useUserAuth() {
  const api = useApi()
  const user = useState<User | null>('user-session', () => null)
  const loading = useState<boolean>('user-session-loading', () => false)

  async function fetchMe(force = false): Promise<User | null> {
    if (user.value && !force) return user.value
    loading.value = true
    try {
      user.value = await api.get<User>('/my/account')
      return user.value
    } catch {
      user.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string): Promise<User> {
    const result = await api.post<User>('/auth/login', { email, password })
    user.value = result
    return result
  }

  async function logout() {
    try { await api.post('/auth/logout') } finally {
      user.value = null
      await navigateTo('/login')
    }
  }

  return { user, loading, fetchMe, login, logout }
}
