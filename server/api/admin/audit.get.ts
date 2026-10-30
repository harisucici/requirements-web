export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireRole(event, d, ['admin'])
  await applyLatency()
  checkFault(event)

  const page = queryInt(event, 'page', 1)
  const pageSize = queryInt(event, 'page_size', 20)

  // Newest first
  const items = [...d.auditLog].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return envelope(paginate(items, page, pageSize))
})
