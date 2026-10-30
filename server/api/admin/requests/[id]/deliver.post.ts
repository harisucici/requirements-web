export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireRole(event, d, ['admin', 'developer'])
  await applyLatency()
  checkFault(event)

  const shortId = getRouterParam(event, 'id')!
  const r = findByShortId(d, shortId)
  if (!r) {
    throw createError({
      statusCode: 404,
      statusMessage: 'NOT_FOUND',
      data: errorBody('NOT_FOUND', `Request ${shortId} not found`),
    })
  }

  const body = await readBody<{
    tool_url: string
    title: string
    preview_images: string[]
    quick_start_steps: string[]
    checklist: { key: string; checked: boolean }[]
  }>(event)

  // Idempotent: if deliverable already exists and status is completed, return existing
  const existing = d.deliverables.find(dlv => dlv.request_id === r.id)
  if (existing && r.status === 'completed') {
    return envelope({ deliverable: existing, request: r, already_delivered: true })
  }

  // Gate: required fields
  const missingFields: string[] = []
  if (!body.tool_url || body.tool_url.trim().length === 0) missingFields.push('tool_url')
  if (!body.title || body.title.trim().length === 0) missingFields.push('title')
  if (!body.preview_images || body.preview_images.length < 1) missingFields.push('preview_images (at least 1 required)')
  if (!body.quick_start_steps || body.quick_start_steps.length < 3 || body.quick_start_steps.length > 5) {
    missingFields.push('quick_start_steps (3-5 required)')
  }
  if (missingFields.length > 0) {
    throw createError({
      statusCode: 422,
      statusMessage: 'DELIVERY_FIELDS_MISSING',
      data: errorBody('DELIVERY_FIELDS_MISSING', `Missing required delivery fields: ${missingFields.join(', ')}`, { missing: missingFields }),
    })
  }

  // Gate: all checklist items must be checked
  if (body.checklist && body.checklist.length > 0) {
    const unchecked = body.checklist.filter(item => !item.checked)
    if (unchecked.length > 0) {
      throw createError({
        statusCode: 422,
        statusMessage: 'CHECKLIST_INCOMPLETE',
        data: errorBody('CHECKLIST_INCOMPLETE', 'All checklist items must be checked before delivery', {
          unchecked_keys: unchecked.map(item => item.key),
        }),
      })
    }
  }

  const now = utcNow()

  // Build checklist items
  const checklistItems = (body.checklist ?? []).map(item => ({
    key: item.key,
    label: item.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    checked: true,
    checked_by: member.name,
    checked_at: now,
  }))

  // Create or update deliverable
  let deliverable = existing
  if (deliverable) {
    deliverable.tool_url = body.tool_url
    deliverable.title = body.title
    deliverable.preview_images = body.preview_images
    deliverable.quick_start_steps = body.quick_start_steps
    deliverable.checklist = checklistItems
    deliverable.version += 1
    deliverable.delivered_by = member.name
    deliverable.delivered_at = now
  } else {
    deliverable = {
      id: mockId('dlv'),
      request_id: r.id,
      tool_url: body.tool_url,
      title: body.title,
      preview_images: body.preview_images,
      quick_start_steps: body.quick_start_steps,
      doc_url: null,
      video_url: null,
      checklist: checklistItems,
      version: 1,
      delivered_by: member.name,
      delivered_at: now,
    }
    d.deliverables.push(deliverable)
  }

  // Transition in_progress → completed
  transition(d, r, 'completed', { type: 'team', name: member.name })

  // Push E09 notification
  d.notifications.push({
    id: mockId('ntf'),
    request_id: r.id,
    short_id: r.short_id,
    template_code: 'E09_delivered',
    channel: 'email',
    recipient: r.user_email,
    rendered_subject: `Your tool is ready! #${r.short_id}`,
    status: 'sent',
    error_message: null,
    retry_count: 0,
    is_read: false,
    title: `Your tool is ready! #${r.short_id}`,
    body: `"${body.title}" has been delivered. Open it at ${body.tool_url}`,
    sent_at: now,
    created_at: now,
  })

  return envelope({ deliverable, request: r })
})
