export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const actor = requireRole(event, d, ['admin'])
  await applyLatency()
  checkFault(event)

  const id = getRouterParam(event, 'id')!
  const member = d.teamMembers.find(m => m.id === id)
  if (!member) {
    throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Member not found') })
  }

  const body = await readBody(event) as { role?: string; skill_tags?: string[]; load_threshold?: number; is_active?: boolean }

  const changes: string[] = []

  if (body.role !== undefined) {
    const validRoles = ['reviewer', 'developer', 'admin']
    if (!validRoles.includes(body.role)) {
      throw createError({ statusCode: 400, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', `role must be one of: ${validRoles.join(', ')}`) })
    }
    const oldRole = member.role
    member.role = body.role as import('~~/types/enums').UserRole
    changes.push(`role: ${oldRole} → ${body.role}`)
  }

  if (body.skill_tags !== undefined) {
    member.skill_tags = body.skill_tags
    changes.push(`skill_tags updated`)
  }

  if (body.load_threshold !== undefined) {
    member.load_threshold = body.load_threshold
    changes.push(`load_threshold → ${body.load_threshold}`)
  }

  if (body.is_active !== undefined) {
    member.is_active = body.is_active
    changes.push(`is_active → ${body.is_active}`)
  }

  // Audit log
  if (changes.length > 0) {
    d.auditLog.push({
      id: mockId('au'),
      actor_name: actor.name,
      action: 'member.update',
      target_type: 'team_member',
      target_id: member.id,
      detail: `Updated ${member.name}: ${changes.join(', ')}`,
      ip: '10.0.0.5',
      created_at: utcNow(),
    })
  }

  return envelope(member)
})
