import type { UserRole } from '~/types/enums'

export interface AdminMenuItem {
  to: string
  label: string
  icon: string
  roles: UserRole[]
  section: 'Review' | 'Delivery' | 'Care' | 'Insights' | 'Configuration'
}

/** Sidebar config filtered by role (PRD §2.2 matrix). */
export const ADMIN_MENU: AdminMenuItem[] = [
  { to: '/admin', label: 'Dashboard', icon: 'home', roles: ['reviewer', 'developer', 'admin'], section: 'Review' },
  { to: '/admin/requests', label: 'Requests', icon: 'inbox', roles: ['reviewer', 'developer', 'admin'], section: 'Review' },
  { to: '/admin/dev', label: 'Dev Board', icon: 'board', roles: ['developer', 'reviewer', 'admin'], section: 'Delivery' },
  { to: '/admin/modifications', label: 'Modifications', icon: 'edit', roles: ['reviewer', 'developer', 'admin'], section: 'Delivery' },
  { to: '/admin/feedback', label: 'Feedback', icon: 'star', roles: ['reviewer', 'admin'], section: 'Care' },
  { to: '/admin/refunds', label: 'Refunds', icon: 'refund', roles: ['admin'], section: 'Care' },
  { to: '/admin/notifications', label: 'Notifications', icon: 'bell', roles: ['reviewer', 'developer', 'admin'], section: 'Care' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'chart', roles: ['reviewer', 'admin'], section: 'Insights' },
  { to: '/admin/audit', label: 'Audit Log', icon: 'shield', roles: ['admin'], section: 'Insights' },
  { to: '/admin/templates', label: 'Email Templates', icon: 'mail', roles: ['admin'], section: 'Configuration' },
  { to: '/admin/templates/tools', label: 'Tool Library', icon: 'library', roles: ['reviewer', 'developer', 'admin'], section: 'Configuration' },
  { to: '/admin/settings/pricing', label: 'Pricing Rules', icon: 'tag', roles: ['admin'], section: 'Configuration' },
  { to: '/admin/settings/automation', label: 'Automation', icon: 'bolt', roles: ['admin'], section: 'Configuration' },
  { to: '/admin/settings/members', label: 'Members', icon: 'users', roles: ['admin'], section: 'Configuration' },
]

export const ADMIN_SECTIONS = ['Review', 'Delivery', 'Care', 'Insights', 'Configuration'] as const

export function menuForRole(role: UserRole | undefined): AdminMenuItem[] {
  if (!role) return []
  return ADMIN_MENU.filter(item => item.roles.includes(role))
}
