export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const body = await readBody(event) as { ids: string[] }
  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'ids must be a non-empty array') })
  }

  let marked = 0
  body.ids.forEach((id) => {
    const notif = d.notifications.find(n => n.id === id)
    if (notif && !notif.is_read) {
      notif.is_read = true
      marked++
    }
  })

  const unreadCount = d.notifications.filter(n => !n.is_read).length

  return envelope({ marked, unread_count: unreadCount })
})
