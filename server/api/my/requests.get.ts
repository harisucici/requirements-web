export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const userId = getUserSessionId(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED', data: errorBody('UNAUTHORIZED', 'Sign in to view your requests.') })

  const user = d.users.find(u => u.id === userId)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'User not found.') })

  const q = getQuery(event)
  const page = queryInt(event, 'page', 1)
  const pageSize = queryInt(event, 'page_size', 10)
  const statusFilter = typeof q.status === 'string' ? q.status : null

  let requests = d.requests.filter(r => r.user_id === userId).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
  if (statusFilter) requests = requests.filter(r => r.status === statusFilter)

  // Attach token for each request
  const items = requests.map(r => ({
    ...r,
    token: tokenFor(d, r.id),
  }))

  return envelope(paginate(items, page, pageSize))
})
