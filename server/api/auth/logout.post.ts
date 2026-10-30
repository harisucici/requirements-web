export default defineEventHandler(async (event) => {
  await applyLatency()
  clearUserSessionCookie(event)
  return envelope({ status: 'logged_out' })
})
