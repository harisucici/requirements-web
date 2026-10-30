export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const shortId = getRouterParam(event, 'id')!
  const r = findByShortId(d, shortId)
  if (!r) {
    throw createError({
      statusCode: 404,
      statusMessage: 'NOT_FOUND',
      data: errorBody('NOT_FOUND', `Request ${shortId} not found`),
    })
  }

  const body = await readBody<{ new_due_at: string; reason: string }>(event)

  if (!body.new_due_at) {
    throw createError({
      statusCode: 422,
      statusMessage: 'VALIDATION_ERROR',
      data: errorBody('VALIDATION_ERROR', 'new_due_at is required'),
    })
  }
  if (!body.reason || body.reason.trim().length === 0) {
    throw createError({
      statusCode: 422,
      statusMessage: 'VALIDATION_ERROR',
      data: errorBody('VALIDATION_ERROR', 'A reason is required for the delay'),
    })
  }

  r.due_at = body.new_due_at
  r.delay_count += 1
  r.updated_at = utcNow()

  // Push delay notification
  d.notifications.push({
    id: mockId('ntf'),
    request_id: r.id,
    short_id: r.short_id,
    template_code: 'N07_due_warning',
    channel: 'inapp',
    recipient: 'team-inbox',
    rendered_subject: `Delivery delayed: #${r.short_id}`,
    status: 'sent',
    error_message: null,
    retry_count: 0,
    is_read: false,
    title: `Delivery delayed: #${r.short_id}`,
    body: `New due date: ${body.new_due_at.slice(0, 10)}. Reason: ${body.reason}. Delay count: ${r.delay_count}.`,
    sent_at: utcNow(),
    created_at: utcNow(),
  })

  return envelope(r)
})
