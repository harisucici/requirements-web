export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const userId = getUserSessionId(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED', data: errorBody('UNAUTHORIZED', 'Sign in to update your account.') })

  const user = d.users.find(u => u.id === userId) as (typeof d.users[0] & { password?: string }) | undefined
  if (!user) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'User not found.') })

  const body = await readBody<{ email?: string; name?: string; password?: string; marketing_opt_in?: boolean }>(event)
  if (body.email) user.email = body.email
  if (body.name !== undefined) user.name = body.name
  if (body.password) user.password = body.password
  if (body.marketing_opt_in !== undefined) user.marketing_opt_in = body.marketing_opt_in

  return envelope(user)
})
