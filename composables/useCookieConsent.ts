export interface CookieConsent {
  necessary: true
  analytics: boolean
  marketing: boolean
  savedAt: string
}

const KEY = 'rm_cookie_consent_v1'
const TTL_DAYS = 365 // NF-C3: preference valid 1 year

export function useCookieConsent() {
  const consent = useState<CookieConsent | null>('cookie-consent', () => null)
  const bannerVisible = useState<boolean>('cookie-banner-visible', () => false)

  function load() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CookieConsent
        const age = Date.now() - new Date(parsed.savedAt).getTime()
        if (age < TTL_DAYS * 86400_000) {
          consent.value = parsed
          return
        }
        localStorage.removeItem(KEY)
      }
    } catch { /* corrupted entry → show banner */ }
    bannerVisible.value = true
  }

  async function save(analytics: boolean, marketing: boolean) {
    const value: CookieConsent = { necessary: true, analytics, marketing, savedAt: new Date().toISOString() }
    consent.value = value
    bannerVisible.value = false
    if (import.meta.client) localStorage.setItem(KEY, JSON.stringify(value))
    try {
      const api = useApi()
      await api.post('/cookie-consent', { categories: { necessary: true, analytics, marketing } })
    } catch { /* audit call is best-effort in mock phase */ }
  }

  onMounted(load)
  return { consent, bannerVisible, save, allowsAnalytics: computed(() => consent.value?.analytics ?? false) }
}
