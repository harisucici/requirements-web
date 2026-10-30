// In-memory mock database (dev plan §3.2). Pages never import this — only Nitro API routes do.
// All timestamps UTC ISO8601, all money integer cents, all keys snake_case on the wire.

import type {
  Assessment,
  Attachment,
  AuditLogEntry,
  AutomationRule,
  ChecklistItem,
  Clarification,
  Coupon,
  Deliverable,
  EmailTemplate,
  Feedback,
  InternalNote,
  ModificationRequest,
  NotificationLog,
  Payment,
  PricingRule,
  Refund,
  Request,
  StatusHistoryEntry,
  TeamMember,
  ToolTemplate,
  TrackedRequest,
  TrackAction,
  User,
} from '../../types/api'
import type { RequestStatus } from '../../types/enums'
import { freeRevisionTiers, mockId, randomToken, refundFee } from './mockHelpers'

const HOUR = 3600_000
const DAY = 24 * HOUR
const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

// ---------- Status metadata (PRD §7.1) ----------

export const STATUS_META: Record<RequestStatus, { label: string; color: string }> = {
  pending: { label: 'Under Review', color: '#6B7280' },
  approved: { label: 'Approved - Awaiting Payment', color: '#2563EB' },
  rejected: { label: 'Not Accepted', color: '#DC2626' },
  needs_clarification: { label: 'Needs Your Input', color: '#D97706' },
  paid: { label: 'Payment Received', color: '#059669' },
  in_progress: { label: 'In Development', color: '#EA580C' },
  completed: { label: 'Completed', color: '#047857' },
  canceled: { label: 'Canceled', color: '#9CA3AF' },
  price_adjusted: { label: 'Updated Pricing - Awaiting Your Approval', color: '#7C3AED' },
}

/** The 6 main user-facing timeline nodes (R-303). */
const MAIN_NODES: RequestStatus[] = ['pending', 'approved', 'paid', 'in_progress', 'completed']

// ---------- Store ----------

export interface MockDb {
  users: User[]
  teamMembers: (TeamMember & { password: string })[]
  requests: Request[]
  tokens: Map<string, string> // token -> requestId
  tokenMeta: Record<string, { expires_at: string | null; revoked_at: string | null; last_accessed_at: string | null }>
  attachments: Attachment[]
  assessments: Assessment[]
  statusHistory: StatusHistoryEntry[]
  payments: Payment[]
  refunds: Refund[]
  clarifications: Clarification[]
  deliverables: Deliverable[]
  feedback: Feedback[]
  modifications: ModificationRequest[]
  internalNotes: InternalNote[]
  notifications: NotificationLog[]
  emailTemplates: EmailTemplate[]
  pricingRules: PricingRule[]
  automationRules: AutomationRule[]
  auditLog: AuditLogEntry[]
  toolTemplates: ToolTemplate[]
  coupons: Coupon[]
  shortIdSeq: number
}

let db: MockDb = emptyDb()

function emptyDb(): MockDb {
  return {
    users: [],
    teamMembers: [],
    requests: [],
    tokens: new Map(),
    tokenMeta: {},
    attachments: [],
    assessments: [],
    statusHistory: [],
    payments: [],
    refunds: [],
    clarifications: [],
    deliverables: [],
    feedback: [],
    modifications: [],
    internalNotes: [],
    notifications: [],
    emailTemplates: [],
    pricingRules: [],
    automationRules: [],
    auditLog: [],
    toolTemplates: [],
    coupons: [],
    shortIdSeq: 0,
  }
}

export function useMockDb(): MockDb {
  if (db.requests.length === 0) seed()
  return db
}

export function resetMockDb() {
  db = emptyDb()
  seed()
  return db
}

// ---------- Seed helpers ----------

export function nextShortId(d: MockDb): string {
  d.shortIdSeq += 1
  return `REQ-2026-${String(d.shortIdSeq).padStart(4, '0')}`
}

interface SeedSpec {
  description: string
  useCase?: string
  email: string
  name?: string
  budgetCents?: number
  expectedDelivery?: '2_days' | '1_week' | '2_weeks'
  source?: string
  category?: string
  riskTags?: string[]
  isRush?: boolean
  submittedDaysAgo: number
  /** status path with hour offsets relative to submission */
  path: { status: RequestStatus; hoursAfterSubmit: number; actor?: 'user' | 'team' | 'system'; actorName?: string; reason?: string; substatus?: string }[]
  quotedPriceCents?: number
  paidPriceCents?: number
  estimatedHours?: number
  progressPercent?: number
  devStage?: Request['dev_stage']
  dueInDays?: number | null
  delayCount?: number
  assigneeId?: string
  reviewerId?: string
  revisionsUsed?: number
  cancelReason?: string
  cancelNote?: string
}

function seedRequest(d: MockDb, spec: SeedSpec): Request {
  const user = upsertUser(d, spec.email, spec.name ?? null)
  const submittedAt = Date.now() - spec.submittedDaysAgo * DAY
  const id = mockId('req')
  const shortId = nextShortId(d)
  const last = spec.path[spec.path.length - 1]!
  const status = last.status

  const req: Request = {
    id,
    short_id: shortId,
    user_id: user.id,
    user_email: user.email,
    user_name: user.name,
    description: spec.description,
    use_case: spec.useCase ?? null,
    expected_delivery: spec.expectedDelivery ?? null,
    budget_cents: spec.budgetCents ?? null,
    status,
    substatus: last.substatus ?? null,
    quoted_price_cents: spec.quotedPriceCents ?? null,
    paid_price_cents: spec.paidPriceCents ?? null,
    currency: 'USD',
    priority_score: null,
    assignee_id: spec.assigneeId ?? null,
    assignee_name: spec.assigneeId ? d.teamMembers.find(m => m.id === spec.assigneeId)?.name ?? null : null,
    reviewer_id: spec.reviewerId ?? null,
    second_approver_id: null,
    estimated_hours: spec.estimatedHours ?? null,
    actual_hours: null,
    progress_percent: spec.progressPercent ?? 0,
    dev_stage: spec.devStage ?? (status === 'paid' ? 'paid' : status === 'in_progress' ? 'in_progress' : null),
    due_at: spec.dueInDays === null ? null : spec.dueInDays !== undefined ? new Date(Date.now() + spec.dueInDays * DAY).toISOString() : null,
    delay_count: spec.delayCount ?? 0,
    free_revisions_total: spec.paidPriceCents ? freeRevisionTiers(spec.paidPriceCents) : 1,
    revisions_used: spec.revisionsUsed ?? 0,
    is_rush: spec.isRush ?? false,
    source: spec.source ?? null,
    category: spec.category ?? null,
    risk_tags: spec.riskTags ?? [],
    submitted_at: new Date(submittedAt).toISOString(),
    first_reviewed_at: null,
    approved_at: null,
    paid_at: null,
    started_at: null,
    delivered_at: null,
    canceled_at: null,
    cancel_reason: spec.cancelReason ?? null,
    cancel_note: spec.cancelNote ?? null,
    created_at: new Date(submittedAt).toISOString(),
    updated_at: new Date(submittedAt + last.hoursAfterSubmit * HOUR).toISOString(),
  }

  // Status history from path
  let prev: RequestStatus | null = null
  spec.path.forEach((step, i) => {
    const ts = new Date(submittedAt + step.hoursAfterSubmit * HOUR).toISOString()
    d.statusHistory.push({
      id: mockId('sh'),
      request_id: id,
      from_status: i === 0 ? null : prev,
      to_status: step.status,
      actor_type: step.actor ?? (i === 0 ? 'user' : 'team'),
      actor_name: step.actorName ?? (i === 0 ? user.email : 'Team'),
      reason: step.reason ?? null,
      metadata: {},
      created_at: ts,
    })
    if (i === 0) {
      // "Submitted" node precedes "Under Review"
      d.statusHistory.push({
        id: mockId('sh'),
        request_id: id,
        from_status: null,
        to_status: step.status,
        actor_type: 'user',
        actor_name: user.email,
        reason: 'Request submitted',
        metadata: { submitted: true },
        created_at: ts,
      })
    }
    if (step.status === 'pending' && i > 0 && !step.reason) {
      // re-queued after clarification
    }
    if (['approved', 'rejected', 'needs_clarification', 'price_adjusted'].includes(step.status) && !req.first_reviewed_at) {
      req.first_reviewed_at = ts
    }
    if (step.status === 'approved') req.approved_at = ts
    if (step.status === 'paid') req.paid_at = ts
    if (step.status === 'in_progress') req.started_at = ts
    if (step.status === 'completed') req.delivered_at = ts
    if (step.status === 'canceled') req.canceled_at = ts
    prev = step.status
  })

  const token = randomToken()
  d.tokens.set(token, id)
  d.tokenMeta[token] = { expires_at: null, revoked_at: null, last_accessed_at: null }

  d.requests.push(req)
  user.request_count = d.requests.filter(r => r.user_id === user.id).length
  return req
}

