export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const shortId = getRouterParam(event, 'id')!
  const r = findByShortId(d, shortId)
  if (!r) {
    throw createError({
      statusCode: 404,
      statusMessage: 'NOT_FOUND',
      data: errorBody('NOT_FOUND', `Request ${shortId} not found`),
    })
  }

  // Developer can only view own assigned
  if (member.role === 'developer' && r.assignee_id !== member.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'FORBIDDEN',
      data: errorBody('FORBIDDEN', 'You can only view requests assigned to you'),
    })
  }

  const user = d.users.find(u => u.id === r.user_id)
  const attachments = d.attachments.filter(a => a.request_id === r.id)
  const assessment = d.assessments.find(a => a.request_id === r.id) ?? null
  const notes = d.internalNotes.filter(n => n.request_id === r.id)
  const clarifications = d.clarifications.filter(c => c.request_id === r.id)
  const payments = d.payments.filter(p => p.request_id === r.id)
  const refunds = d.refunds.filter(rf => rf.request_id === r.id)
  const feedback = d.feedback.filter(f => f.request_id === r.id)
  const modifications = d.modifications.filter(m => m.request_id === r.id)
  const status_history = d.statusHistory
    .filter(h => h.request_id === r.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  const risk_tags = r.risk_tags

  // Similar requests: up to 2 sharing category or keywords from description
  const descWords = r.description.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const similar = d.requests
    .filter(other => other.id !== r.id)
    .map(other => {
      let score = 0
      if (r.category && other.category === r.category) score += 2
      const otherDesc = other.description.toLowerCase()
      descWords.forEach(w => { if (otherDesc.includes(w)) score += 1 })
      return { short_id: other.short_id, description: other.description, status: other.status, score }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)

  // Team members with load info
  const team_members = d.teamMembers
    .filter(m => m.is_active)
    .map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      skill_tags: m.skill_tags,
      active_task_count: m.active_task_count,
      load_threshold: m.load_threshold,
    }))

  return envelope({
    request: r,
    user: user ? { email: user.email, name: user.name, request_count: user.request_count } : null,
    attachments,
    assessment,
    notes,
    clarifications,
    payments,
    refunds,
    feedback,
    modifications,
    status_history,
    risk_tags,
    similar,
    team_members,
  })
})
