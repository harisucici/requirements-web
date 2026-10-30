import type { ModificationRequest } from '../../../../types/api'

export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const token = getRouterParam(event, 'id') ?? ''
  const request = findByToken(d, token)
  if (!request) throw createError({ statusCode: 404, statusMessage: 'TOKEN_NOT_FOUND', data: errorBody('TOKEN_NOT_FOUND', 'Request not found.') })

  if (request.status !== 'completed') {
    throw createError({ statusCode: 409, statusMessage: 'INVALID_TRANSITION', data: errorBody('INVALID_TRANSITION', 'Modifications can only be requested for completed requests.') })
  }

  const body = await readBody<{ description: string }>(event)
  if (!body.description || body.description.trim().length < 20) {
    throw createError({ statusCode: 422, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'Please describe your modification in at least 20 characters.') })
  }

  const existingMods = d.modifications.filter(m => m.request_id === request.id)
  const seq = existingMods.length + 1
  const remaining = Math.max(request.free_revisions_total - request.revisions_used, 0)
  const isFree = remaining > 0
  const chargeCents = isFree ? 0 : 500

  const mod: ModificationRequest = {
    id: mockId('mod'),
    request_id: request.id,
    short_id: request.short_id,
    seq,
    description: body.description.trim(),
    is_free: isFree,
    charge_cents: chargeCents,
    status: isFree ? 'accepted' : 'pending_payment',
    reject_reason: null,
    sla_due_at: hoursFromNow(12),
    handled_by: null,
    created_at: utcNow(),
    redelivered_at: null,
  }
  d.modifications.push(mod)

  if (isFree) {
    request.revisions_used += 1
  }

  // N10 notification
  d.notifications.push({
    id: mockId('ntf'), request_id: request.id, short_id: request.short_id,
    template_code: 'N10_new_modification', channel: 'inapp', recipient: 'team-inbox',
    rendered_subject: `Modification #${seq} for #${request.short_id}`,
    status: 'sent', error_message: null, retry_count: 0, is_read: false,
    title: `New modification request`, body: `${isFree ? 'Free revision' : '$5 charge'}: ${body.description.slice(0, 80)}…`,
    sent_at: utcNow(), created_at: utcNow(),
  })

  return envelope({
    modification: mod,
    revision_quota: {
      free_revisions_total: request.free_revisions_total,
      revisions_used: request.revisions_used,
      remaining: Math.max(request.free_revisions_total - request.revisions_used, 0),
      extra_revision_fee_cents: 500,
    },
  })
})
