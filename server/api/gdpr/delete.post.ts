export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const userId = getUserSessionId(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED', data: errorBody('UNAUTHORIZED', 'Sign in to request data deletion.') })

  const user = d.users.find(u => u.id === userId)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'User not found.') })

  // Mock: log the deletion request in audit
  d.auditLog.push({
    id: mockId('au'), actor_name: user.email, action: 'user.delete_request',
    target_type: 'user', target_id: userId, detail: 'GDPR deletion requested', ip: null, created_at: utcNow(),
  })

  clearUserSessionCookie(event)

  return envelope({ status: 'accepted', message: 'Your deletion request has been received. It will be executed within 30 days.' })
})
