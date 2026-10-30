export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireRole(event, d, ['admin'])
  await applyLatency()
  checkFault(event)

  const id = getRouterParam(event, 'id')!
  const refund = d.refunds.find(rf => rf.id === id)
  if (!refund) {
    throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Refund not found') })
  }

  if (refund.status !== 'requested' && refund.status !== 'approved') {
    throw createError({ statusCode: 409, statusMessage: 'INVALID_TRANSITION', data: errorBody('INVALID_TRANSITION', `Refund is already ${refund.status}`) })
  }

  const body = await readBody(event) as { approved_amount_cents: number }
  if (!body.approved_amount_cents || body.approved_amount_cents <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'approved_amount_cents must be positive') })
  }

  refund.status = 'succeeded'
  refund.approved_amount_cents = body.approved_amount_cents
  refund.reviewed_by = member.name
  refund.processed_at = utcNow()

  // Audit log entry
  d.auditLog.push({
    id: mockId('au'),
    actor_name: member.name,
    action: 'refund.execute',
    target_type: 'refund',
    target_id: refund.id,
    detail: `Executed refund for #${refund.short_id}: $${(refund.requested_amount_cents / 100).toFixed(2)} approved at $${(body.approved_amount_cents / 100).toFixed(2)}, fee $${(refund.fee_deducted_cents / 100).toFixed(2)}`,
    ip: '10.0.0.5',
    created_at: utcNow(),
  })

  // Push notification
  d.notifications.push({
    id: mockId('ntf'),
    request_id: refund.request_id,
    short_id: refund.short_id,
    template_code: 'N11_refund_executed',
    channel: 'inapp',
    recipient: 'team-inbox',
    rendered_subject: `Refund executed for #${refund.short_id}`,
    status: 'sent',
    error_message: null,
    retry_count: 0,
    is_read: false,
    title: `Refund executed: $${(body.approved_amount_cents / 100).toFixed(2)}`,
    body: `Refund for #${refund.short_id} processed by ${member.name}.`,
    sent_at: utcNow(),
    created_at: utcNow(),
  })

  return envelope(refund)
})
