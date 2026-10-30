import type { ApiResponse } from '~/types/api'

/** Typed API error carrying the mock/real backend error code (architecture §8). */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public payload?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function unwrapError(err: unknown): ApiError {
  const e = err as { statusCode?: number; status?: number; data?: ApiResponse<unknown> & { code?: string; message?: string } }
  const body = e?.data
  const code = body?.code ?? 'CONNECTION_FAILED'
  const message = body?.message ?? 'Connection failed, please try again'
  return new ApiError(code, message, e?.statusCode ?? e?.status ?? 0, body?.data)
}

/**
 * Envelope-aware HTTP client. All responses are {code, message, data};
 * callers receive `data` directly and errors as ApiError with a stable `code`.
 */
export function useApi() {
  const config = useRuntimeConfig()
  // Empty apiBase → same-origin Nitro mock under /api. A configured base
  // (e.g. http://localhost:8000/api) is used verbatim.
  const base = (config.public.apiBase as string) || '/api'

  async function request<T>(path: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    try {
      // Forward cookies during SSR so internal Nitro calls see the session.
      const serverHeaders: Record<string, string> = {}
      if (import.meta.server && base.startsWith('/')) {
        const cookie = useRequestEvent()?.node.req.headers.cookie
        if (cookie) serverHeaders.cookie = cookie
      }
      const res = await $fetch<ApiResponse<T>>(`${base}${path}`, {
        ...opts,
        headers: { ...serverHeaders, ...(opts.headers as Record<string, string> | undefined), accept: 'application/json' },
      })
      // Tolerate non-enveloped bodies during the backend switch-over.
      if (res && typeof res === 'object' && 'code' in res && 'data' in res) {
        if (res.code !== 'OK') throw new ApiError(res.code, res.message, 200, res.data)
        return res.data as T
      }
      return res as unknown as T
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw unwrapError(err)
    }
  }

  type Body = Record<string, unknown> | unknown[] | BodyInit | null

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: Body) => request<T>(path, { method: 'POST', body: body as Record<string, any> }),
    patch: <T>(path: string, body?: Body) => request<T>(path, { method: 'PATCH', body: body as Record<string, any> }),
    put: <T>(path: string, body?: Body) => request<T>(path, { method: 'PUT', body: body as Record<string, any> }),
    del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  }
}
