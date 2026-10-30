import type { CheckoutResult } from '../../../types/api'

export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const body = await readBody<{ short_id?: string; request_id?: string; type?: 'main' | 'rush_surcharge' }>(event)

  const shortId = body.short_id ?? body.request_id
  const request = shortId ? findByShortId(d, shortId) : null
  if (!request) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Request not found.') })

  const isRush = body.type === 'rush_surcharge'
  if (isRush) {
    // R-307 (P2): rush upgrade while in development — surcharge = 50% of standard price (§9.7).
    if (request.status !== 'in_progress') {
      throw createError({ statusCode: 409, statusMessage: 'PAYMENT_CLOSED', data: errorBody('PAYMENT_CLOSED', 'Rush upgrade is only available while your tool is in development.') })
    }
  } else if (request.status !== 'approved') {
    throw createError({ statusCode: 409, statusMessage: 'PAYMENT_CLOSED', data: errorBody('PAYMENT_CLOSED', 'Payment is not available for this request status.') })
  }

  const sessionId = `cs_mock_${mockId('s')}`
  const amount = isRush ? Math.round((request.paid_price_cents ?? request.quoted_price_cents ?? 0) * 0.5) : (request.quoted_price_cents ?? 0)

  // Create Payment record in 'created' state
  d.payments.push({
    id: mockId('pay'), request_id: request.id, short_id: request.short_id,
    type: isRush ? 'rush_surcharge' : 'main', provider: 'mock', provider_session_id: sessionId,
    amount_cents: amount, fee_cents: null, discount_cents: 0, coupon_code: null,
    status: 'created', failure_reason: null, paid_at: null, created_at: utcNow(),
  })

  const result: CheckoutResult = { session_id: sessionId, url: `/payments/mock/${sessionId}` }
  return envelope(result)
})
