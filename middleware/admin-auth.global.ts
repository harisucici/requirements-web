export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin') || to.path === '/admin/login') return
  const { fetchMe } = useAdminAuth()
  const me = await fetchMe()
  if (!me) {
    return navigateTo({ path: '/admin/login', query: { next: to.fullPath } })
  }
})
