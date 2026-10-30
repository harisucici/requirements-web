export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  // Audit-only: log the consent categories (no persistence needed in mock)
  const body = await readBody<{ categories: { necessary: boolean; analytics: boolean; marketing: boolean } }>(event)
  return envelope({ saved: true, categories: body.categories })
})
