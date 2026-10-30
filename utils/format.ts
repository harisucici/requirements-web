/** Money: integer cents → "$15.00" (never floats in storage). */
export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return '--'
  return `$${(cents / 100).toFixed(2)}`
}

/** UTC ISO8601 → browser-local date+time (R-303). Only call client-side or inside <ClientOnly>. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '--'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '--'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso))
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '--'
  const diff = Date.now() - new Date(iso).getTime()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  const hours = Math.round(abs / 3600000)
  const days = Math.round(abs / 86400000)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (mins < 60) return rtf.format(diff >= 0 ? -mins : mins, 'minute')
  if (hours < 24) return rtf.format(diff >= 0 ? -hours : hours, 'hour')
  return rtf.format(diff >= 0 ? -days : days, 'day')
}

/** Countdown "2d 4h 31m remaining" / "Delayed" when past. */
export function formatCountdown(targetIso: string): { text: string; overdue: boolean } {
  const diff = new Date(targetIso).getTime() - Date.now()
  if (diff <= 0) return { text: 'Delayed', overdue: true }
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const parts = days > 0 ? [`${days}d`, `${hours}h`] : hours > 0 ? [`${hours}h`, `${mins}m`] : [`${mins}m`]
  return { text: `${parts.join(' ')} remaining`, overdue: false }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
