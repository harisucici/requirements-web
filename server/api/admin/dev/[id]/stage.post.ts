export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const id = getRouterParam(event, 'id')!
  const r = findByShortId(d, id)
  if (!r) {
    throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Request not found') })
  }

  const body = await readBody(event) as { stage: 'in_progress' | 'testing' | 'ready' }
  const validStages = ['in_progress', 'testing', 'ready'] as const
  if (!body.stage || !validStages.includes(body.stage)) {
    throw createError({ statusCode: 400, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', `stage must be one of: ${validStages.join(', ')}`) })
  }

  // If moving to in_progress and currently paid → use state machine transition
  if (body.stage === 'in_progress' && r.status === 'paid') {
    transition(d, r, 'in_progress', { type: 'team', name: member.name })
  }
  else {
    // Otherwise just update dev_stage and add a status history note
    r.dev_stage = body.stage
    r.updated_at = utcNow()
    d.statusHistory.push({
      id: mockId('sh'),
      request_id: r.id,
      from_status: r.status,
      to_status: r.status,
      actor_type: 'team',
      actor_name: member.name,
      reason: `Kanban card moved to ${body.stage}`,
      metadata: { dev_stage: body.stage },
      created_at: utcNow(),
    })
  }

  return envelope(r)
})
