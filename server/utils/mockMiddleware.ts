import type { H3Event } from 'h3'
import { errorBody } from './mockHelpers'
import { getSessionMemberId } from './authCookie'

/** Simulated network latency 200-600ms (dev plan §3.2). */
export async function applyLatency(event?: H3Event) {
  // Keep SSR smoke tests fast when explicitly requested.
  if (event && getQuery(event).__nodelay === '1') return
  const ms = 200 + Math.floor(Math.random() * 400)
  await new Promise(resolve => setTimeout(resolve, ms))
}

/** Fault injection: ?__fail=1 → 500 MOCK_FAULT (R-108 / AC-01.7 demos). */
export function checkFault(event: H3Event) {
  const q = getQuery(event)
  if (q.__fail === '1' || q.__fail === 'true') {
    throw createError({
      statusCode: 500,
      statusMessage: 'MOCK_FAULT',
      data: errorBody('MOCK_FAULT', 'Simulated server error'),
    })
  }
}

import type { UserRole } from '../../types/enums'

export interface SessionMember {
  id: string
  email: string
  name: string
  role: UserRole
}

/** Require an authenticated team session; returns the member from mockDb. */
export function requireAuth(event: H3Event, db: { teamMembers: SessionMember[] }): SessionMember {
  const id = getSessionMemberId(event)
  const member = id ? db.teamMembers.find(m => m.id === id) : null
  if (!member) {
    throw createError({
      statusCode: 401,
      statusMessage: 'UNAUTHORIZED',
      data: errorBody('UNAUTHORIZED', 'Sign in to continue'),
    })
  }
  return member
}

/** Require one of the allowed roles (PRD §2.2 matrix). */
export function requireRole(event: H3Event, db: { teamMembers: SessionMember[] }, roles: string[]): SessionMember {
  const member = requireAuth(event, db)
  if (!roles.includes(member.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'FORBIDDEN',
      data: errorBody('FORBIDDEN', `Requires role: ${roles.join(' or ')}`),
    })
  }
  return member
}

