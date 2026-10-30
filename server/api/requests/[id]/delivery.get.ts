export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const token = getRouterParam(event, 'id') ?? ''
  const request = findByToken(d, token)
  if (!request) throw createError({ statusCode: 404, statusMessage: 'TOKEN_NOT_FOUND', data: errorBody('TOKEN_NOT_FOUND', 'Request not found.') })

  const deliverable = d.deliverables.find(dl => dl.request_id === request.id) ?? null
  const fb = d.feedback.find(f => f.request_id === request.id) ?? null
  const remaining = Math.max(request.free_revisions_total - request.revisions_used, 0)

  return envelope({
    deliverable,
    feedback: fb,
    revision_quota: {
      free_revisions_total: request.free_revisions_total,
      revisions_used: request.revisions_used,
      remaining,
      extra_revision_fee_cents: 500,
    },
  })
})