function upsertUser(d: MockDb, email: string, name: string | null): User {
  let u = d.users.find(x => x.email === email)
  if (!u) {
    u = {
      id: mockId('usr'),
      email,
      name,
      role: 'user',
      request_count: 0,
      marketing_opt_in: false,
      tags: [],
      last_submitted_at: null,
      created_at: utcNowSafe(),
    }
    d.users.push(u)
  }
  return u
}

function utcNowSafe() {
  return new Date().toISOString()
}

// ---------- Seed ----------

function seed() {
  const d = db
  const REVIEWER = { id: 'tm_reviewer', email: 'reviewer@requestroom.com', name: 'Riley Chen', role: 'reviewer' as const, password: 'mock1234', skill_tags: ['triage', 'pricing'], active_task_count: 0, load_threshold: 8, is_active: true }
  const DEVELOPER = { id: 'tm_developer', email: 'developer@requestroom.com', name: 'Devon Park', role: 'developer' as const, password: 'mock1234', skill_tags: ['data-viz', 'text-processing', 'calculators'], active_task_count: 0, load_threshold: 5, is_active: true }
  const DEVELOPER2 = { id: 'tm_developer2', email: 'sam@requestroom.com', name: 'Sam Okafor', role: 'developer' as const, password: 'mock1234', skill_tags: ['converters', 'creative-tools'], active_task_count: 0, load_threshold: 5, is_active: true }
  const ADMIN = { id: 'tm_admin', email: 'admin@requestroom.com', name: 'Alex Morgan', role: 'admin' as const, password: 'mock1234', skill_tags: ['ops'], active_task_count: 0, load_threshold: 10, is_active: true }
  d.teamMembers.push(REVIEWER, DEVELOPER, DEVELOPER2, ADMIN)

  const R = (s: SeedSpec) => seedRequest(d, s)

  // ---- pending (4) ----
  const p1 = R({ description: 'I need a tool that converts CSV files to formatted Excel tables with headers frozen and numbers right-aligned.', useCase: 'Weekly reporting every Monday morning', email: 'mia@example.com', name: 'Mia Torres', budgetCents: 1500, expectedDelivery: '2_days', source: 'landing', category: 'Data conversion', submittedDaysAgo: 0.08, path: [{ status: 'pending', hoursAfterSubmit: 0 }] })
  R({ description: 'Build a JSON formatter and validator that pretty-prints pasted JSON and highlights the exact line of any syntax error.', useCase: 'Debugging APIs at work', email: 'leo@example.com', name: 'Leo Zhang', budgetCents: 1000, submittedDaysAgo: 0.4, path: [{ status: 'pending', hoursAfterSubmit: 0 }], source: '404' })
  R({ description: 'A freelancer rate calculator: I enter my target annual income, vacation weeks and billable ratio, and it outputs my hourly and daily rate.', email: 'sara@example.com', name: 'Sara Kim', budgetCents: 800, expectedDelivery: '1_week', submittedDaysAgo: 1.2, path: [{ status: 'pending', hoursAfterSubmit: 0 }], source: 'tool-page' })
  const p4 = R({ description: 'I want a color palette generator that extracts dominant colors from an uploaded image and exports them as CSS variables.', email: 'mia@example.com', name: 'Mia Torres', budgetCents: 2000, submittedDaysAgo: 2.5, path: [{ status: 'pending', hoursAfterSubmit: 0 }], category: 'Creative tool' })
  d.attachments.push({ id: mockId('att'), request_id: p4.id, file_name: 'palette-inspiration.png', mime_type: 'image/png', size_bytes: 245_000, url: '/mock/previews/palette.png', created_at: p4.submitted_at })

  // ---- approved (3) ----
  const a1 = R({ description: 'Markdown preview editor with live side-by-side rendering, GitHub-flavored tables and a copy-to-HTML button.', email: 'leo@example.com', name: 'Leo Zhang', budgetCents: 1500, submittedDaysAgo: 8, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 6, actorName: 'Riley Chen' }], quotedPriceCents: 1500, estimatedHours: 2, reviewerId: REVIEWER.id })
  a1.approved_at = ago(7.7 * DAY) // near 7-day auto-cancel (A-03 demo)
  R({ description: 'QR code generator with logo upload, foreground/background color pickers and PNG/SVG export.', email: 'sara@example.com', name: 'Sara Kim', budgetCents: 5000, submittedDaysAgo: 1, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 4, actorName: 'Riley Chen' }], quotedPriceCents: 6500, estimatedHours: 4, reviewerId: REVIEWER.id, riskTags: ['canvas-export'] })
  R({ description: 'Base64 encoder/decoder that handles UTF-8 correctly and works fully offline in the browser.', email: 'jon@example.com', name: 'Jon Weber', budgetCents: 500, submittedDaysAgo: 0.5, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 3, actorName: 'Riley Chen', substatus: 'awaiting_price_confirmation', reason: 'Scope larger than described; surcharge applied' }], quotedPriceCents: 1500, estimatedHours: 1, reviewerId: REVIEWER.id })

  // ---- rejected (2) ----
  R({ description: 'Build me a full mobile app with push notifications and user accounts backed by a database.', email: 'tim@example.com', name: 'Tim Holt', budgetCents: 20000, submittedDaysAgo: 5, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'rejected', hoursAfterSubmit: 8, actorName: 'Riley Chen', reason: 'Requires backend, database and user authentication - outside our front-end-only scope. We suggested Fiverr/Upwork for this one.' }], riskTags: ['backend', 'database', 'auth', 'mobile-app'] })
  R({ description: 'A tool that migrates our legacy MySQL database to Postgres automatically.', email: 'ana@example.com', name: 'Ana Silva', budgetCents: 10000, submittedDaysAgo: 9, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'rejected', hoursAfterSubmit: 5, actorName: 'Alex Morgan', reason: 'Needs direct database access and server-side execution, which our delivered tools cannot do.' }], riskTags: ['backend', 'database'] })

  // ---- needs_clarification (3) ----
  const c1 = R({ description: 'I need a data converter but I am not sure yet which formats. Something flexible for tabular data.', email: 'jon@example.com', name: 'Jon Weber', budgetCents: 1200, submittedDaysAgo: 3, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'needs_clarification', hoursAfterSubmit: 7, actorName: 'Riley Chen', reason: 'Formats not specified' }] })
  d.clarifications.push({ id: mockId('cl'), request_id: c1.id, round: 1, questions: [{ no: 1, text: 'Which input formats do you need to convert from (CSV, TSV, JSON, XML)?' }, { no: 2, text: 'Which output formats do you need?' }, { no: 3, text: 'Roughly how large are the files you will convert (rows or MB)?' }], answers: null, asked_at: ago(2.7 * DAY), answered_at: null })
  const c2 = R({ description: 'An API tester where I can save requests and see responses nicely formatted.', email: 'leo@example.com', name: 'Leo Zhang', budgetCents: 3000, submittedDaysAgo: 10, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'needs_clarification', hoursAfterSubmit: 6, actorName: 'Riley Chen' }, { status: 'needs_clarification', hoursAfterSubmit: 120, actorName: 'Riley Chen', reason: 'Second round: CORS constraints' }], riskTags: ['network'] })
  d.clarifications.push({
    id: mockId('cl'), request_id: c2.id, round: 2,
    questions: [{ no: 1, text: 'Will the APIs you test allow browser (CORS) requests, or do they need a proxy?' }, { no: 2, text: 'Do you need authentication headers support (Bearer/Basic)?' }],
    answers: [{ no: 1, text: 'Most allow CORS, a proxy would be nice but not required.' }, { no: 2, text: 'Bearer tokens yes, Basic no.' }],
    asked_at: ago(5 * DAY), answered_at: ago(4 * DAY),
  })
  const c3 = R({ description: 'A log viewer that parses nginx access logs and charts status codes over time.', email: 'ana@example.com', name: 'Ana Silva', budgetCents: 2500, submittedDaysAgo: 16, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'needs_clarification', hoursAfterSubmit: 9, actorName: 'Riley Chen', reason: 'Sample log needed' }] })
  d.clarifications.push({ id: mockId('cl'), request_id: c3.id, round: 1, questions: [{ no: 1, text: 'Can you attach a sanitized sample of your log format?' }], answers: null, asked_at: ago(15.6 * DAY), answered_at: null }) // near 17-day auto-cancel (A-07 demo)

  // ---- price_adjusted (2, P1 status) ----
  R({ description: 'A chart builder that turns a pasted table into bar/line charts with PNG export.', email: 'tim@example.com', name: 'Tim Holt', budgetCents: 2000, submittedDaysAgo: 2, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'price_adjusted', hoursAfterSubmit: 5, actorName: 'Riley Chen', reason: 'Chart rendering + export raises estimate to 5h' }], quotedPriceCents: 5000, estimatedHours: 5 })
  R({ description: 'Form validation snippet generator - I describe rules in plain English and it outputs HTML + JS validation code.', email: 'sara@example.com', name: 'Sara Kim', budgetCents: 1500, submittedDaysAgo: 4, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'price_adjusted', hoursAfterSubmit: 8, actorName: 'Alex Morgan', reason: 'Needs a small rule parser; +$10' }], quotedPriceCents: 2500, estimatedHours: 3 })

  // ---- paid (4) ----
  const pd1 = R({ description: 'Merge multiple CSV files with the same columns into one, with a preview before download.', email: 'user@example.com', name: 'Casey Liu', budgetCents: 1500, submittedDaysAgo: 2, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 5, actorName: 'Riley Chen' }, { status: 'paid', hoursAfterSubmit: 20, actor: 'system', actorName: 'Payment webhook' }], quotedPriceCents: 1500, paidPriceCents: 1500, estimatedHours: 2, assigneeId: DEVELOPER.id, dueInDays: 1 })
  const pd2 = R({ description: 'PDF page splitter: upload a PDF, pick page ranges, download the extracted pages as a new PDF.', email: 'jon@example.com', name: 'Jon Weber', budgetCents: 2000, submittedDaysAgo: 1.5, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 4, actorName: 'Riley Chen' }, { status: 'paid', hoursAfterSubmit: 10, actor: 'system', actorName: 'Payment webhook' }], quotedPriceCents: 2000, paidPriceCents: 2000, estimatedHours: 3, dueInDays: 2 }) // unassigned
  R({ description: 'A regex tester with a library of 30 common patterns, live match highlighting and plain-English explanations.', email: 'leo@example.com', name: 'Leo Zhang', budgetCents: 8000, submittedDaysAgo: 3, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 6, actorName: 'Riley Chen' }, { status: 'paid', hoursAfterSubmit: 30, actor: 'system', actorName: 'Payment webhook' }], quotedPriceCents: 8000, paidPriceCents: 8000, estimatedHours: 6, assigneeId: DEVELOPER2.id, dueInDays: 3 }) // high value
  R({ description: 'Time tracker that exports a weekly timesheet CSV grouped by project and rounded to 15 minutes.', email: 'mia@example.com', name: 'Mia Torres', budgetCents: 1500, submittedDaysAgo: 6, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 5, actorName: 'Riley Chen' }, { status: 'paid', hoursAfterSubmit: 26, actor: 'system', actorName: 'Payment webhook' }], quotedPriceCents: 1500, paidPriceCents: 1500, estimatedHours: 2, assigneeId: DEVELOPER.id, dueInDays: -1 }) // paid 5d ago, overdue start

  // ---- in_progress (4) ----
  const ip1 = R({ description: 'Bookmark manager with tag search and broken-link checking, all stored locally in the browser.', email: 'user@example.com', name: 'Casey Liu', budgetCents: 2000, submittedDaysAgo: 5, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 4, actorName: 'Riley Chen' }, { status: 'paid', hoursAfterSubmit: 24, actor: 'system', actorName: 'Payment webhook' }, { status: 'in_progress', hoursAfterSubmit: 30, actorName: 'Devon Park' }], quotedPriceCents: 2000, paidPriceCents: 2000, estimatedHours: 3, assigneeId: DEVELOPER.id, progressPercent: 80, devStage: 'testing', dueInDays: 0.5 })
  const ip2 = R({ description: 'A font preview tool that renders my typed sample text across all Google Fonts with one-click CSS links.', email: 'sara@example.com', name: 'Sara Kim', budgetCents: 1500, submittedDaysAgo: 4, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 5, actorName: 'Riley Chen' }, { status: 'paid', hoursAfterSubmit: 28, actor: 'system', actorName: 'Payment webhook' }, { status: 'in_progress', hoursAfterSubmit: 40, actorName: 'Devon Park' }], quotedPriceCents: 1500, paidPriceCents: 1500, estimatedHours: 2, assigneeId: DEVELOPER.id, progressPercent: 50, dueInDays: 1 })
  const ip3 = R({ description: 'Image resizer/compressor with drag-and-drop, target-size mode (fit under 200KB) and WebP output.', email: 'tim@example.com', name: 'Tim Holt', budgetCents: 2000, submittedDaysAgo: 9, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 6, actorName: 'Riley Chen' }, { status: 'paid', hoursAfterSubmit: 30, actor: 'system', actorName: 'Payment webhook' }, { status: 'in_progress', hoursAfterSubmit: 50, actorName: 'Sam Okafor' }], quotedPriceCents: 2000, paidPriceCents: 2000, estimatedHours: 3, assigneeId: DEVELOPER2.id, progressPercent: 60, delayCount: 1, dueInDays: 2 })
  const ip4 = R({ description: 'Unit converter for cooking: grams/cups/oz with ingredient-specific density presets.', email: 'ana@example.com', name: 'Ana Silva', budgetCents: 500, submittedDaysAgo: 1.2, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 3, actorName: 'Riley Chen' }, { status: 'paid', hoursAfterSubmit: 8, actor: 'system', actorName: 'Payment webhook' }, { status: 'in_progress', hoursAfterSubmit: 12, actorName: 'Devon Park' }], quotedPriceCents: 500, paidPriceCents: 500, estimatedHours: 0.5, assigneeId: DEVELOPER.id, progressPercent: 10, dueInDays: 1 })

  // ---- completed (3+) ----
  const done1 = R({ description: 'JSON schema validator: paste a schema and a document, get a list of violations with paths.', email: 'user@example.com', name: 'Casey Liu', budgetCents: 2000, submittedDaysAgo: 14, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 5, actorName: 'Riley Chen' }, { status: 'paid', hoursAfterSubmit: 26, actor: 'system', actorName: 'Payment webhook' }, { status: 'in_progress', hoursAfterSubmit: 32, actorName: 'Devon Park' }, { status: 'completed', hoursAfterSubmit: 70, actorName: 'Devon Park' }], quotedPriceCents: 2000, paidPriceCents: 2000, estimatedHours: 3, assigneeId: DEVELOPER.id, progressPercent: 100, devStage: 'ready' })
  const done2 = R({ description: 'Text counter that shows words, characters, sentences and reading time, with keyword density analysis.', email: 'mia@example.com', name: 'Mia Torres', budgetCents: 500, submittedDaysAgo: 20, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 4, actorName: 'Riley Chen' }, { status: 'paid', hoursAfterSubmit: 20, actor: 'system', actorName: 'Payment webhook' }, { status: 'in_progress', hoursAfterSubmit: 26, actorName: 'Sam Okafor' }, { status: 'completed', hoursAfterSubmit: 44, actorName: 'Sam Okafor' }], quotedPriceCents: 500, paidPriceCents: 500, estimatedHours: 1, assigneeId: DEVELOPER2.id, progressPercent: 100, devStage: 'ready', revisionsUsed: 1 })
  const done3 = R({ description: 'Invoice numbering tracker with quarterly VAT-style sequence reminders and CSV export.', email: 'leo@example.com', name: 'Leo Zhang', budgetCents: 5000, submittedDaysAgo: 30, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 6, actorName: 'Riley Chen' }, { status: 'paid', hoursAfterSubmit: 30, actor: 'system', actorName: 'Payment webhook' }, { status: 'in_progress', hoursAfterSubmit: 40, actorName: 'Devon Park' }, { status: 'completed', hoursAfterSubmit: 80, actorName: 'Devon Park' }], quotedPriceCents: 5000, paidPriceCents: 5000, estimatedHours: 4, assigneeId: DEVELOPER.id, progressPercent: 100, devStage: 'ready' })

  // ---- canceled (2) ----
  R({ description: 'A pomodoro timer with task list and daily stats chart.', email: 'jon@example.com', name: 'Jon Weber', budgetCents: 1000, submittedDaysAgo: 12, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'approved', hoursAfterSubmit: 5, actorName: 'Riley Chen' }, { status: 'canceled', hoursAfterSubmit: 173, actor: 'system', actorName: 'System', reason: 'unpaid_timeout' }], quotedPriceCents: 1000 })
  R({ description: 'Meeting cost calculator - enter salaries and headcount and watch the money burn in real time.', email: 'tim@example.com', name: 'Tim Holt', budgetCents: 500, submittedDaysAgo: 7, path: [{ status: 'pending', hoursAfterSubmit: 0 }, { status: 'canceled', hoursAfterSubmit: 20, actor: 'user', actorName: 'tim@example.com', reason: 'found_alternative' }], cancelReason: 'found_alternative', cancelNote: 'Found a free tool that does this already.' })

  // ---- Payments for everything approved→paid and beyond ----
  const payable = d.requests.filter(r => ['paid', 'in_progress', 'completed'].includes(r.status))
  payable.forEach(r => {
    d.payments.push({
      id: mockId('pay'), request_id: r.id, short_id: r.short_id, type: 'main', provider: 'mock',
      provider_session_id: `cs_mock_${r.short_id}`, amount_cents: r.paid_price_cents ?? 0, fee_cents: null,
      discount_cents: 0, coupon_code: null, status: 'succeeded', failure_reason: null,
      paid_at: r.paid_at, created_at: r.paid_at ?? r.submitted_at,
    })
  })
  // one failed payment sample
  d.payments.push({ id: mockId('pay'), request_id: a1.id, short_id: a1.short_id, type: 'main', provider: 'mock', provider_session_id: 'cs_mock_failed_demo', amount_cents: 1500, fee_cents: null, discount_cents: 0, coupon_code: null, status: 'failed', failure_reason: 'Your card was declined by the issuing bank.', paid_at: null, created_at: ago(2 * DAY) })

  // ---- Deliverables + checklist for completed ----
  const checklist = (who: string, when: string): ChecklistItem[] => [
    { key: 'functional_test', label: 'Functional test passed', checked: true, checked_by: who, checked_at: when },
    { key: 'mobile', label: 'Mobile responsive verified', checked: true, checked_by: who, checked_at: when },
    { key: 'performance', label: 'Loads in < 3s', checked: true, checked_by: who, checked_at: when },
    { key: 'error_handling', label: 'Error handling covered', checked: true, checked_by: who, checked_at: when },
    { key: 'instructions', label: 'Usage instructions written', checked: true, checked_by: who, checked_at: when },
    { key: 'media', label: 'Screenshot or video attached', checked: true, checked_by: who, checked_at: when },
    { key: 'pricing', label: 'Pricing correct', checked: true, checked_by: who, checked_at: when },
    { key: 'category', label: 'Category tag set', checked: true, checked_by: who, checked_at: when },
  ]
  const deliverableSpecs: [Request, string, string[], string[]][] = [
    [done1, 'JSON Schema Validator', ['Validate a document against a JSON schema', 'See every violation with its exact path', 'Copy the fixed document or export a report'], ['/mock/previews/json-validator.png']],
    [done2, 'Text Counter Pro', ['Paste or type your text', 'Read words, characters, sentences and reading time', 'Check keyword density before you publish'], ['/mock/previews/text-counter.png']],
    [done3, 'Invoice Sequence Tracker', ['Add each invoice number as you issue it', 'Get reminded before a quarter-end sequence gap', 'Export the full register as CSV'], ['/mock/previews/invoice-tracker.png']],
  ]
  deliverableSpecs.forEach(([r, title, steps, images]) => {
    d.deliverables.push({
      id: mockId('dlv'), request_id: r.id, tool_url: `https://tools.requestroom.dev/${r.short_id.toLowerCase()}`, title,
      preview_images: images, quick_start_steps: steps, doc_url: null, video_url: null,
      checklist: checklist('Devon Park', r.delivered_at ?? utcNowSafe()), version: 1,
      delivered_by: 'Devon Park', delivered_at: r.delivered_at ?? utcNowSafe(),
    })
  })

  // ---- Feedback (8) ----
  const fbSpecs: Array<[Request, number, string | null, number | null, Feedback['category'], Feedback['handle_status'], number]> = [
    [done1, 5, 'Exactly what I needed. The violation paths saved me hours.', 10, null, 'replied', 3],
    [done2, 2, 'Keyword density numbers look wrong for short texts.', 3, 'bug', 'new', 1],
    [done3, 4, 'Great tool, would love a PDF export too.', 8, 'feature_request', 'new', 0.6],
  ]
  fbSpecs.forEach(([r, rating, comment, nps, category, handle, daysAgo]) => {
    d.feedback.push({
      id: mockId('fb'), request_id: r.id, short_id: r.short_id, user_email: r.user_email,
      rating, comment, nps_score: nps, improvement_suggestion: null,
      category, priority: rating <= 2 ? 'high' : 'medium', handle_status: handle,
      reply: handle === 'replied' ? 'Thanks Casey - glad it helps! Noted on the report export.' : null,
      replied_by: handle === 'replied' ? 'Riley Chen' : null, replied_at: handle === 'replied' ? ago(daysAgo * DAY - 6 * HOUR) : null,
      editable_until: new Date(Date.now() + (7 - daysAgo) * DAY).toISOString(),
      created_at: ago(daysAgo * DAY),
    })
  })
  for (let i = 0; i < 5; i++) {
    const r = d.requests.filter(x => x.status === 'completed')[i % 3]!
    d.feedback.push({
      id: mockId('fb'), request_id: r.id, short_id: r.short_id, user_email: r.user_email,
      rating: [3, 4, 5, 1, 4][i]!, comment: ['Good but the UI felt cramped.', 'Nice work!', 'Perfect, shipped fast.', 'Never worked on Safari.', 'Solid.'][i]!,
      nps_score: [6, 9, 10, 1, 8][i]!, improvement_suggestion: i === 3 ? 'Please test on Safari before delivery.' : null,
      category: (['ux', null, null, 'bug', null][i] ?? null) as Feedback['category'], priority: [1, 3, 4, 5][i] === 1 || i === 3 ? 'high' : 'medium',
      handle_status: (['replied', 'resolved', 'new', 'new', 'replied'][i] ?? 'new') as Feedback['handle_status'],
      reply: null, replied_by: null, replied_at: null,
      editable_until: ago((i - 10) * DAY), created_at: ago((10 + i * 3) * DAY),
    })
  }

  // ---- Modifications (4) ----
  d.modifications.push(
    { id: mockId('mod'), request_id: done2.id, short_id: done2.short_id, seq: 1, description: 'Please add a syllable count and support for pasting Markdown without counting syntax characters.', is_free: true, charge_cents: 0, status: 'redelivered', reject_reason: null, sla_due_at: ago(8 * DAY), handled_by: 'Sam Okafor', created_at: ago(9 * DAY), redelivered_at: ago(8 * DAY) },
    { id: mockId('mod'), request_id: done1.id, short_id: done1.short_id, seq: 1, description: 'Add support for draft-07 schemas in addition to 2020-12.', is_free: true, charge_cents: 0, status: 'in_progress', reject_reason: null, sla_due_at: ago(2 * HOUR), handled_by: 'Devon Park', created_at: ago(14 * HOUR), redelivered_at: null },
    { id: mockId('mod'), request_id: done3.id, short_id: done3.short_id, seq: 2, description: 'Second revision: we also need multi-currency support in the register.', is_free: false, charge_cents: 500, status: 'pending_payment', reject_reason: null, sla_due_at: new Date(Date.now() + 10 * HOUR).toISOString(), handled_by: null, created_at: ago(2 * HOUR), redelivered_at: null },
    { id: mockId('mod'), request_id: done3.id, short_id: done3.short_id, seq: 1, description: 'This is actually a request for a whole accounting system with bank feeds.', is_free: false, charge_cents: 0, status: 'rejected', reject_reason: 'Major scope change - please submit this as a new request.', sla_due_at: ago(5 * DAY), handled_by: 'Riley Chen', created_at: ago(6 * DAY), redelivered_at: null },
  )

  // ---- Refunds (3) ----
  const refundable = d.payments.find(p => p.request_id === pd2.id)!
  d.refunds.push(
    { id: mockId('rf'), payment_id: refundable.id, request_id: pd2.id, short_id: pd2.short_id, reason_code: 'no_reason_7d', requested_amount_cents: refundable.amount_cents, approved_amount_cents: null, fee_deducted_cents: refundFee(refundable.amount_cents), original_amount_cents: refundable.amount_cents, status: 'requested', reviewed_by: null, note: 'Customer changed their mind within 7 days.', created_at: ago(1 * DAY), processed_at: null },
    { id: mockId('rf'), payment_id: d.payments.find(p => p.request_id === done3.id)!.id, request_id: done3.id, short_id: done3.short_id, reason_code: 'quality_30d', requested_amount_cents: 5000, approved_amount_cents: 2500, fee_deducted_cents: refundFee(5000), original_amount_cents: 5000, status: 'rejected', reviewed_by: 'Alex Morgan', note: 'Tool works as specified; offered 2 free revisions instead.', created_at: ago(12 * DAY), processed_at: ago(11 * DAY) },
    { id: mockId('rf'), payment_id: d.payments.find(p => p.request_id === ip3.id)!.id, request_id: ip3.id, short_id: ip3.short_id, reason_code: 'delivery_overdue', requested_amount_cents: 2000, approved_amount_cents: 2000 - refundFee(2000), fee_deducted_cents: refundFee(2000), original_amount_cents: 2000, status: 'succeeded', reviewed_by: 'Alex Morgan', note: 'Overdue > 7 days at request time; refunded in full minus fee.', created_at: ago(4 * DAY), processed_at: ago(3 * DAY) },
  )

  // ---- Assessments ----
  ;[[a1, 3, 4, 4, 4, 5, 4, 2], [pd1, 2, 5, 5, 4, 5, 5, 2], [ip1, 3, 4, 4, 3, 4, 4, 3], [c1, 4, 2, 3, 3, 4, 3, null]].forEach(([r, cx, f, t, v, c, rk, hrs]) => {
    const req = r as Request
    const weighted = Math.round((0.3 * (f as number) + 0.25 * (t as number) + 0.2 * (v as number) + 0.15 * (c as number) + 0.1 * (rk as number)) * 100) / 100
    d.assessments.push({
      id: mockId('as'), request_id: req.id, complexity_stars: cx as number,
      score_feasibility: f as number, score_time: t as number, score_value: v as number, score_capability: c as number, score_risk: rk as number,
      weighted_total: weighted,
      decision_hint: weighted > 4 ? 'accept' : weighted >= 3 ? 'accept_with_surcharge' : weighted >= 2 ? 'discuss' : 'reject',
      needs_backend: req.risk_tags.includes('backend'), needs_paid_api: false,
      estimated_hours: hrs as number | null, suggested_price_cents: req.quoted_price_cents,
      assessed_by: 'Riley Chen', updated_at: req.first_reviewed_at ?? utcNowSafe(),
    })
  })

  // ---- Internal notes ----
  d.internalNotes.push(
    { id: mockId('nt'), request_id: a1.id, author_name: 'Riley Chen', content: 'Straightforward build; reuse the markdown preview component from REQ-2026-0009.', visible_to_user: false, created_at: ago(7 * DAY) },
    { id: mockId('nt'), request_id: c2.id, author_name: 'Riley Chen', content: 'CORS may block half of the use cases - clarified with user that most target APIs allow it.', visible_to_user: true, created_at: ago(5 * DAY) },
    { id: mockId('nt'), request_id: p1.id, author_name: 'Riley Chen', content: 'Likely 2h job, matches our CSV template.', visible_to_user: false, created_at: ago(1 * HOUR) },
  )

  // ---- Notifications (24, mixed) ----
  const nSpecs: [string, NotificationLog['channel'], NotificationLog['status'], string, string, string | null, boolean, number][] = [
    ['N01_new_request', 'inapp', 'sent', `New request #${p1.short_id}`, 'CSV to Excel converter - $15 budget, submitted 2h ago.', p1.short_id, false, 2],
    ['N01_new_request', 'email', 'sent', `New request`, 'Email digest sent to team@requestroom.com.', null, true, 2],
    ['N03_payment_received', 'inapp', 'sent', `Payment received #${pd1.short_id}`, '$15.00 received - entered assignment queue.', pd1.short_id, false, 20],
    ['N06_review_sla_warning', 'email', 'sent', 'Review SLA warning', '2 requests pending > 12h: REQ-2026-0003, REQ-2026-0004.', null, false, 14],
    ['N07_due_warning', 'inapp', 'sent', `Due within 24h #${ip1.short_id}`, 'Bookmark manager is due in 12h at 80% progress.', ip1.short_id, false, 12],
    ['N08_overdue', 'email', 'sent', 'Overdue delivery', 'REQ-2026-0018 passed its due date while still paid.', null, false, 26],
    ['N09_new_feedback', 'inapp', 'sent', 'New 2-star feedback', 'Text Counter Pro - "keyword density numbers look wrong". Flagged high priority.', done2.short_id, false, 24],
    ['N10_new_modification', 'inapp', 'sent', 'New modification request', `#${done1.short_id} wants draft-07 schema support (free revision).`, done1.short_id, false, 14],
    ['N11_refund_request', 'email', 'sent', 'Refund requested', `#${pd2.short_id} - $20.00, reason: no_reason_7d. Awaiting admin review.`, pd2.short_id, false, 24],
    ['N13_notification_failed', 'inapp', 'failed', 'Delivery email failed', `E09_delivered to leo@example.com bounced (mailbox full). Retry 3/3 exhausted.`, done3.short_id, false, 30],
    ['N01_new_request', 'slack', 'failed', 'Slack post failed', 'Could not reach #requests channel (token expired).', null, false, 50],
    ['E02_approved', 'email', 'sent', 'Approval email sent', `Great news! Your tool request #${a1.short_id} has been approved.`, a1.short_id, true, 7 * 24 - 2],
    ['E11_payment_reminder', 'email', 'sent', 'Payment reminder sent', `Reminder: complete your payment for #${a1.short_id}.`, a1.short_id, true, 24 * 4],
    ['N05_assignment', 'email', 'sent', 'Task assigned', `#${pd1.short_id} assigned to Devon Park, due tomorrow.`, pd1.short_id, true, 40],
    ['N02_clarification_answered', 'inapp', 'sent', 'Clarification answered', `#${c2.short_id} answers received - back in review queue.`, c2.short_id, true, 4 * 24],
    ['N04_request_canceled', 'inapp', 'sent', 'Request canceled', 'Meeting cost calculator canceled by user (found_alternative).', null, true, 6 * 24],
  ]
  nSpecs.forEach(([tpl, channel, status, title, body, shortId, read, hoursAgo]) => {
    d.notifications.push({
      id: mockId('ntf'), request_id: shortId ? d.requests.find(r => r.short_id === shortId)?.id ?? null : null,
      short_id: shortId, template_code: tpl, channel, recipient: channel === 'email' ? 'team@requestroom.com' : channel === 'slack' ? '#requests' : 'team-inbox',
      rendered_subject: title, status, error_message: status === 'failed' ? (channel === 'slack' ? 'channel_not_reachable' : 'smtp_mailbox_full') : null,
      retry_count: status === 'failed' ? 3 : 0, is_read: read, title, body,
      sent_at: status === 'sent' ? ago(hoursAgo * HOUR) : null, created_at: ago(hoursAgo * HOUR),
    })
  })
  for (let i = 0; i < 8; i++) {
    d.notifications.push({
      id: mockId('ntf'), request_id: null, short_id: null, template_code: 'N12_daily_digest', channel: 'email',
      recipient: 'team@requestroom.com', rendered_subject: 'Daily digest', status: 'sent', error_message: null, retry_count: 0,
      is_read: true, title: 'Daily low-budget digest', body: `${2 + i} requests under $10 today.`,
      sent_at: ago((i + 1) * DAY), created_at: ago((i + 1) * DAY),
    })
  }

  // ---- Email templates (4 core) ----
  d.emailTemplates.push(
    { id: mockId('tpl'), code: 'E02_approved', channel: 'email', subject: 'Great news! Your tool request #{request_id} has been approved', body_markdown: 'Hi {user_name},\n\nYour request has been approved at a fixed price of {price}.\n\nWe estimate delivery by {delivery_date} once payment is received. Please complete payment within 72 hours to lock your slot.\n\n[Pay now]({payment_link})\n\nThanks,\nThe request/room team', variables: ['user_name', 'request_id', 'price', 'delivery_date', 'payment_link'], is_active: true, version: 3, updated_by: 'Alex Morgan', updated_at: ago(20 * DAY) },
    { id: mockId('tpl'), code: 'E03_rejected', channel: 'email', subject: 'Update on your tool request #{request_id}', body_markdown: 'Hi {user_name},\n\nThank you for submitting your idea. After review we are not able to take this one on: {reason}.\n\nHere are two alternatives that may help:\n1. A similar ready-made tool may already exist - search for "{suggested_search}".\n2. For projects needing backend work, platforms like Fiverr or Upwork are a great fit.\n\nYou are welcome to submit another request any time.\n\nThanks,\nThe request/room team', variables: ['user_name', 'request_id', 'reason', 'suggested_search'], is_active: true, version: 2, updated_by: 'Alex Morgan', updated_at: ago(30 * DAY) },
    { id: mockId('tpl'), code: 'E04_clarification_needed', channel: 'email', subject: 'We need a few more details about your request #{request_id}', body_markdown: 'Hi {user_name},\n\nWe would love to build this for you, but we need a few answers first:\n\n{questions}\n\nReply to this email or use your tracking link. If we do not hear back within 17 days the request will be closed automatically.\n\nThanks,\nThe request/room team', variables: ['user_name', 'request_id', 'questions'], is_active: true, version: 1, updated_by: 'Riley Chen', updated_at: ago(15 * DAY) },
    { id: mockId('tpl'), code: 'E09_delivered', channel: 'email', subject: 'Your tool is ready! #{request_id}', body_markdown: 'Hi {user_name},\n\nYour tool "{tool_title}" is ready: {tool_url}\n\nQuick start:\n{quick_start}\n\nYou have {free_revisions} free revision(s) within the original scope. We would love to hear how it works for you.\n\n[Open your tool]({tool_url})\n\nThanks,\nThe request/room team', variables: ['user_name', 'request_id', 'tool_title', 'tool_url', 'quick_start', 'free_revisions'], is_active: true, version: 4, updated_by: 'Alex Morgan', updated_at: ago(10 * DAY) },
  )

  // ---- Pricing rules (§9.7) ----
  d.pricingRules.push(
    { id: mockId('pr'), min_hours: 0, max_hours: 1, suggested_price_cents: 500, price_range_cents: null, standard_delivery_days: 1, decision: 'accept' },
    { id: mockId('pr'), min_hours: 1, max_hours: 3, suggested_price_cents: 1500, price_range_cents: null, standard_delivery_days: 2, decision: 'accept' },
    { id: mockId('pr'), min_hours: 3, max_hours: 5, suggested_price_cents: null, price_range_cents: [2000, 5000], standard_delivery_days: 3, decision: 'accept_with_surcharge' },
    { id: mockId('pr'), min_hours: 5, max_hours: 10, suggested_price_cents: null, price_range_cents: [5000, 10000], standard_delivery_days: 5, decision: 'accept_with_surcharge_2_reviewers' },
    { id: mockId('pr'), min_hours: 10, max_hours: null, suggested_price_cents: null, price_range_cents: null, standard_delivery_days: null, decision: 'reject_refer_out' },
  )

  // ---- Automation rules A-01..A-20 (§9.1) ----
  const automation: [string, string, number | null, number | null, boolean, 'P0' | 'P1' | 'P2'][] = [
    ['A-01', 'Warn reviewers when a request is pending > threshold', null, 12, true, 'P0'],
    ['A-02', 'Send one payment reminder after approval', null, 72, true, 'P0'],
    ['A-03', 'Auto-cancel approved requests unpaid after threshold', 7, null, true, 'P0'],
    ['A-04', 'Auto-cancel price_adjusted with no response', 7, null, false, 'P1'],
    ['A-05', 'First clarification reminder', 7, null, true, 'P0'],
    ['A-06', 'Final clarification reminder (3 days before cancel)', 14, null, true, 'P0'],
    ['A-07', 'Auto-cancel unanswered clarification', 17, null, true, 'P0'],
    ['A-08', 'Due-soon warning to assignee + admin', null, 24, true, 'P0'],
    ['A-09', 'Overdue notice + delayed email to user', 0, null, true, 'P0'],
    ['A-10', 'Escalate to admin with refund option when overdue > threshold', 7, null, true, 'P0'],
    ['A-11', 'Feedback invite 24h after delivery (once)', null, 24, true, 'P0'],
    ['A-12', 'Expire token + purge attachments after terminal state', 30, null, true, 'P0'],
    ['A-13', '7-day follow-up (marketing opt-in)', 7, null, false, 'P2'],
    ['A-14', '30-day follow-up (marketing opt-in)', 30, null, false, 'P2'],
    ['A-15', '90-day loyalty discount (marketing opt-in)', 90, null, false, 'P2'],
    ['A-16', 'Modification SLA breach alert', null, 12, true, 'P1'],
    ['A-17', 'Unanswered feedback alert', null, 12, true, 'P1'],
    ['A-18', 'Retry failed notifications (exponential backoff)', null, 1, true, 'P0'],
    ['A-19', 'Member load warning above threshold', null, 24, false, 'P1'],
    ['A-20', 'Daily low-budget digest at 18:00', null, 24, false, 'P1'],
  ]
  automation.forEach(([code, description, days, hours, enabled, priority]) => {
    d.automationRules.push({ id: code, code, description, threshold_days: days, threshold_hours: hours, is_enabled: enabled, priority })
  })

  // ---- Audit log ----
  d.auditLog.push(
    { id: mockId('au'), actor_name: 'Alex Morgan', action: 'refund.execute', target_type: 'refund', target_id: 'rf_demo_1', detail: `Executed refund for #${ip3.short_id}: $20.00 - $0.88 fee = $19.12`, ip: '10.0.0.5', created_at: ago(3 * DAY) },
    { id: mockId('au'), actor_name: 'Alex Morgan', action: 'refund.reject', target_type: 'refund', target_id: 'rf_demo_2', detail: `Rejected refund for #${done3.short_id} (quality_30d) - offered revisions instead`, ip: '10.0.0.5', created_at: ago(11 * DAY) },
    { id: mockId('au'), actor_name: 'Alex Morgan', action: 'role.change', target_type: 'user', target_id: 'tm_developer2', detail: 'Promoted Sam Okafor to developer', ip: '10.0.0.5', created_at: ago(40 * DAY) },
    { id: mockId('au'), actor_name: 'Alex Morgan', action: 'template.update', target_type: 'email_template', target_id: 'E09_delivered', detail: 'Updated delivered email quick-start block', ip: '10.0.0.5', created_at: ago(10 * DAY) },
    { id: mockId('au'), actor_name: 'System', action: 'user.anonymize', target_type: 'user', target_id: 'usr_old', detail: 'GDPR deletion executed after 30-day window', ip: null, created_at: ago(15 * DAY) },
  )

  // ---- Tool templates (P2) ----
  d.toolTemplates.push(
    { id: mockId('tt'), name: 'CSV Transform Base', category: 'Data conversion', keywords: ['csv', 'excel', 'convert', 'table'], repo_url: 'https://git.internal/templates/csv-transform', avg_build_hours: 1.5, reuse_count: 7, reusability_score: 5 },
    { id: mockId('tt'), name: 'Text Stats Core', category: 'Text processing', keywords: ['text', 'counter', 'words', 'reading-time'], repo_url: 'https://git.internal/templates/text-stats', avg_build_hours: 1, reuse_count: 4, reusability_score: 4 },
    { id: mockId('tt'), name: 'Canvas Export Kit', category: 'Creative tool', keywords: ['png', 'svg', 'export', 'canvas', 'qr'], repo_url: null, avg_build_hours: 2, reuse_count: 2, reusability_score: 3 },
  )

  // ---- Coupons ----
  d.coupons.push(
    { code: 'WELCOME5', type: 'fixed', value_cents: 500, percent_off: null, valid_until: new Date(Date.now() + 60 * DAY).toISOString(), is_valid: true },
    { code: 'SHARE10', type: 'percent', value_cents: null, percent_off: 10, valid_until: new Date(Date.now() + 30 * DAY).toISOString(), is_valid: true },
    { code: 'EXPIRED1', type: 'fixed', value_cents: 300, percent_off: null, valid_until: ago(2 * DAY), is_valid: false },
  )

  // ---- Load counts for members ----
  d.teamMembers.forEach(m => {
    m.active_task_count = d.requests.filter(r => r.assignee_id === m.id && ['paid', 'in_progress'].includes(r.status)).length
  })

  // ---- User login accounts (P1) ----
  const casey = d.users.find(u => u.email === 'user@example.com')
  if (casey) casey.tags = ['returning']
  upsertUser(d, 'newuser@example.com', 'New User')
  ;(d.users as (User & { password?: string })[]).forEach(u => { u.password = 'mock1234' })
}

