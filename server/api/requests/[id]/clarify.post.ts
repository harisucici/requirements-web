export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const token = getRouterParam(event, 'id') ?? ''
  const request = findByToken(d, token)
  if (!request) throw createError({ statusCode: 404, statusMessage: 'TOKEN_NOT_FOUND', data: errorBody('TOKEN_NOT_FOUND', 'Request not found.') })

  const body = await readBody<{ answers: { no: number; text: string }[] }>(event)
  if (!body.answers?.length) throw createError({ statusCode: 422, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'Please answer all questions.') })

  // Find the active clarification (unanswered)
  const clarification = d.clarifications.find(c => c.request_id === request.id && !c.answers)
  if (!clarification) throw createError({ statusCode: 409, statusMessage: 'INVALID_TRANSITION', data: errorBody('INVALID_TRANSITION', 'No pending clarification for this request.') })

  clarification.answers = body.answers
  clarification.answered_at = utcNow()

  // Transition needs_clarification → pending (re-queue)
  transition(d, request, 'pending', { type: 'user', name: request.user_email }, { reason: 'User answered clarification questions' })

  return envelope({ status: request.status, message: 'Your answers have been submitted. The request is back in the review queue.' })
})
