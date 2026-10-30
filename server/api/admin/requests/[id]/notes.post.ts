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

  const body = await readBody<{ content: string; visible_to_user?: boolean }>(event)

  if (!body.content || body.content.trim().length === 0) {
    throw createError({
      statusCode: 422,
      statusMessage: 'VALIDATION_ERROR',
      data: errorBody('VALIDATION_ERROR', 'Note content is required'),
    })
  }

  const note = {
    id: mockId('nt'),
    request_id: r.id,
    author_name: member.name,
    content: body.content,
    visible_to_user: body.visible_to_user ?? false,
    created_at: utcNow(),
  }
  d.internalNotes.push(note)

  return envelope(note)
})
