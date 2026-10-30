import type { H3Event } from 'h3'

/** Wrap payload in the standard {code, message, data} envelope. */
export function envelope<T>(data: T, message = 'success') {
  return { code: 'OK', message, data }
}

export class MockApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public payload?: unknown,
  ) {
    super(message)
  }
}

export function errorBody(code: string, message: string, payload?: unknown) {
  return { code, message, data: payload ?? null }
}

export function paginate<T>(items: T[], page = 1, pageSize = 10) {
  const total = items.length
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total, page, page_size: pageSize }
}

export function utcNow(): string {
  return new Date().toISOString()
}

export function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3600_000).toISOString()
}

export function daysFromNow(d: number): string {
  return new Date(Date.now() + d * 86400_000).toISOString()
}

export function centsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/** fee = round(amount * 0.029) + 30 (PRD §9.5) */
export function refundFee(amountCents: number): number {
  return Math.round(amountCents * 0.029) + 30
}

/** Free revision tiers (PRD §9.6): <$20 → 1, <$50 → 2, else 3. */
export function freeRevisionTiers(paidCents: number): number {
  if (paidCents < 2000) return 1
  if (paidCents < 5000) return 2
  return 3
}

let idCounter = 1000
export function mockId(prefix = 'id'): string {
  idCounter += 1
  return `${prefix}_${idCounter.toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function randomToken(): string {
  const bytes = new Uint8Array(32)
  for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export function queryInt(event: H3Event, key: string, fallback: number): number {
  const q = getQuery(event)
  const v = Number(q[key])
  return Number.isFinite(v) && v > 0 ? v : fallback
}
