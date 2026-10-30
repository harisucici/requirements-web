export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const q = getQuery(event)
  const view = (q.view as string) || 'all'
  const statusFilter = q.status as string | undefined
  const keyword = (q.q as string || '').toLowerCase()
  const assigneeId = q.assignee_id as string | undefined
  const page = queryInt(event, 'page', 1)
  const pageSize = queryInt(event, 'page_size', 10)

  let items = [...d.requests]

  // Developer role: only own assigned requests
  if (member.role === 'developer') {
    items = items.filter(r => r.assignee_id === member.id)
  }

  // View filters
  switch (view) {
    case 'pending':
      items = items.filter(r => r.status === 'pending')
      break
    case 'in_progress':
      items = items.filter(r => ['paid', 'in_progress'].includes(r.status))
      break
    case 'completed':
      items = items.filter(r => ['completed', 'rejected', 'canceled'].includes(r.status))
      break
    case 'by_assignee':
      if (assigneeId) items = items.filter(r => r.assignee_id === assigneeId)
      break
    case 'by_due':
      items = items.filter(r => r.due_at != null)
      break
  }

  // Status filter
  if (statusFilter) {
    items = items.filter(r => r.status === statusFilter)
  }

  // Keyword search on description, short_id, email
  if (keyword) {
    items = items.filter(r =>
      r.description.toLowerCase().includes(keyword) ||
      r.short_id.toLowerCase().includes(keyword) ||
      r.user_email.toLowerCase().includes(keyword)
    )
  }

  // Sorting
  if (view === 'by_due') {
    // due_at asc, nulls last
    items.sort((a, b) => {
      if (!a.due_at && !b.due_at) return 0
      if (!a.due_at) return 1
      if (!b.due_at) return -1
      return a.due_at.localeCompare(b.due_at)
    })
  } else if (view === 'pending') {
    // submitted_at asc
    items.sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))
  } else {
    // paid first, then due soon, then price desc
    items.sort((a, b) => {
      const aPaid = a.status === 'paid' ? 0 : 1
      const bPaid = b.status === 'paid' ? 0 : 1
      if (aPaid !== bPaid) return aPaid - bPaid

      const aDue = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER
      const bDue = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER
      if (aDue !== bDue) return aDue - bDue

      const aPrice = a.quoted_price_cents ?? 0
      const bPrice = b.quoted_price_cents ?? 0
      return bPrice - aPrice
    })
  }

  return envelope(paginate(items, page, pageSize))
})
