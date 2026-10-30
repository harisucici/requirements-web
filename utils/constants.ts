// Business constants mirroring PRD chapters 9 (single source for UI copy/logic).

/** §9.6 free revision tiers: <$20 → 1, <$50 → 2, $50+ → 3; extra revision $5. */
export const FREE_REVISION_TIERS = [
  { max_cents: 2000, revisions: 1 },
  { max_cents: 5000, revisions: 2 },
  { max_cents: Infinity, revisions: 3 },
] as const
export const EXTRA_REVISION_FEE_CENTS = 500

/** §9.7 pricing & lead-time table. */
export const PRICING_TABLE = [
  { hours: '< 1h', price: '$5', days: '1 day', decision: 'Accept' },
  { hours: '1-3h', price: '$15', days: '2 days', decision: 'Accept' },
  { hours: '3-5h', price: '$20-50', days: '3 days', decision: 'Accept (surcharge)' },
  { hours: '5-10h', price: '$50-100', days: '5 days', decision: 'Accept (2 reviewers)' },
  { hours: '> 10h', price: '--', days: '--', decision: 'Refer out' },
] as const

export const RUSH_SURCHARGE_RATE = 0.5 // standard price × 50%

/** §9.5 processing fee: round(amount × 2.9%) + $0.30. */
export const FEE_RATE = 0.029
export const FEE_FIXED_CENTS = 30

/** R-1202 launch checklist, 8 items. */
export const LAUNCH_CHECKLIST = [
  { key: 'functional_test', label: 'Functional test passed' },
  { key: 'mobile', label: 'Mobile responsive verified' },
  { key: 'performance', label: 'Loads in < 3s' },
  { key: 'error_handling', label: 'Error handling covered' },
  { key: 'instructions', label: 'Usage instructions written' },
  { key: 'media', label: 'Screenshot or video attached' },
  { key: 'pricing', label: 'Pricing correct' },
  { key: 'category', label: 'Category tag set' },
] as const

/** R-701 cancel reasons (5 options + other). */
export const CANCEL_REASONS = [
  { value: 'no_longer_needed', label: 'I no longer need it' },
  { value: 'found_alternative', label: 'I found an alternative' },
  { value: 'too_expensive', label: 'The price is too high' },
  { value: 'taking_too_long', label: 'It is taking too long' },
  { value: 'submitted_by_mistake', label: 'I submitted it by mistake' },
  { value: 'other', label: 'Other (please explain)' },
] as const

/** §9.8 scoring dimensions with weights. */
export const SCORE_DIMENSIONS = [
  { key: 'feasibility', label: 'Technical feasibility', weight: 0.3 },
  { key: 'time', label: 'Development time', weight: 0.25 },
  { key: 'value', label: 'Business value', weight: 0.2 },
  { key: 'capability', label: 'Team capability', weight: 0.15 },
  { key: 'risk', label: 'Risk', weight: 0.1 },
] as const

export const DECISION_HINT_LABELS: Record<string, string> = {
  accept: 'Recommend accept at standard price',
  accept_with_surcharge: 'Consider accept with surcharge',
  discuss: 'Needs team discussion',
  reject: 'Recommend decline',
}

/** R-107 attachment constraints. */
export const ATTACHMENT_LIMITS = { maxFiles: 3, maxBytes: 5 * 1024 * 1024, accept: ['image/jpeg', 'image/png', 'application/pdf'] }

export const DESCRIPTION_LIMITS = { min: 20, max: 2000 }
export const MODIFICATION_MIN_CHARS = 20

/** SLA constants (Appendix B). */
export const SLA = { first_review_hours: 12, modification_hours: 12, feedback_reply_hours: 12 }
