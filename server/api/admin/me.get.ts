export default defineEventHandler((event) => {
  const d = useMockDb()
  const member = requireAuth(event, d)
  const unread = d.notifications.filter(n => n.channel === 'inapp' && !n.is_read).length
  return envelope({ id: member.id, email: member.email, name: member.name, role: member.role, unread_notifications: unread })
})
