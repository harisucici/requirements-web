export default defineEventHandler(async (event) => {
  const d = useMockDb()
  const member = requireRole(event, d, ['admin', 'reviewer'])
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
    action: 'accept' | 'reject' | 'clarify' | 'price_adjust'
    quoted_price_cents?: number
    due_at?: string
    reason?: string
    questions?: string[]
  }>(event)

  const warnings: string[] = []

  switch (body.action) {
    case 'accept': {
      if (!body.quoted_price_cents || body.quoted_price_cents <= 0) {
        throw createError({
          statusCode: 422,
          statusMessage: 'VALIDATION_ERROR',
          data: errorBody('VALIDATION_ERROR', 'quoted_price_cents is required for accept'),
        })
      }
      r.quoted_price_cents = body.quoted_price_cents

      // Default due_at from suggested pricing
      if (body.due_at) {
        r.due_at = body.due_at
      } else {
        const hours = r.estimated_hours ?? 2
        const suggestion = suggestedPriceForHours(hours)
        const days = suggestion.delivery_days ?? 3
        r.due_at = daysFromNow(days)
      }

      if (body.quoted_price_cents > 5000) {
        warnings.push('High-value request: consider assigning a second reviewer.')
      }

      transition(d, r, 'approved', { type: 'team', name: member.name })
      break
    }

    case 'reject': {
      if (!body.reason || body.reason.trim().length === 0) {
        throw createError({
          statusCode: 422,
          statusMessage: 'VALIDATION_ERROR',
          data: errorBody('VALIDATION_ERROR', 'A reason is required when rejecting a request'),
        })
      }
      transition(d, r, 'rejected', { type: 'team', name: member.name }, { reason: body.reason })
      break
    }

    case 'clarify': {
      if (!body.questions || body.questions.length === 0) {
        throw createError({
          statusCode: 422,
          statusMessage: 'VALIDATION_ERROR',
          data: errorBody('VALIDATION_ERROR', 'At least one question is required for clarification'),
        })
      }
      const existing = d.clarifications.filter(c => c.request_id === r.id)
      const round = existing.length + 1
      d.clarifications.push({
        id: mockId('cl'),
        request_id: r.id,
        round,
        questions: body.questions.map((text, i) => ({ no: i + 1, text })),
        answers: null,
        asked_at: utcNow(),
        answered_at: null,
      })
      transition(d, r, 'needs_clarification', { type: 'team', name: member.name })
      break
    }

    case 'price_adjust': {
      if (!body.quoted_price_cents || body.quoted_price_cents <= 0) {
        throw createError({
          statusCode: 422,
          statusMessage: 'VALIDATION_ERROR',
          data: errorBody('VALIDATION_ERROR', 'quoted_price_cents is required for price adjustment'),
        })
      }
      if (!body.reason || body.reason.trim().length === 0) {
        throw createError({
          statusCode: 422,
          statusMessage: 'VALIDATION_ERROR',
          data: errorBody('VALIDATION_ERROR', 'A reason is required for price adjustment'),
        })
      }
      r.quoted_price_cents = body.quoted_price_cents
      transition(d, r, 'price_adjusted', { type: 'team', name: member.name }, { reason: body.reason })
      break
    }

    default:
      throw createError({
        statusCode: 422,
        statusMessage: 'VALIDATION_ERROR',
        data: errorBody('VALIDATION_ERROR', `Unknown action: ${body.action}`),
      })
  }

  return envelope({ request: r, warnings })
})
