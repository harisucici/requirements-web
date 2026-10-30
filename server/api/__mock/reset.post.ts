export default defineEventHandler(async () => {
  resetMockDb()
  return envelope({ reset: true, seeded_requests: useMockDb().requests.length })
})
