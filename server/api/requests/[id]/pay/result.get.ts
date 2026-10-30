import type { PayResultData } from '../../../../../types/api'

export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const shortId = getRouterParam(event, 'id') ?? ''
  const request = findByShortId(d, shortId)
  if (!request) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Request not found.') })

  const q = getQuery(event)
  const sessionId = typeof q.session_id === 'string' ? q.session_id : null
  const payment = sessionId
    ? d.payments.find(p => p.provider_session_id === sessionId)
    : d.payments.filter(p => p.request_id === request.id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0]

  const token = tokenFor(d, request.id) ?? ''

  const result: PayResultData = {
    status: payment?.status === 'succeeded' ? 'succeeded' : payment?.status === 'failed' ? 'failed' : 'pending',
    failure_reason: payment?.failure_reason ?? null,
    short_id: request.short_id,
    token,
    paid_at: payment?.paid_at ?? null,
    due_at: request.due_at,
  }
  return envelope(result)
})
