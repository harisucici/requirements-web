// API DTOs mirroring architecture-design §4.3 — snake_case, integer cents, UTC ISO8601.
// This file is the frontend/backend contract. Changes require review.

// Convenience re-exports so pages can import everything from '~/types/api'.
export type {
  ActorType, DecisionHint, DevStage, ExpectedDelivery, FeedbackCategory, FeedbackPriority,
  HandleStatus, ModificationStatus, NotificationChannel, NotificationStatus, PaymentStatus,
  PaymentType, RefundReasonCode, RefundStatus, RequestStatus, UserRole,
} from './enums'
export {
  RequestStatus as RequestStatusEnum, TERMINAL_STATUSES, ErrorCode,
} from './enums'

import type {
  ActorType,
  DecisionHint,
  DevStage,
  ExpectedDelivery,
  FeedbackCategory,
  FeedbackPriority,
  HandleStatus,
  ModificationStatus,
  NotificationChannel,
  NotificationStatus,
  PaymentStatus,
  PaymentType,
  RefundReasonCode,
  RefundStatus,
  RequestStatus,
  UserRole,
} from './enums'

/** Standard response envelope for every mock/real endpoint. */
export interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// ---------- Core entities ----------

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  request_count: number
  marketing_opt_in: boolean
  tags: string[]
  last_submitted_at: string | null
  created_at: string
}

export interface Attachment {
  id: string
  request_id: string
  file_name: string
  mime_type: string
  size_bytes: number
  /** Mock preview URL (data URI or placeholder). */
  url: string
  created_at: string
}

export interface Request {
  id: string
  short_id: string
  user_id: string
  user_email: string
  user_name: string | null
  description: string
  use_case: string | null
  expected_delivery: ExpectedDelivery | null
  budget_cents: number | null
  status: RequestStatus
  substatus: string | null
  quoted_price_cents: number | null
  paid_price_cents: number | null
  currency: string
  priority_score: number | null
  assignee_id: string | null
  assignee_name: string | null
  reviewer_id: string | null
  second_approver_id: string | null
  estimated_hours: number | null
  actual_hours: number | null
  progress_percent: number
  /** Mock-stage for kanban columns testing/ready while status is in_progress. */
  dev_stage: DevStage | null
  due_at: string | null
  delay_count: number
  free_revisions_total: number
  revisions_used: number
  is_rush: boolean
  source: string | null
  category: string | null
  risk_tags: string[]
  submitted_at: string
  first_reviewed_at: string | null
  approved_at: string | null
  paid_at: string | null
  started_at: string | null
  delivered_at: string | null
  canceled_at: string | null
  cancel_reason: string | null
  cancel_note: string | null
  created_at: string
  updated_at: string
}

/** Sanitized request for the public tracking page (NF-S10: no internal notes/scores). */
export interface TrackedRequest {
  short_id: string
  status: RequestStatus
  substatus: string | null
  description: string
  quoted_price_cents: number | null
  paid_price_cents: number | null
  expected_delivery: ExpectedDelivery | null
  due_at: string | null
  delay_count: number
  progress_percent: number
  free_revisions_total: number
  revisions_used: number
  submitted_at: string
  timeline: TimelineEvent[]
  /** Action keys the UI should render, per PRD §7.3 mapping. */
  available_actions: TrackAction[]
  active_clarification: Clarification | null
  has_feedback: boolean
  deliverable: Deliverable | null
  cancel_reason: string | null
}

export type TrackAction =
  | 'pay'
  | 'answer_questions'
  | 'accept_new_price'
  | 'reject_new_price'
  | 'cancel_request'
  | 'view_tool'
  | 'leave_feedback'
  | 'edit_feedback'
  | 'request_modification'
  | 'request_refund'
  | 'rush_upgrade'

export interface TimelineEvent {
  id: string
  status: RequestStatus
  label: string
  detail: string | null
  actor_type: ActorType
  actor_label: string
  visible_to_user: boolean
  timestamp: string
  /** Main-node flag for the 6-node user timeline (R-303). */
  is_main_node: boolean
}

