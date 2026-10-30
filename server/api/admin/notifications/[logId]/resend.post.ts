export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const logId = getRouterParam(event, 'logId')!
  const notif = d.notifications.find(n => n.id === logId)
  if (!notif) {
    throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Notification not found') })
  }

  if (notif.status !== 'failed') {
    throw createError({ statusCode: 400, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'Only failed notifications can be resent') })
  }

  // Reset status and retry
  notif.status = 'sent'
  notif.error_message = null
  notif.retry_count += 1
  notif.sent_at = utcNow()

  return envelope(notif)
})
