import type { Feedback } from '../../../../types/api'

export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const token = getRouterParam(event, 'id') ?? ''
  const request = findByToken(d, token)
  if (!request) throw createError({ statusCode: 404, statusMessage: 'TOKEN_NOT_FOUND', data: errorBody('TOKEN_NOT_FOUND', 'Request not found.') })

  const existing = d.feedback.find(f => f.request_id === request.id)
  if (existing) throw createError({ statusCode: 409, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'Feedback already submitted for this request. Use PATCH to edit.') })

  const body = await readBody<{ rating: number; comment?: string; nps_score?: number; improvement_suggestion?: string }>(event)
  if (!body.rating || body.rating < 1 || body.rating > 5) {
    throw createError({ statusCode: 422, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'Please choose a rating between 1 and 5.') })
  }

  const now = utcNow()
  const fb: Feedback = {
    id: mockId('fb'),
    request_id: request.id,
    short_id: request.short_id,
    user_email: request.user_email,
    rating: body.rating,
    comment: body.comment ?? null,
    nps_score: body.nps_score ?? null,
    improvement_suggestion: body.improvement_suggestion ?? null,
    category: null,
    priority: body.rating <= 2 ? 'high' : 'medium',
    handle_status: 'new',
    reply: null,
    replied_by: null,
    replied_at: null,
    editable_until: daysFromNow(7),
    created_at: now,
  }
  d.feedback.push(fb)

  // Notification N09
  d.notifications.push({
    id: mockId('ntf'), request_id: request.id, short_id: request.short_id,
    template_code: 'N09_new_feedback', channel: 'inapp', recipient: 'team-inbox',
    rendered_subject: `New ${body.rating}-star feedback for #${request.short_id}`,
    status: 'sent', error_message: null, retry_count: 0, is_read: false,
    title: `New ${body.rating}-star feedback`,
    body: body.comment ? body.comment.slice(0, 100) : 'No comment provided.',
    sent_at: now, created_at: now,
  })

  return envelope(fb)
})
