export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const page = queryInt(event, 'page', 1)
  const pageSize = queryInt(event, 'page_size', 10)

  const items = [...d.modifications].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return envelope(paginate(items, page, pageSize))
})
