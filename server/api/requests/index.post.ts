import type { CreateRequestPayload, Request } from '../../../types/api'

export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const body = await readBody<CreateRequestPayload>(event)

  // Field validation (PRD §3.5)
  const errors: string[] = []
  if (!body.description || body.description.trim().length < 20) errors.push('Please describe your tool in at least 20 characters.')
  if (body.description && body.description.length > 2000) errors.push('Description must be 2000 characters or fewer.')
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('Enter a valid email address so we can reach you.')
  if (!body.terms_accepted) errors.push('Please accept the terms to continue.')
  if (errors.length) {
    throw createError({ statusCode: 422, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', errors.join(' ')) })
  }

  // R-1501: same email within 24h → warn with existing request entry (Q7 option C: warn, don't block hard,
  // but PRD P0 keeps the window; payload gives the UI the existing request link).
  const cutoff = Date.now() - 24 * 3600_000
  const recent = d.requests.find(
    r => r.user_email.toLowerCase() === body.email!.toLowerCase()
      && new Date(r.submitted_at).getTime() > cutoff
      && !['canceled', 'rejected'].includes(r.status),
  )
  const force = getQuery(event).force === '1'
  if (recent && !force) {
    const token = tokenFor(d, recent.id)
    throw createError({
      statusCode: 429,
      statusMessage: 'DUPLICATE_WINDOW',
      data: errorBody('DUPLICATE_WINDOW', 'You already submitted a request with this email in the last 24 hours. You can open it below, or submit anyway if this is a different tool.', {
        existing_request: { short_id: recent.short_id, status: recent.status, token },
      }),
    })
  }

  const user = d.users.find(u => u.email.toLowerCase() === body.email!.toLowerCase())
  const now = new Date().toISOString()
  const id = mockId('req')
  const shortId = nextShortId(d)
  const token = randomToken()

  const request: Request = {
    id, short_id: shortId, user_id: user?.id ?? mockId('usr'), user_email: body.email!, user_name: user?.name ?? null,
    description: body.description!.trim(), use_case: body.use_case ?? null, expected_delivery: body.expected_delivery ?? null,
    budget_cents: body.budget_cents ?? null, status: 'pending', substatus: null,
    quoted_price_cents: null, paid_price_cents: null, currency: 'USD', priority_score: null,
    assignee_id: null, assignee_name: null, reviewer_id: null, second_approver_id: null,
    estimated_hours: null, actual_hours: null, progress_percent: 0, dev_stage: null,
    due_at: null, delay_count: 0, free_revisions_total: 1, revisions_used: 0, is_rush: false,
    source: body.source ?? null, category: null, risk_tags: detectRiskTags(body.description!),
    submitted_at: now, first_reviewed_at: null, approved_at: null, paid_at: null, started_at: null,
    delivered_at: null, canceled_at: null, cancel_reason: null, cancel_note: null,
    created_at: now, updated_at: now,
  }
  d.requests.push(request)
  d.tokens.set(token, id)
  d.tokenMeta[token] = { expires_at: null, revoked_at: null, last_accessed_at: now }

  d.statusHistory.push(
    { id: mockId('sh'), request_id: id, from_status: null, to_status: 'pending', actor_type: 'user', actor_name: body.email!, reason: 'Request submitted', metadata: { submitted: true }, created_at: now },
  )

  if (user) { user.request_count += 1; user.last_submitted_at = now }
  else {
    d.users.push({ id: request.user_id, email: body.email!, name: null, role: 'user', request_count: 1, marketing_opt_in: false, tags: [], last_submitted_at: now, created_at: now })
  }

  // N01: team notification (B-01)
  d.notifications.push({
    id: mockId('ntf'), request_id: id, short_id: shortId, template_code: 'N01_new_request', channel: 'inapp',
    recipient: 'team-inbox', rendered_subject: `New request #${shortId}`, status: 'sent', error_message: null,
    retry_count: 0, is_read: false, title: `New request #${shortId}`,
    body: `${request.description.slice(0, 100)}${request.description.length > 100 ? '…' : ''}${request.budget_cents ? ` — budget $${(request.budget_cents / 100).toFixed(0)}` : ''}`,
    sent_at: now, created_at: now,
  })
  // E01 confirmation email log
  d.notifications.push({
    id: mockId('ntf'), request_id: id, short_id: shortId, template_code: 'E01_request_received', channel: 'email',
    recipient: body.email!, rendered_subject: `Your tool request #${shortId} has been received`, status: 'sent',
    error_message: null, retry_count: 0, is_read: true, title: 'Confirmation email sent',
    body: `Delivered to ${body.email} within 1 minute.`, sent_at: now, created_at: now,
  })

  return envelope({ short_id: shortId, token, status: 'pending' })
})

/** R-911 keyword risk tags. */
function detectRiskTags(description: string): string[] {
  const text = description.toLowerCase()
  const tags: string[] = []
  if (/\b(backend|back-end|server|database|db)\b/.test(text)) tags.push('backend')
  if (/\b(login|sign ?in|auth|account system|user accounts)\b/.test(text)) tags.push('auth')
  if (/\b(payment|stripe|paypal|charge)\b/.test(text)) tags.push('payments')
  if (/\b(app|ios|android|mobile app)\b/.test(text)) tags.push('mobile-app')
  if (/\b(api key|paid api)\b/.test(text)) tags.push('paid-api')
  return tags
}
