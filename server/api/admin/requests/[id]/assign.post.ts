export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireRole(event, d, ['admin', 'reviewer'])
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

  const body = await readBody<{ assignee_id: string }>(event)
  const assignee = d.teamMembers.find(m => m.id === body.assignee_id)
  if (!assignee) {
    throw createError({
      statusCode: 422,
      statusMessage: 'VALIDATION_ERROR',
      data: errorBody('VALIDATION_ERROR', `Team member ${body.assignee_id} not found`),
    })
  }

  // Update request
  r.assignee_id = assignee.id
  r.assignee_name = assignee.name
  r.updated_at = utcNow()

  // Update member active_task_count
  assignee.active_task_count = d.requests.filter(
    req => req.assignee_id === assignee.id && ['paid', 'in_progress'].includes(req.status)
  ).length

  // Push N05 notification
  d.notifications.push({
    id: mockId('ntf'),
    request_id: r.id,
    short_id: r.short_id,
    template_code: 'N05_assignment',
    channel: 'inapp',
    recipient: assignee.email,
    rendered_subject: `Task assigned: #${r.short_id}`,
    status: 'sent',
    error_message: null,
    retry_count: 0,
    is_read: false,
    title: `Task assigned: #${r.short_id}`,
    body: `#${r.short_id} assigned to ${assignee.name} by ${member.name}.`,
    sent_at: utcNow(),
    created_at: utcNow(),
  })

  return envelope({ request: r, assignee: { id: assignee.id, name: assignee.name, active_task_count: assignee.active_task_count } })
})
