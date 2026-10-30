export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const sessionId = getRouterParam(event, 'sessionId') ?? ''

  const payment = d.payments.find(p => p.provider_session_id === sessionId)
  if (!payment) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Payment session not found.') })

  return envelope({
    session_id: sessionId,
    short_id: payment.short_id,
    amount_cents: payment.amount_cents,
    status: payment.status,
    type: payment.type,
  })
})
