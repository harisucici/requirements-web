export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const token = getRouterParam(event, 'id') ?? ''
  const request = findByToken(d, token)
  if (!request) throw createError({ statusCode: 404, statusMessage: 'TOKEN_NOT_FOUND', data: errorBody('TOKEN_NOT_FOUND', 'Request not found.') })

  const body = await readBody<{ decision: 'accept' | 'reject' }>(event)

  if (request.status === 'approved' && request.substatus === 'awaiting_price_confirmation') {
    if (body.decision === 'accept') {
      request.substatus = null
      return envelope({ status: 'approved', message: 'You accepted the updated pricing. Payment is now available.' })
    } else {
      transition(d, request, 'canceled', { type: 'user', name: request.user_email }, { reason: 'Rejected updated pricing' })
      return envelope({ status: 'canceled', message: 'You declined the updated pricing. The request has been closed.' })
    }
  }

  if (request.status === 'price_adjusted') {
    if (body.decision === 'accept') {
      transition(d, request, 'approved', { type: 'user', name: request.user_email }, { reason: 'Accepted updated pricing' })
      return envelope({ status: 'approved', message: 'You accepted the updated pricing.' })
    } else {
      transition(d, request, 'canceled', { type: 'user', name: request.user_email }, { reason: 'Rejected updated pricing' })
      return envelope({ status: 'canceled', message: 'You declined the updated pricing.' })
    }
  }

  throw createError({ statusCode: 409, statusMessage: 'INVALID_TRANSITION', data: errorBody('INVALID_TRANSITION', 'No price decision is pending for this request.') })
})
