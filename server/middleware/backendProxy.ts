/**
 * Env-gated reverse proxy to the real FastAPI backend.
 *
 * When NUXT_BACKEND_PROXY_TARGET is set (e.g. http://localhost:8000), every
 * /api/* request is proxied server-side BEFORE Nitro's filesystem mock routes
 * get a chance — the browser stays same-origin, so session cookies
 * (rm_session / rm_user_session) and SSR cookie forwarding work unchanged.
 *
 * When unset (default), this middleware is a no-op and the Nitro mock routes
 * under server/api/** serve /api/* as before.
 *
 * /api/__mock/* is never proxied (mock-only endpoints such as reset).
 */
export default defineEventHandler(async (event) => {
  const target = useRuntimeConfig().backendProxyTarget as string
  if (!target) return // mock mode → fall through to server/api/**

  const url = getRequestURL(event)
  if (!url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/api/__mock/')) return

  const qs = url.search // includes leading '?' or empty string
  return proxyRequest(event, `${target.replace(/\/$/, '')}${url.pathname}${qs}`, {
    // Forward method, headers (incl. Cookie) and body; return status and
    // Set-Cookie verbatim so cookie-based sessions pass through untouched.
    fetchOptions: { headers: event.node.req.headers as HeadersInit },
  })
})
