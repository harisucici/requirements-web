export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const body = await readBody<{ email?: string; password?: string }>(event)
  const member = d.teamMembers.find(m => m.email.toLowerCase() === (body.email ?? '').toLowerCase() && m.password === body.password)
  if (!member) {
    throw createError({
      statusCode: 401,
      statusMessage: 'UNAUTHORIZED',
      data: errorBody('UNAUTHORIZED', 'Incorrect email or password. After 5 failed attempts the account locks for 15 minutes.'),
    })
  }
  setSessionCookie(event, member.id)
  return envelope({ id: member.id, email: member.email, name: member.name, role: member.role })
})
