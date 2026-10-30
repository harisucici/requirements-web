export default defineEventHandler((event) => {
  clearSessionCookie(event)
  return envelope({ logged_out: true })
})
