// Enums mirrored from PRD §7.1 / §2.1 / architecture-design §8 — single source of truth.

export const RequestStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_CLARIFICATION: 'needs_clarification',
  PAID: 'paid',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
  PRICE_ADJUSTED: 'price_adjusted',
} as const
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus]

export const TERMINAL_STATUSES: RequestStatus[] = ['completed', 'rejected', 'canceled']

export const UserRole = {
  USER: 'user',
  REVIEWER: 'reviewer',
  DEVELOPER: 'developer',
  ADMIN: 'admin',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const ExpectedDelivery = {
  TWO_DAYS: '2_days',
  ONE_WEEK: '1_week',
  TWO_WEEKS: '2_weeks',
} as const
export type ExpectedDelivery = (typeof ExpectedDelivery)[keyof typeof ExpectedDelivery]

export const PaymentType = {
  MAIN: 'main',
  RUSH_SURCHARGE: 'rush_surcharge',
  EXTRA_REVISION: 'extra_revision',
} as const
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType]

export const PaymentStatus = {
  CREATED: 'created',
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
} as const
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export const RefundReasonCode = {
  NO_REASON_7D: 'no_reason_7d',
  QUALITY_30D: 'quality_30d',
  DELIVERY_OVERDUE: 'delivery_overdue',
  CANCELED_BEFORE_DEV: 'canceled_before_dev',
  PARTIAL_IN_PROGRESS: 'partial_in_progress',
  OTHER: 'other',
} as const
export type RefundReasonCode = (typeof RefundReasonCode)[keyof typeof RefundReasonCode]

export const RefundStatus = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
} as const
export type RefundStatus = (typeof RefundStatus)[keyof typeof RefundStatus]

export const FeedbackCategory = {
  BUG: 'bug',
  FEATURE_REQUEST: 'feature_request',
  UX: 'ux',
  OTHER: 'other',
} as const
export type FeedbackCategory = (typeof FeedbackCategory)[keyof typeof FeedbackCategory]

export const FeedbackPriority = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' } as const
export type FeedbackPriority = (typeof FeedbackPriority)[keyof typeof FeedbackPriority]

export const HandleStatus = { NEW: 'new', REPLIED: 'replied', RESOLVED: 'resolved' } as const
export type HandleStatus = (typeof HandleStatus)[keyof typeof HandleStatus]

export const ModificationStatus = {
  PENDING_PAYMENT: 'pending_payment',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  REDELIVERED: 'redelivered',
  REJECTED: 'rejected',
} as const
export type ModificationStatus = (typeof ModificationStatus)[keyof typeof ModificationStatus]

export const NotificationChannel = {
  EMAIL: 'email',
  INAPP: 'inapp',
  SLACK: 'slack',
  BROWSER: 'browser',
} as const
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel]

export const NotificationStatus = {
  QUEUED: 'queued',
  SENT: 'sent',
  FAILED: 'failed',
  SUPPRESSED: 'suppressed',
} as const
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus]

export const ActorType = { USER: 'user', TEAM: 'team', SYSTEM: 'system' } as const
export type ActorType = (typeof ActorType)[keyof typeof ActorType]

export const DecisionAction = {
  ACCEPT: 'accept',
  REJECT: 'reject',
  CLARIFY: 'clarify',
  PRICE_ADJUST: 'price_adjust',
} as const
export type DecisionAction = (typeof DecisionAction)[keyof typeof DecisionAction]

export const DecisionHint = {
  ACCEPT: 'accept',
  ACCEPT_WITH_SURCHARGE: 'accept_with_surcharge',
  DISCUSS: 'discuss',
  REJECT: 'reject',
} as const
export type DecisionHint = (typeof DecisionHint)[keyof typeof DecisionHint]

/** Error codes shared across mock API and pages (architecture-design §8). */
export const ErrorCode = {
  OK: 'OK',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_WINDOW: 'DUPLICATE_WINDOW',
  EXACT_DUPLICATE: 'EXACT_DUPLICATE',
  SIMILAR_REQUEST: 'SIMILAR_REQUEST',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  VARIABLE_NOT_REPLACED: 'VARIABLE_NOT_REPLACED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  CHECKLIST_INCOMPLETE: 'CHECKLIST_INCOMPLETE',
  DELIVERY_FIELDS_MISSING: 'DELIVERY_FIELDS_MISSING',
  REVISION_QUOTA_EXCEEDED: 'REVISION_QUOTA_EXCEEDED',
  PAYMENT_CLOSED: 'PAYMENT_CLOSED',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  LOCKED: 'LOCKED',
  MOCK_FAULT: 'MOCK_FAULT',
  INTERNAL: 'INTERNAL',
} as const
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

/** Kanban columns for /admin/dev (A-07). `testing`/`ready` are sub-stages of in_progress. */
export const DevStage = {
  PAID: 'paid',
  IN_PROGRESS: 'in_progress',
  TESTING: 'testing',
  READY: 'ready',
} as const
export type DevStage = (typeof DevStage)[keyof typeof DevStage]
