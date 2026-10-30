export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireRole(event, d, ['admin', 'reviewer'])
  await applyLatency()
  checkFault(event)

  const shortId = getRouterParam(event, 'id')!
  const r = findByShortId(d, shortId)
  if (!r) {
    throw createError({
      statusCode: 404,
      statusMessage: 'NOT_FOUND',
      data: errorBody('NOT_FOUND', `Request ${shortId} not found`),
    })
  }

  const body = await readBody<{
    score_feasibility: number
    score_time: number
    score_value: number
    score_capability: number
    score_risk: number
    complexity_stars: number
    estimated_hours?: number
  }>(event)

  const scores = {
    feasibility: body.score_feasibility,
    time: body.score_time,
    value: body.score_value,
    capability: body.score_capability,
    risk: body.score_risk,
  }
  const result = scoreAssessment(scores)

  const estimatedHours = body.estimated_hours ?? null
  const suggestion = estimatedHours ? suggestedPriceForHours(estimatedHours) : null
  const suggestedPriceCents = suggestion?.price_cents ?? null

  // Upsert: find existing or create new
  let assessment = d.assessments.find(a => a.request_id === r.id)
  if (assessment) {
    assessment.score_feasibility = body.score_feasibility
    assessment.score_time = body.score_time
    assessment.score_value = body.score_value
    assessment.score_capability = body.score_capability
    assessment.score_risk = body.score_risk
    assessment.complexity_stars = body.complexity_stars
    assessment.weighted_total = result.weighted_total
    assessment.decision_hint = result.decision_hint
    assessment.estimated_hours = estimatedHours
    assessment.suggested_price_cents = suggestedPriceCents
    assessment.assessed_by = member.name
    assessment.updated_at = utcNow()
  } else {
    assessment = {
      id: mockId('as'),
      request_id: r.id,
      complexity_stars: body.complexity_stars,
      score_feasibility: body.score_feasibility,
      score_time: body.score_time,
      score_value: body.score_value,
      score_capability: body.score_capability,
      score_risk: body.score_risk,
      weighted_total: result.weighted_total,
      decision_hint: result.decision_hint,
      needs_backend: r.risk_tags.includes('backend'),
      needs_paid_api: false,
      estimated_hours: estimatedHours,
      suggested_price_cents: suggestedPriceCents,
      assessed_by: member.name,
      updated_at: utcNow(),
    }
    d.assessments.push(assessment)
  }

  return envelope(assessment)
})
