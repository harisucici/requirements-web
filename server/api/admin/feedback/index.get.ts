export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const q = getQuery(event)
  const page = queryInt(event, 'page', 1)
  const pageSize = queryInt(event, 'page_size', 10)
  const rating = q.rating ? Number(q.rating) : null
  const handleStatus = q.handle_status as string | undefined
  const category = q.category as string | undefined
  const sort = (q.sort as string) || 'created'

  const twelveHoursAgo = Date.now() - 12 * 3600_000

  let items = d.feedback.map((fb) => {
    const sla_breached = fb.handle_status === 'new' && new Date(fb.created_at).getTime() < twelveHoursAgo
    return { ...fb, sla_breached }
  })

  // Filters
  if (rating !== null) items = items.filter(f => f.rating === rating)
  if (handleStatus) items = items.filter(f => f.handle_status === handleStatus)
  if (category) items = items.filter(f => f.category === category)

  // Sort
  if (sort === 'sla') {
    items.sort((a, b) => {
      // Breached items first, then by created_at
      if (a.sla_breached && !b.sla_breached) return -1
      if (!a.sla_breached && b.sla_breached) return 1
      return b.created_at.localeCompare(a.created_at)
    })
  }
  else {
    items.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  return envelope(paginate(items, page, pageSize))
})
