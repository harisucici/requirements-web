export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const token = getRouterParam(event, 'id') ?? ''
  const request = findByToken(d, token)
  if (!request) throw createError({ statusCode: 404, statusMessage: 'TOKEN_NOT_FOUND', data: errorBody('TOKEN_NOT_FOUND', 'Request not found.') })

  const fb = d.feedback.find(f => f.request_id === request.id)
  if (!fb) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'No feedback found for this request.') })

  if (new Date(fb.editable_until) < new Date()) {
    throw createError({ statusCode: 409, statusMessage: 'INVALID_TRANSITION', data: errorBody('INVALID_TRANSITION', 'The feedback editing window has expired.') })
  }

  const body = await readBody<{ rating?: number; comment?: string; nps_score?: number; improvement_suggestion?: string }>(event)
  if (body.rating !== undefined) fb.rating = body.rating
  if (body.comment !== undefined) fb.comment = body.comment
  if (body.nps_score !== undefined) fb.nps_score = body.nps_score
  if (body.improvement_suggestion !== undefined) fb.improvement_suggestion = body.improvement_suggestion
  fb.priority = fb.rating <= 2 ? 'high' : 'medium'

  return envelope(fb)
})
