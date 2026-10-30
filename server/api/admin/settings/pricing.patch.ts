export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireRole(event, d, ['admin'])
  await applyLatency()
  checkFault(event)

  const body = await readBody(event) as { rules: typeof d.pricingRules }
  if (!body.rules || !Array.isArray(body.rules)) {
    throw createError({ statusCode: 400, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'rules must be an array') })
  }

  // Overwrite pricing rules
  d.pricingRules.length = 0
  body.rules.forEach((rule) => {
    d.pricingRules.push({
      id: rule.id || mockId('pr'),
      min_hours: rule.min_hours,
      max_hours: rule.max_hours ?? null,
      suggested_price_cents: rule.suggested_price_cents ?? null,
      price_range_cents: rule.price_range_cents ?? null,
      standard_delivery_days: rule.standard_delivery_days ?? null,
      decision: rule.decision,
    })
  })

  return envelope(d.pricingRules)
})
