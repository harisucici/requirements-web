import type { PriceBreakdownData } from '../../../../types/api'

export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const shortId = getRouterParam(event, 'id') ?? ''
  const request = findByShortId(d, shortId)
  if (!request) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Request not found.') })

  const q = getQuery(event)
  const couponCode = typeof q.coupon === 'string' ? q.coupon : null

  const base = request.quoted_price_cents ?? 0
  const rush = request.is_rush ? Math.round(base * 0.5) : 0
  const addons = 0

  let discount = 0
  if (couponCode) {
    const coupon = d.coupons.find(c => c.code === couponCode && c.is_valid && new Date(c.valid_until) > new Date())
    if (coupon) {
      if (coupon.type === 'fixed' && coupon.value_cents) discount = Math.min(coupon.value_cents, base + rush + addons)
      if (coupon.type === 'percent' && coupon.percent_off) discount = Math.round((base + rush + addons) * coupon.percent_off / 100)
    }
  }

  const total = Math.max(base + rush + addons - discount, 0)

  const data: PriceBreakdownData = {
    short_id: request.short_id,
    description_excerpt: request.description.slice(0, 120),
    base_cents: base,
    rush_cents: rush,
    addons_cents: addons,
    coupon_discount_cents: discount,
    total_cents: total,
    currency: request.currency,
    status: request.status,
    due_at: request.due_at,
  }
  return envelope(data)
})
