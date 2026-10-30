export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const userId = getUserSessionId(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED', data: errorBody('UNAUTHORIZED', 'Sign in to export your data.') })

  const user = d.users.find(u => u.id === userId)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'User not found.') })

  // In mock mode, just acknowledge the request
  return envelope({ status: 'queued', message: 'Your data export has been queued. You will receive an email with a download link shortly.' })
})