export interface ClarificationQuestion {
  no: number
  text: string
}
export interface ClarificationAnswer {
  no: number
  text: string
}
export interface Clarification {
  id: string
  request_id: string
  round: number
  questions: ClarificationQuestion[]
  answers: ClarificationAnswer[] | null
  asked_at: string
  answered_at: string | null
}

export interface Assessment {
  id: string
  request_id: string
  complexity_stars: number
  score_feasibility: number
  score_time: number
  score_value: number
  score_capability: number
  score_risk: number
  weighted_total: number
  decision_hint: DecisionHint
  needs_backend: boolean
  needs_paid_api: boolean
  estimated_hours: number | null
  suggested_price_cents: number | null
  assessed_by: string | null
  updated_at: string
}

export interface InternalNote {
  id: string
  request_id: string
  author_name: string
  content: string
  visible_to_user: boolean
  created_at: string
}

export interface StatusHistoryEntry {
  id: string
  request_id: string
  from_status: RequestStatus | null
  to_status: RequestStatus
  actor_type: ActorType
  actor_name: string
  reason: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Payment {
  id: string
  request_id: string
  short_id: string
  type: PaymentType
  provider: 'mock' | 'stripe'
  provider_session_id: string
  amount_cents: number
  fee_cents: number | null
  discount_cents: number
  coupon_code: string | null
  status: PaymentStatus
  failure_reason: string | null
  paid_at: string | null
  created_at: string
}

export interface Refund {
  id: string
  payment_id: string
  request_id: string
  short_id: string
  reason_code: RefundReasonCode
  requested_amount_cents: number
  approved_amount_cents: number | null
  fee_deducted_cents: number
  original_amount_cents: number
  status: RefundStatus
  reviewed_by: string | null
  note: string | null
  created_at: string
  processed_at: string | null
}

export interface ChecklistItem {
  key: string
  label: string
  checked: boolean
  checked_by: string | null
  checked_at: string | null
}

export interface Deliverable {
  id: string
  request_id: string
  tool_url: string
  title: string
  preview_images: string[]
  quick_start_steps: string[]
  doc_url: string | null
  video_url: string | null
  checklist: ChecklistItem[]
  version: number
  delivered_by: string | null
  delivered_at: string
}

export interface Feedback {
  id: string
  request_id: string
  short_id: string
  user_email: string
  rating: number
  comment: string | null
  nps_score: number | null
  improvement_suggestion: string | null
  category: FeedbackCategory | null
  priority: FeedbackPriority | null
  handle_status: HandleStatus
  reply: string | null
  replied_by: string | null
  replied_at: string | null
  editable_until: string
  created_at: string
}

export interface ModificationRequest {
  id: string
  request_id: string
  short_id: string
  seq: number
  description: string
  is_free: boolean
  charge_cents: number
  status: ModificationStatus
  reject_reason: string | null
  sla_due_at: string
  handled_by: string | null
  created_at: string
  redelivered_at: string | null
}

export interface TrackingTokenInfo {
  token: string
  expires_at: string | null
  revoked_at: string | null
}

export interface EmailTemplate {
  id: string
  code: string
  channel: NotificationChannel
  subject: string
  body_markdown: string
  variables: string[]
  is_active: boolean
  version: number
  updated_by: string | null
  updated_at: string
}

export interface NotificationLog {
  id: string
  request_id: string | null
  short_id: string | null
  template_code: string
  channel: NotificationChannel
  recipient: string
  rendered_subject: string | null
  status: NotificationStatus
  error_message: string | null
  retry_count: number
  is_read: boolean
  /** Headline shown in the in-app notification center (A-12). */
  title: string
  body: string
  sent_at: string | null
  created_at: string
}

export interface PricingRule {
  id: string
  min_hours: number
  max_hours: number | null
  suggested_price_cents: number | null
  price_range_cents: [number, number] | null
  standard_delivery_days: number | null
  decision: string
}

export interface AutomationRule {
  id: string
  code: string
  description: string
  threshold_days: number | null
  threshold_hours: number | null
  is_enabled: boolean
  priority: 'P0' | 'P1' | 'P2'
}

export interface TeamMember {
  id: string
  email: string
  name: string
  role: UserRole
  skill_tags: string[]
  active_task_count: number
  load_threshold: number
  is_active: boolean
}

export interface AuditLogEntry {
  id: string
  actor_name: string
  action: string
  target_type: string
  target_id: string
  detail: string
  ip: string | null
  created_at: string
}

export interface ToolTemplate {
  id: string
  name: string
  category: string
  keywords: string[]
  repo_url: string | null
  avg_build_hours: number | null
  reuse_count: number
  reusability_score: number | null
}

export interface Coupon {
  code: string
  type: 'fixed' | 'percent'
  value_cents: number | null
  percent_off: number | null
  valid_until: string
  is_valid: boolean
}

// ---------- Endpoint payloads ----------

export interface CreateRequestPayload {
  description: string
  email: string
  use_case?: string
  expected_delivery?: ExpectedDelivery
  budget_cents?: number
  source?: string
  terms_accepted: boolean
  attachment_ids?: string[]
}

export interface CreateRequestResult {
  short_id: string
  token: string
  status: RequestStatus
}

export interface DuplicateWindowPayload {
  existing_request: { short_id: string; status: RequestStatus; token: string }
}

export interface SimilarRequestPayload {
  similar: { short_id: string; description: string; similarity: number; token: string }
}

export interface DecisionPayload {
  action: 'accept' | 'reject' | 'clarify' | 'price_adjust'
  quoted_price_cents?: number
  due_at?: string
  estimated_hours?: number
  reason?: string
  questions?: string[]
  template_code?: string
}

export interface AssessmentPayload {
  complexity_stars: number
  score_feasibility: number
  score_time: number
  score_value: number
  score_capability: number
  score_risk: number
  estimated_hours?: number
}

export interface PriceBreakdownData {
  short_id: string
  description_excerpt: string
  base_cents: number
  rush_cents: number
  addons_cents: number
  coupon_discount_cents: number
  total_cents: number
  currency: string
  status: RequestStatus
  due_at: string | null
}

export interface CheckoutResult {
  session_id: string
  url: string
}

export interface MockConfirmResult {
  short_id: string
  token: string
  status: RequestStatus
}

export interface PayResultData {
  status: 'succeeded' | 'failed' | 'pending'
  failure_reason: string | null
  short_id: string
  token: string
  paid_at: string | null
  due_at: string | null
}

export interface CancelEstimate {
  status: RequestStatus
  refundable_cents: number
  fee_cents: number
  requires_review: boolean
  explanation: string
}

export interface DevBoardData {
  columns: {
    stage: DevStage
    label: string
    cards: Request[]
  }[]
  members: TeamMember[]
}

export interface AnalyticsData {
  range: { from: string; to: string }
  submissions_total: number
  submissions_growth_pct: number
  funnel: { stage: string; value: number }[]
  on_time_delivery_pct: number
  avg_rating: number
  avg_price_cents: number
  refund_rate_pct: number
  acceptance_rate_pct: number
  payment_conversion_pct: number
  weekly_submissions: { date: string; value: number }[]
  category_distribution: { category: string; value: number }[]
  source_distribution: { source: string; value: number }[]
  rating_distribution: { rating: number; value: number }[]
}

export interface DashboardData {
  kpis: {
    pending_review: number
    due_today: number
    overdue: number
    new_feedback: number
    unread_notifications: number
  }
  todos: { id: string; short_id: string; label: string; due_at: string | null; kind: string }[]
  alerts: { id: string; level: 'warning' | 'danger' | 'info'; message: string; short_id: string | null }[]
}

export interface AdminSession {
  id: string
  email: string
  name: string
  role: UserRole
  unread_notifications?: number
}

export interface LegalPage {
  slug: 'privacy' | 'terms' | 'cookies'
  title: string
  updated_at: string
  sections: { heading: string; body: string }[]
}

export interface RevisionQuota {
  free_revisions_total: number
  revisions_used: number
  remaining: number
  extra_revision_fee_cents: number
}
