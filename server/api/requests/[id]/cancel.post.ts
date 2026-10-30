export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const token = getRouterParam(event, 'id') ?? ''
  const request = findByToken(d, token)
  if (!request) throw createError({ statusCode: 404, statusMessage: 'TOKEN_NOT_FOUND', data: errorBody('TOKEN_NOT_FOUND', 'Request not found.') })

  const body = await readBody<{ reason?: string; cancel_note?: string; refund_reason_code?: string }>(event)
  const q = getQuery(event)
  const isRefund = q.refund === '1'

  // completed → refund request flow (R-702)
  if (request.status === 'completed') {
    if (!isRefund) {
      throw createError({ statusCode: 409, statusMessage: 'INVALID_TRANSITION', data: errorBody('INVALID_TRANSITION', 'Completed requests cannot be canceled. Use the refund request flow instead.') })
    }
    const payment = d.payments.find(p => p.request_id === request.id && p.status === 'succeeded')
    if (!payment) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'No payment found for this request.') })

    const estimate = refundEstimate(request)
    d.refunds.push({
      id: mockId('rf'), payment_id: payment.id, request_id: request.id, short_id: request.short_id,
      reason_code: (body.refund_reason_code ?? 'other') as any,
      requested_amount_cents: payment.amount_cents, approved_amount_cents: null,
      fee_deducted_cents: estimate.fee_cents, original_amount_cents: payment.amount_cents,
      status: 'requested', reviewed_by: null, note: body.cancel_note ?? null,
      created_at: utcNow(), processed_at: null,
    })
    return envelope({ status: 'refund_requested', message: 'Your refund request has been submitted for review.' })
  }

  // in_progress → conditional cancel (requires review)
  if (request.status === 'in_progress') {
    const payment = d.payments.find(p => p.request_id === request.id && p.status === 'succeeded')
    const estimate = refundEstimate(request)

    if (payment) {
      d.refunds.push({
        id: mockId('rf'), payment_id: payment.id, request_id: request.id, short_id: request.short_id,
        reason_code: 'partial_in_progress', requested_amount_cents: estimate.refundable_cents,
        approved_amount_cents: null, fee_deducted_cents: estimate.fee_cents,
        original_amount_cents: payment.amount_cents, status: 'requested',
        reviewed_by: null, note: body.cancel_note ?? null, created_at: utcNow(), processed_at: null,
      })
    }
    transition(d, request, 'canceled', { type: 'user', name: request.user_email }, { reason: body.reason ?? 'user_canceled' })
    request.cancel_reason = body.reason ?? null
    request.cancel_note = body.cancel_note ?? null
    return envelope({ status: 'canceled', refund_status: 'requested', message: 'Your request has been canceled. A refund review is in progress.' })
  }

  // paid → cancel + auto refund
  if (request.status === 'paid') {
    const payment = d.payments.find(p => p.request_id === request.id && p.status === 'succeeded')
    if (payment) {
      const estimate = refundEstimate(request)
      d.refunds.push({
        id: mockId('rf'), payment_id: payment.id, request_id: request.id, short_id: request.short_id,
        reason_code: 'canceled_before_dev', requested_amount_cents: estimate.refundable_cents,
        approved_amount_cents: estimate.refundable_cents, fee_deducted_cents: estimate.fee_cents,
        original_amount_cents: payment.amount_cents, status: 'approved',
        reviewed_by: null, note: 'Auto-approved: canceled before development started.', created_at: utcNow(), processed_at: utcNow(),
      })
    }
    transition(d, request, 'canceled', { type: 'user', name: request.user_email }, { reason: body.reason ?? 'user_canceled' })
    request.cancel_reason = body.reason ?? null
    request.cancel_note = body.cancel_note ?? null
    return envelope({ status: 'canceled', refund_status: 'approved', message: 'Your request has been canceled and a refund has been initiated. Allow 3-5 business days.' })
  }

  // pending / approved / needs_clarification → simple cancel (no payment)
  transition(d, request, 'canceled', { type: 'user', name: request.user_email }, { reason: body.reason ?? 'user_canceled' })
  request.cancel_reason = body.reason ?? null
  request.cancel_note = body.cancel_note ?? null
  return envelope({ status: 'canceled', message: 'Your request has been canceled.' })
})
