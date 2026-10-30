export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireRole(event, d, ['admin'])
  await applyLatency()
  checkFault(event)

  const body = await readBody(event) as { rules?: typeof d.automationRules; pause_all?: boolean }

  // Pause all automation rules
  if (body.pause_all !== undefined) {
    d.automationRules.forEach((rule) => {
      rule.is_enabled = !body.pause_all
    })
  }

  // Update individual rules
  if (body.rules && Array.isArray(body.rules)) {
    body.rules.forEach((incoming) => {
      const existing = d.automationRules.find(r => r.id === incoming.id)
      if (existing) {
        if (incoming.is_enabled !== undefined) existing.is_enabled = incoming.is_enabled
        if (incoming.threshold_days !== undefined) existing.threshold_days = incoming.threshold_days
        if (incoming.threshold_hours !== undefined) existing.threshold_hours = incoming.threshold_hours
      }
    })
  }

  return envelope(d.automationRules)
})
