export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const id = getRouterParam(event, 'id')!
  const fb = d.feedback.find(f => f.id === id)
  if (!fb) {
    throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Feedback not found') })
  }

  const body = await readBody(event) as { reply_text: string }
  if (!body.reply_text?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'reply_text is required') })
  }

  fb.reply = body.reply_text
  fb.handle_status = 'replied'
  fb.replied_by = member.name
  fb.replied_at = utcNow()

  return envelope(fb)
})
