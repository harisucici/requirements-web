export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const token = getRouterParam(event, 'id') ?? ''
  const request = findByToken(d, token)
  if (!request) throw createError({ statusCode: 404, statusMessage: 'TOKEN_NOT_FOUND', data: errorBody('TOKEN_NOT_FOUND', 'Request not found.') })

  const estimate = refundEstimate(request)
  return envelope({
    status: request.status,
    refundable_cents: estimate.refundable_cents,
    fee_cents: estimate.fee_cents,
    requires_review: estimate.requires_review,
    explanation: estimate.explanation,
  })
})
