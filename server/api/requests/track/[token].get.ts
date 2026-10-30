export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const token = getRouterParam(event, 'token') ?? ''
  const meta = d.tokenMeta[token]
  const request = findByToken(d, token)

  if (!request) {
    throw createError({ statusCode: 404, statusMessage: 'TOKEN_NOT_FOUND', data: errorBody('TOKEN_NOT_FOUND', 'We could not find a request for this link.') })
  }
  const expired = meta?.expires_at && new Date(meta.expires_at) < new Date()
  if (expired || meta?.revoked_at) {
    throw createError({ statusCode: 410, statusMessage: 'TOKEN_EXPIRED', data: errorBody('TOKEN_EXPIRED', 'This tracking link has expired. Contact hello@requestroom.com with your request ID and we will help.') })
  }
  if (meta) meta.last_accessed_at = new Date().toISOString()

  return envelope(buildTrackedRequest(d, request))
})
