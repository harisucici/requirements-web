// Mock state machine implementing PRD §7.2 transition table.
// Illegal transitions throw 409 INVALID_TRANSITION (AC-03.8).

import type { RequestStatus } from '../../types/enums'
import type { MockDb } from './mockDb'
import type { Request } from '../../types/api'
import { applyTransition } from './mockDb'
import { errorBody } from './mockHelpers'

/** from → allowed to[] (PRD §7.2). `completed → in_progress` only via accepted modification. */
export const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  pending: ['approved', 'rejected', 'needs_clarification', 'price_adjusted', 'canceled'],
  needs_clarification: ['pending', 'approved', 'rejected', 'canceled'],
  price_adjusted: ['approved', 'canceled'],
  approved: ['paid', 'canceled', 'needs_clarification'],
  paid: ['in_progress', 'canceled'],
  in_progress: ['completed', 'needs_clarification', 'canceled'],
  completed: ['in_progress'],
  rejected: [],
  canceled: [],
}

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function invalidTransitionError(from: RequestStatus, to: RequestStatus) {
  return createError({
    statusCode: 409,
    statusMessage: 'INVALID_TRANSITION',
    data: errorBody(
      'INVALID_TRANSITION',
      `This request has moved on: cannot go from "${from}" to "${to}". The page will refresh with the latest state.`,
      { from, to },
    ),
  })
}

export interface TransitionActor {
  type: 'user' | 'team' | 'system'
  name: string
}

/**
 * Validate + apply a transition, write StatusHistory, and generate mock
 * notifications per PRD §7.3. Returns the mutated request.
 */
export function transition(
  d: MockDb,
  r: Request,
  to: RequestStatus,
  actor: TransitionActor,
  opts: { reason?: string; meta?: Record<string, unknown>; skipNotify?: boolean } = {},
): Request {
  if (!canTransition(r.status, to)) throw invalidTransitionError(r.status, to)
  applyTransition(d, r, to, actor, opts.reason, opts.meta)
  if (!opts.skipNotify) notifyForTransition(d, r, to, actor.name)
  return r
}

/** PRD §7.3: which user email + team notification each transition triggers. */
const TRANSITION_NOTIFY: Partial<Record<RequestStatus, { email: string; team: string; title: (id: string) => string }>> = {
  approved: { email: 'E02_approved', team: 'N02_status_change', title: id => `Request #${id} approved` },
  rejected: { email: 'E03_rejected', team: 'N02_status_change', title: id => `Request #${id} rejected` },
  needs_clarification: { email: 'E04_clarification_needed', team: 'N02_status_change', title: id => `Clarification sent for #${id}` },
  price_adjusted: { email: 'E05_price_adjusted', team: 'N02_status_change', title: id => `Updated pricing for #${id}` },
  paid: { email: 'E07_payment_received', team: 'N03_payment_received', title: id => `Payment received #${id}` },
  in_progress: { email: 'E08_development_started', team: 'N02_status_change', title: id => `Development started #${id}` },
  completed: { email: 'E09_delivered', team: 'N02_status_change', title: id => `Delivered #${id}` },
  canceled: { email: 'E10_cancel_confirmed', team: 'N04_request_canceled', title: id => `Canceled #${id}` },
}

function notifyForTransition(d: MockDb, r: Request, to: RequestStatus, actorName: string) {
  const spec = TRANSITION_NOTIFY[to]
  const now = new Date().toISOString()
  if (!spec) return
  d.notifications.push({
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    request_id: r.id,
    short_id: r.short_id,
    template_code: spec.email,
    channel: 'email',
    recipient: r.user_email,
    rendered_subject: spec.title(r.short_id),
    status: 'sent',
    error_message: null,
    retry_count: 0,
    is_read: false,
    title: spec.title(r.short_id),
    body: `Triggered by ${actorName} at ${now.slice(0, 16).replace('T', ' ')} UTC.`,
    sent_at: now,
    created_at: now,
  })
  d.notifications.push({
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}b`,
    request_id: r.id,
    short_id: r.short_id,
    template_code: spec.team,
    channel: 'inapp',
    recipient: 'team-inbox',
    rendered_subject: spec.title(r.short_id),
    status: 'sent',
    error_message: null,
    retry_count: 0,
    is_read: false,
    title: spec.title(r.short_id),
    body: `Status changed to ${to}.`,
    sent_at: now,
    created_at: now,
  })
}

/** §9.7: suggested price (cents) from estimated hours. Null → refer out / range. */
export function suggestedPriceForHours(hours: number): { price_cents: number | null; range_cents: [number, number] | null; decision: string; delivery_days: number | null } {
  if (hours < 1) return { price_cents: 500, range_cents: null, decision: 'accept', delivery_days: 1 }
  if (hours <= 3) return { price_cents: 1500, range_cents: null, decision: 'accept', delivery_days: 2 }
  if (hours <= 5) return { price_cents: null, range_cents: [2000, 5000], decision: 'accept_with_surcharge', delivery_days: 3 }
  if (hours <= 10) return { price_cents: null, range_cents: [5000, 10000], decision: 'accept_with_surcharge_2_reviewers', delivery_days: 5 }
  return { price_cents: null, range_cents: null, decision: 'reject_refer_out', delivery_days: null }
}

/** §9.8: weighted total + decision hint from 5 dimension scores (1-5). */
export function scoreAssessment(scores: { feasibility: number; time: number; value: number; capability: number; risk: number }) {
  const weighted = Math.round((0.3 * scores.feasibility + 0.25 * scores.time + 0.2 * scores.value + 0.15 * scores.capability + 0.1 * scores.risk) * 100) / 100
  const hint = weighted > 4 ? 'accept' : weighted >= 3 ? 'accept_with_surcharge' : weighted >= 2 ? 'discuss' : 'reject'
  return { weighted_total: weighted, decision_hint: hint as 'accept' | 'accept_with_surcharge' | 'discuss' | 'reject' }
}

/** §9.5: refund calculation for cancel/refund pages. */
export function refundEstimate(r: Request, progressPercent = r.progress_percent) {
  const paid = r.paid_price_cents ?? 0
  const fee = Math.round(paid * 0.029) + 30
  switch (r.status) {
    case 'pending':
    case 'approved':
    case 'price_adjusted':
    case 'needs_clarification':
      return { refundable_cents: 0, fee_cents: 0, requires_review: false, explanation: 'No payment has been made, so there is nothing to refund. Canceling simply closes the request.' }
    case 'paid':
      return { refundable_cents: Math.max(paid - fee, 0), fee_cents: fee, requires_review: false, explanation: 'Development has not started: you receive a full refund minus the payment processing fee (2.9% + $0.30).' }
    case 'in_progress':
      return { refundable_cents: Math.max(Math.round(paid * (1 - progressPercent / 100)) - fee, 0), fee_cents: fee, requires_review: true, explanation: 'Development is under way. The estimated refund is based on remaining work and must be confirmed by our team.' }
    case 'completed':
      return { refundable_cents: 0, fee_cents: 0, requires_review: true, explanation: 'Delivered requests go through our refund review process (7-day no-questions or 30-day quality guarantee).' }
    default:
      return { refundable_cents: 0, fee_cents: 0, requires_review: false, explanation: 'This request is closed.' }
  }
}
