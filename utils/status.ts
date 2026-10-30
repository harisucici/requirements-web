import type { RequestStatus, TrackAction } from '~/types/api'

/**
 * PRD §7.1 status presentation. Badges always render text + icon (NF-A3:
 * never color alone). Colors are verified against --paper for contrast;
 * badge text uses a darkened variant where the raw hue is too light.
 */
export const STATUS_META: Record<RequestStatus, { label: string; color: string; textColor: string; bg: string; icon: string }> = {
  pending: { label: 'Under Review', color: '#6B7280', textColor: '#374151', bg: 'rgba(107,114,128,.12)', icon: 'clock' },
  approved: { label: 'Approved - Awaiting Payment', color: '#2563EB', textColor: '#1D4ED8', bg: 'rgba(37,99,235,.1)', icon: 'check-circle' },
  rejected: { label: 'Not Accepted', color: '#DC2626', textColor: '#B91C1C', bg: 'rgba(220,38,38,.1)', icon: 'x-circle' },
  needs_clarification: { label: 'Needs Your Input', color: '#D97706', textColor: '#92400E', bg: 'rgba(217,119,6,.12)', icon: 'question' },
  paid: { label: 'Payment Received', color: '#059669', textColor: '#046C4E', bg: 'rgba(5,150,105,.1)', icon: 'card' },
  in_progress: { label: 'In Development', color: '#EA580C', textColor: '#9A3412', bg: 'rgba(234,88,12,.1)', icon: 'hammer' },
  completed: { label: 'Completed', color: '#047857', textColor: '#065F46', bg: 'rgba(4,120,87,.1)', icon: 'flag' },
  canceled: { label: 'Canceled', color: '#9CA3AF', textColor: '#4B5563', bg: 'rgba(156,163,175,.15)', icon: 'slash' },
  price_adjusted: { label: 'Updated Pricing - Awaiting Your Approval', color: '#7C3AED', textColor: '#6D28D9', bg: 'rgba(124,58,237,.1)', icon: 'tag' },
}

/** Short label for tight spaces (admin tables). */
export const STATUS_SHORT: Record<RequestStatus, string> = {
  pending: 'Pending',
  approved: 'Awaiting payment',
  rejected: 'Rejected',
  needs_clarification: 'Needs input',
  paid: 'Paid',
  in_progress: 'In development',
  completed: 'Completed',
  canceled: 'Canceled',
  price_adjusted: 'Repriced',
}

export const STATUS_ORDER: RequestStatus[] = [
  'pending', 'needs_clarification', 'approved', 'price_adjusted', 'paid', 'in_progress', 'completed', 'rejected', 'canceled',
]

/** CTA copy for each tracking-page action (R-305). */
export const ACTION_META: Record<TrackAction, { label: string; variant: 'primary' | 'secondary' | 'danger' | 'ghost' }> = {
  pay: { label: 'Pay Now', variant: 'primary' },
  answer_questions: { label: 'Answer Questions', variant: 'primary' },
  accept_new_price: { label: 'Accept New Price', variant: 'primary' },
  reject_new_price: { label: 'Decline New Price', variant: 'danger' },
  cancel_request: { label: 'Cancel Request', variant: 'ghost' },
  view_tool: { label: 'View Tool', variant: 'primary' },
  leave_feedback: { label: 'Leave Feedback', variant: 'secondary' },
  edit_feedback: { label: 'Edit Feedback', variant: 'secondary' },
  request_modification: { label: 'Request Modification', variant: 'secondary' },
  request_refund: { label: 'Request a Refund', variant: 'ghost' },
  rush_upgrade: { label: 'Need it faster?', variant: 'ghost' },
}