// ---------- Queries ----------

export function findByToken(d: MockDb, token: string): Request | null {
  const id = d.tokens.get(token)
  return id ? d.requests.find(r => r.id === id) ?? null : null
}

export function findByShortId(d: MockDb, shortId: string): Request | null {
  return d.requests.find(r => r.short_id.toUpperCase() === shortId.toUpperCase()) ?? null
}

export function tokenFor(d: MockDb, requestId: string): string | null {
  for (const [token, id] of d.tokens.entries()) if (id === requestId) return token
  return null
}

/** Available user actions per status (PRD §7.3 / R-305). */
export function availableActions(r: Request, hasFeedback: boolean): TrackAction[] {
  switch (r.status) {
    case 'pending': return ['cancel_request']
    case 'approved':
      return r.substatus === 'awaiting_price_confirmation'
        ? ['accept_new_price', 'reject_new_price', 'cancel_request']
        : ['pay', 'cancel_request']
    case 'price_adjusted': return ['accept_new_price', 'reject_new_price', 'cancel_request']
    case 'needs_clarification': return ['answer_questions', 'cancel_request']
    case 'paid': return ['cancel_request']
    case 'in_progress': return ['cancel_request', 'rush_upgrade']
    case 'completed': return ['view_tool', hasFeedback ? 'edit_feedback' : 'leave_feedback', 'request_modification', 'request_refund']
    default: return []
  }
}

