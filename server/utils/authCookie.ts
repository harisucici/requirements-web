import type { H3Event } from 'h3'

const COOKIE = 'rm_session'

export function setSessionCookie(event: H3Event, memberId: string) {
  setCookie(event, COOKIE, memberId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // dev mock; real backend enforces Secure (NF-S1)
    maxAge: 60 * 60 * 8, // 8h session (R-1702)
    path: '/',
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, COOKIE, { path: '/' })
}

export function getSessionMemberId(event: H3Event): string | null {
  return getCookie(event, COOKIE) ?? null
}

const USER_COOKIE = 'rm_user_session'

export function setUserSessionCookie(event: H3Event, userId: string) {
  setCookie(event, USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

export function clearUserSessionCookie(event: H3Event) {
  deleteCookie(event, USER_COOKIE, { path: '/' })
}

export function getUserSessionId(event: H3Event): string | null {
  return getCookie(event, USER_COOKIE) ?? null
}
