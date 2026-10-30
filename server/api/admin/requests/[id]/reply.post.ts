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

  const body = await readBody<{ template_code: string; variables: Record<string, string> }>(event)
  const template = d.emailTemplates.find(t => t.code === body.template_code)
  if (!template) {
    throw createError({
      statusCode: 422,
      statusMessage: 'VALIDATION_ERROR',
      data: errorBody('VALIDATION_ERROR', `Template ${body.template_code} not found`),
    })
  }

  // Replace all {var} in template body
  let rendered = template.body_markdown
  const vars = body.variables ?? {}
  for (const [key, value] of Object.entries(vars)) {
    rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }

  // Check for unreplaced variables
  const remaining = rendered.match(/\{(\w+)\}/g)
  if (remaining) {
    const missingVars = remaining.map(v => v.replace(/[{}]/g, ''))
    throw createError({
      statusCode: 422,
      statusMessage: 'VARIABLE_NOT_REPLACED',
      data: errorBody('VARIABLE_NOT_REPLACED', `Missing template variables: ${missingVars.join(', ')}`, { missing: missingVars }),
    })
  }

  // Push NotificationLog
  const notification = {
    id: mockId('ntf'),
    request_id: r.id,
    short_id: r.short_id,
    template_code: template.code,
    channel: template.channel,
    recipient: r.user_email,
    rendered_subject: template.subject,
    status: 'sent' as const,
    error_message: null,
    retry_count: 0,
    is_read: false,
    title: `Reply sent: ${template.subject}`,
    body: rendered.slice(0, 200),
    sent_at: utcNow(),
    created_at: utcNow(),
  }
  d.notifications.push(notification)

  return envelope({ notification, rendered_body: rendered })
})
