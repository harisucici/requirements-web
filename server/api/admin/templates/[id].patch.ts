export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const id = getRouterParam(event, 'id')!
  const tpl = d.emailTemplates.find(t => t.id === id)
  if (!tpl) {
    throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Template not found') })
  }

  const body = await readBody(event) as { subject?: string; body_markdown?: string }

  if (body.subject !== undefined) tpl.subject = body.subject
  if (body.body_markdown !== undefined) tpl.body_markdown = body.body_markdown

  tpl.version += 1
  tpl.updated_by = member.name
  tpl.updated_at = utcNow()

  // Audit log
  d.auditLog.push({
    id: mockId('au'),
    actor_name: member.name,
    action: 'template.update',
    target_type: 'email_template',
    target_id: tpl.code,
    detail: `Updated ${tpl.code} (v${tpl.version})`,
    ip: '10.0.0.5',
    created_at: utcNow(),
  })

  return envelope(tpl)
})