/** Build the sanitized public view of a request (NF-S10: no notes/scores/tokens). */
export function buildTrackedRequest(d: MockDb, r: Request): TrackedRequest {
  const history = d.statusHistory
    .filter(h => h.request_id === r.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  const deliverable = d.deliverables.find(x => x.request_id === r.id) ?? null
  const fb = d.feedback.find(x => x.request_id === r.id)
  const activeClarification = d.clarifications.find(c => c.request_id === r.id && !c.answers) ?? d.clarifications.filter(c => c.request_id === r.id).sort((a, b) => b.round - a.round)[0] ?? null

  const seen = new Set<RequestStatus>()
  const timeline = history
    .filter(h => {
      // Collapse duplicate consecutive same-status entries; keep the "Submitted" first node.
      if (h.metadata?.submitted) return true
      if (seen.has(h.to_status) && h.to_status !== 'needs_clarification') return false
      seen.add(h.to_status)
      return true
    })
    .map(h => ({
      id: h.id,
      status: h.to_status,
      label: (h.metadata?.submitted ? 'Submitted' : STATUS_META[h.to_status].label),
      detail: h.reason ?? defaultDetail(h.to_status, r),
      actor_type: h.actor_type,
      actor_label: h.actor_type === 'system' ? 'System' : h.actor_type === 'user' ? 'You' : h.actor_name,
      visible_to_user: h.to_status !== 'pending' || !!h.metadata?.submitted || h.reason === null ? true : true,
      timestamp: h.created_at,
      is_main_node: h.to_status === 'pending' || MAIN_NODES.includes(h.to_status),
    }))

  return {
    short_id: r.short_id,
    status: r.status,
    substatus: r.substatus,
    description: r.description,
    quoted_price_cents: r.quoted_price_cents,
    paid_price_cents: r.paid_price_cents,
    expected_delivery: r.expected_delivery,
    due_at: r.due_at,
    delay_count: r.delay_count,
    progress_percent: r.progress_percent,
    free_revisions_total: r.free_revisions_total,
    revisions_used: r.revisions_used,
    submitted_at: r.submitted_at,
    timeline,
    available_actions: availableActions(r, !!fb),
    active_clarification: activeClarification && r.status === 'needs_clarification' ? activeClarification : activeClarification?.answers ? activeClarification : null,
    has_feedback: !!fb,
    deliverable,
    cancel_reason: r.cancel_reason,
  }
}

function defaultDetail(status: RequestStatus, r: Request): string | null {
  switch (status) {
    case 'pending': return 'Your request is in the review queue. Typical first response: 12 hours.'
    case 'approved': return r.substatus === 'awaiting_price_confirmation' ? 'We updated the pricing for your review.' : `Approved at a fixed price. Pay within 7 days to keep your slot.`
    case 'rejected': return 'After review we could not take this one on. See your email for alternatives.'
    case 'needs_clarification': return 'We sent you a few questions - answering them puts you back in the queue.'
    case 'paid': return 'Payment received. Your tool is queued for development.'
    case 'in_progress': return `Building now - ${r.progress_percent}% complete.`
    case 'completed': return 'Your tool was delivered. Enjoy!'
    case 'canceled': return 'This request was canceled.'
    case 'price_adjusted': return 'We proposed updated pricing. Accept to continue, or decline to close.'
    default: return null
  }
}

/** Transition a request (mock state machine lives in mockStateMachine.ts; this mutates + logs). */
export function applyTransition(
  d: MockDb,
  r: Request,
  to: RequestStatus,
  actor: { type: 'user' | 'team' | 'system'; name: string },
  reason?: string,
  meta?: Record<string, unknown>,
) {
  const from = r.status
  d.statusHistory.push({
    id: mockId('sh'),
    request_id: r.id,
    from_status: from,
    to_status: to,
    actor_type: actor.type,
    actor_name: actor.name,
    reason: reason ?? null,
    metadata: meta ?? {},
    created_at: utcNowSafe(),
  })
  r.status = to
  r.updated_at = utcNowSafe()
  if (to === 'approved' && !r.approved_at) { r.approved_at = utcNowSafe(); r.first_reviewed_at ??= r.approved_at }
  if (to === 'paid') r.paid_at = utcNowSafe()
  if (to === 'in_progress') { r.started_at = utcNowSafe(); r.dev_stage = 'in_progress' }
  if (to === 'completed') { r.delivered_at = utcNowSafe(); r.progress_percent = 100; r.dev_stage = 'ready' }
  if (to === 'canceled') r.canceled_at = utcNowSafe()
  if (['rejected', 'canceled', 'completed'].includes(to)) {
    const token = tokenFor(d, r.id)
    if (token) d.tokenMeta[token]!.expires_at = new Date(Date.now() + 30 * DAY).toISOString()
  }
}
