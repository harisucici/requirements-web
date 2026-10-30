export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const body = await readBody<{ email: string; password: string }>(event)

  if (!body.email || !body.password) {
    throw createError({ statusCode: 422, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'Email and password are required.') })
  }

  const user = (d.users as (typeof d.users[0] & { password?: string })[]).find(u => u.email.toLowerCase() === body.email!.toLowerCase())
  if (!user || user.password !== body.password) {
    throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED', data: errorBody('UNAUTHORIZED', 'Invalid email or password. Demo: user@example.com / mock1234') })
  }

  setUserSessionCookie(event, user.id)
  return envelope({ id: user.id, email: user.email, name: user.name, role: user.role, request_count: user.request_count, marketing_opt_in: user.marketing_opt_in, tags: user.tags, last_submitted_at: user.last_submitted_at, created_at: user.created_at })
})
