export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const now = Date.now()
  const in24h = now + 24 * 3600_000
  const ago12h = now - 12 * 3600_000

  // Scope requests for developer role (only see own assigned)
  const scope = member.role === 'developer'
    ? d.requests.filter(r => r.assignee_id === member.id)
    : d.requests

  // --- KPIs ---
  const pending_review = scope.filter(r => r.status === 'pending').length

  const due_today = scope.filter(r =>
    ['paid', 'in_progress'].includes(r.status) &&
    r.due_at && new Date(r.due_at).getTime() <= in24h && new Date(r.due_at).getTime() > now
  ).length

  const overdue = scope.filter(r =>
    ['paid', 'in_progress'].includes(r.status) &&
    r.due_at && new Date(r.due_at).getTime() <= now
  ).length

  const new_feedback = d.feedback.filter(f => f.handle_status === 'new').length

  const unread_notifications = d.notifications.filter(
    n => n.channel === 'inapp' && !n.is_read
  ).length

  // --- Todos ---
  const todos: { id: string; short_id: string; label: string; due_at: string | null; kind: string }[] = []

  // Pending > 12h (review SLA)
  scope.filter(r => r.status === 'pending' && new Date(r.submitted_at).getTime() < ago12h).forEach(r => {
    todos.push({ id: r.id, short_id: r.short_id, label: `Review overdue: #${r.short_id}`, due_at: r.submitted_at, kind: 'review_sla' })
  })

  // Due < 24h
  scope.filter(r =>
    ['paid', 'in_progress'].includes(r.status) &&
    r.due_at && new Date(r.due_at).getTime() <= in24h && new Date(r.due_at).getTime() > now
  ).forEach(r => {
    todos.push({ id: r.id, short_id: r.short_id, label: `Due soon: #${r.short_id}`, due_at: r.due_at, kind: 'due_soon' })
  })

  // Feedback SLA breach (> 12h new)
  d.feedback.filter(f => f.handle_status === 'new' && new Date(f.created_at).getTime() < ago12h).forEach(f => {
    todos.push({ id: f.id, short_id: f.short_id, label: `Feedback SLA: #${f.short_id}`, due_at: f.created_at, kind: 'feedback_sla' })
  })

  // --- Alerts ---
  const alerts: { id: string; level: 'warning' | 'danger' | 'info'; message: string; short_id: string | null }[] = []

  // Overdue deliveries
  scope.filter(r =>
    ['paid', 'in_progress'].includes(r.status) &&
    r.due_at && new Date(r.due_at).getTime() <= now
  ).forEach(r => {
    alerts.push({ id: `alert_overdue_${r.id}`, level: 'danger', message: `Overdue: #${r.short_id} was due ${r.due_at!.slice(0, 10)}`, short_id: r.short_id })
  })

  // Failed notifications
  d.notifications.filter(n => n.status === 'failed').forEach(n => {
    alerts.push({ id: `alert_ntf_${n.id}`, level: 'warning', message: `Notification failed: ${n.title}`, short_id: n.short_id })
  })

  // Member load warnings
  d.teamMembers.filter(m => m.is_active && m.active_task_count > m.load_threshold).forEach(m => {
    alerts.push({ id: `alert_load_${m.id}`, level: 'warning', message: `${m.name} is overloaded (${m.active_task_count}/${m.load_threshold} tasks)`, short_id: null })
  })

  return envelope({
    kpis: { pending_review, due_today, overdue, new_feedback, unread_notifications },
    todos,
    alerts,
  })
})
