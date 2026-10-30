export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireRole(event, d, ['admin'])
  await applyLatency()
  checkFault(event)

  // Refresh active task counts
  d.teamMembers.forEach((m) => {
    m.active_task_count = d.requests.filter(r =>
      r.assignee_id === m.id && ['paid', 'in_progress'].includes(r.status),
    ).length
  })

  return envelope(d.teamMembers)
})
