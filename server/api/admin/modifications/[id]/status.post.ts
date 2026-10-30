export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const id = getRouterParam(event, 'id')!
  const mod = d.modifications.find(m => m.id === id)
  if (!mod) {
    throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Modification not found') })
  }

  const body = await readBody(event) as { status: 'accepted' | 'in_progress' | 'redelivered' | 'rejected'; reject_reason?: string }
  const validStatuses = ['accepted', 'in_progress', 'redelivered', 'rejected'] as const
  if (!body.status || !validStatuses.includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', `status must be one of: ${validStatuses.join(', ')}`) })
  }

  if (body.status === 'rejected' && !body.reject_reason?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'reject_reason is required when rejecting') })
  }

  const parentReq = d.requests.find(r => r.id === mod.request_id)

  mod.status = body.status
  mod.handled_by = member.name

  if (body.status === 'accepted' && parentReq && parentReq.status === 'completed') {
    // accepted: transition completed → in_progress on parent request
    transition(d, parentReq, 'in_progress', { type: 'team', name: member.name }, { reason: `Modification #${mod.seq} accepted` })
  }

  if (body.status === 'redelivered') {
    mod.redelivered_at = utcNow()

    // Bump deliverable version
    const deliverable = d.deliverables.find(dl => dl.request_id === mod.request_id)
    if (deliverable) {
      deliverable.version += 1
      deliverable.delivered_at = utcNow()
      deliverable.delivered_by = member.name
    }

    // Transition parent in_progress → completed
    if (parentReq && parentReq.status === 'in_progress') {
      transition(d, parentReq, 'completed', { type: 'team', name: member.name }, { reason: `Modification #${mod.seq} redelivered` })
    }

    // Push notification
    d.notifications.push({
      id: mockId('ntf'),
      request_id: mod.request_id,
      short_id: mod.short_id,
      template_code: 'N10_modification_redelivered',
      channel: 'inapp',
      recipient: 'team-inbox',
      rendered_subject: `Modification redelivered for #${mod.short_id}`,
      status: 'sent',
      error_message: null,
      retry_count: 0,
      is_read: false,
      title: `Modification #${mod.seq} redelivered`,
      body: `${mod.description} — version ${deliverable?.version ?? '?'} delivered by ${member.name}.`,
      sent_at: utcNow(),
      created_at: utcNow(),
    })
  }

  if (body.status === 'rejected') {
    mod.reject_reason = body.reject_reason!
  }

  return envelope(mod)
})
