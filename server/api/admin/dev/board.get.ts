export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const stages: { stage: 'paid' | 'in_progress' | 'testing' | 'ready'; label: string }[] = [
    { stage: 'paid', label: 'Paid - Awaiting Assignment' },
    { stage: 'in_progress', label: 'In Development' },
    { stage: 'testing', label: 'Testing & QA' },
    { stage: 'ready', label: 'Ready for Delivery' },
  ]

  // Gather requests that belong on the kanban board
  let candidates = d.requests.filter(r =>
    ['paid', 'in_progress', 'completed'].includes(r.status),
  )

  // Developer role → only see own assigned cards
  if (member.role === 'developer') {
    candidates = candidates.filter(r => r.assignee_id === member.id)
  }

  const columns = stages.map(({ stage, label }) => {
    const cards = candidates.filter((r) => {
      // Use dev_stage if present
      if (r.dev_stage) return r.dev_stage === stage
      // Fallback: status=paid → paid column
      if (r.status === 'paid' && stage === 'paid') return true
      // Fallback: status=in_progress and no dev_stage → in_progress column
      if (r.status === 'in_progress' && !r.dev_stage && stage === 'in_progress') return true
      return false
    })
    return { stage, label, cards }
  })

  return envelope({ columns, members: d.teamMembers })
})
