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

  const body = await readBody<{ progress_percent: number }>(event)

  if (typeof body.progress_percent !== 'number' || body.progress_percent < 0 || body.progress_percent > 100) {
    throw createError({
      statusCode: 422,
      statusMessage: 'VALIDATION_ERROR',
      data: errorBody('VALIDATION_ERROR', 'progress_percent must be between 0 and 100'),
    })
  }

  const previous = r.progress_percent
  r.progress_percent = body.progress_percent
  r.updated_at = utcNow()

  // If reaches 50%, push notification
  if (previous < 50 && body.progress_percent >= 50) {
    d.notifications.push({
      id: mockId('ntf'),
      request_id: r.id,
      short_id: r.short_id,
      template_code: 'N07_due_warning',
      channel: 'inapp',
      recipient: 'team-inbox',
      rendered_subject: `Progress milestone: #${r.short_id} at 50%`,
      status: 'sent',
      error_message: null,
      retry_count: 0,
      is_read: false,
      title: `Progress milestone: #${r.short_id} at 50%`,
      body: `${r.description.slice(0, 60)} is now 50% complete (updated by ${member.name}).`,
      sent_at: utcNow(),
      created_at: utcNow(),
    })
  }

  return envelope(r)
})
