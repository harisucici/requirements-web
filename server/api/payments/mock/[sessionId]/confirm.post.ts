import type { MockConfirmResult } from '../../../../../types/api'

export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const sessionId = getRouterParam(event, 'sessionId') ?? ''

  // Find the payment by session id
  const payment = d.payments.find(p => p.provider_session_id === sessionId)
  if (!payment) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Payment session not found.') })

  // Idempotency: if already succeeded, just return
  if (payment.status === 'succeeded') {
    const request = d.requests.find(r => r.id === payment.request_id)
    const token = tokenFor(d, payment.request_id) ?? ''
    const result: MockConfirmResult = {
      short_id: payment.short_id,
      token,
      status: request?.status ?? 'paid',
    }
    return envelope(result)
  }

  const request = d.requests.find(r => r.id === payment.request_id)
  if (!request) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Request not found for this payment.') })

  payment.status = 'succeeded'
  payment.paid_at = utcNow()

  if (payment.type === 'rush_surcharge') {
    // R-307: rush payment does not change request status; flag rush + pull ETA in 24h.
    request.is_rush = true
    request.due_at = new Date(Math.min(new Date(request.due_at ?? Date.now() + 86400_000).getTime(), Date.now() + 86400_000)).toISOString()
  } else {
    // Transition approved → paid
    request.paid_price_cents = payment.amount_cents
    request.free_revisions_total = freeRevisionTiers(payment.amount_cents)
    transition(d, request, 'paid', { type: 'system', name: 'Payment webhook' })
  }

  const token = tokenFor(d, request.id) ?? ''
  const result: MockConfirmResult = {
    short_id: request.short_id,
    token,
    status: request.status,
  }
  return envelope(result)
})
