export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireRole(event, d, ['admin'])
  await applyLatency()
  checkFault(event)

  return envelope(d.pricingRules)
})
