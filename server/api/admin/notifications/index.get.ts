export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const q = getQuery(event)
  const page = queryInt(event, 'page', 1)
  const pageSize = queryInt(event, 'page_size', 10)
  const status = q.status as string | undefined
  const channel = q.channel as string | undefined
  const unreadOnly = q.unread_only === 'true' || q.unread_only === '1'

  let items = [...d.notifications]

  if (status) items = items.filter(n => n.status === status)
  if (channel) items = items.filter(n => n.channel === channel)
  if (unreadOnly) items = items.filter(n => !n.is_read)

  items.sort((a, b) => b.created_at.localeCompare(a.created_at))

  const unreadCount = d.notifications.filter(n => !n.is_read).length

  return envelope({ ...paginate(items, page, pageSize), unread_count: unreadCount })
})
