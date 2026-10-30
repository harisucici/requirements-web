/** Mock-only demo affordance: mark this checkout session's payment as failed
 *  with a readable reason (R-405: never expose raw gateway codes). */
export default defineEventHandler(async (event) => {
  await applyLatency()
  const d = useMockDb()
  const sessionId = getRouterParam(event, 'sessionId') ?? ''
  const payment = d.payments.find(p => p.provider_session_id === sessionId)
  if (!payment) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Payment session not found.') })
  if (payment.status === 'succeeded') {
    throw createError({ statusCode: 409, statusMessage: 'INVALID_TRANSITION', data: errorBody('INVALID_TRANSITION', 'This payment already succeeded.') })
  }
  payment.status = 'failed'
  payment.failure_reason = 'Your card was declined by the issuing bank. No charge was made.'
  const token = tokenFor(d, payment.request_id) ?? ''
  return envelope({ short_id: payment.short_id, token, status: 'failed', failure_reason: payment.failure_reason })
})
