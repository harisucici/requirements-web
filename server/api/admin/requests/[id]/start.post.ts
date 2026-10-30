export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireRole(event, d, ['admin', 'developer'])
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

  transition(d, r, 'in_progress', { type: 'team', name: member.name })

  return envelope(r)
})
