export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const userId = getUserSessionId(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED', data: errorBody('UNAUTHORIZED', 'Sign in to view your account.') })

  const user = d.users.find(u => u.id === userId)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'User not found.') })

  return envelope(user)
})
