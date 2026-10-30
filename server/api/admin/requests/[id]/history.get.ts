export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireAuth(event, d)
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

  const status_history = d.statusHistory
    .filter(h => h.request_id === r.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  const notification_logs = d.notifications
    .filter(n => n.request_id === r.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  return envelope({ status_history, notification_logs })
})
