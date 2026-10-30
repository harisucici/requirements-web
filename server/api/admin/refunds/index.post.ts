export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const body = await readBody(event) as { short_id: string; reason_code: string; requested_amount_cents: number }
  if (!body.short_id || !body.reason_code || !body.requested_amount_cents) {
    throw createError({ statusCode: 400, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'short_id, reason_code, and requested_amount_cents are required') })
  }

  const r = findByShortId(d, body.short_id)
  if (!r) {
    throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Request not found') })
  }

  const payment = d.payments.find(p => p.request_id === r.id && p.status === 'succeeded')
  if (!payment) {
    throw createError({ statusCode: 400, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'No successful payment found for this request') })
  }

  const feeDeducted = refundFee(body.requested_amount_cents)

  const refund = {
    id: mockId('rf'),
    payment_id: payment.id,
    request_id: r.id,
    short_id: r.short_id,
    reason_code: body.reason_code as import('~~/types/enums').RefundReasonCode,
    requested_amount_cents: body.requested_amount_cents,
    approved_amount_cents: null,
    fee_deducted_cents: feeDeducted,
    original_amount_cents: payment.amount_cents,
    status: 'requested' as const,
    reviewed_by: null,
    note: null,
    created_at: utcNow(),
    processed_at: null,
  }

  d.refunds.push(refund)

  return envelope(refund)
})
