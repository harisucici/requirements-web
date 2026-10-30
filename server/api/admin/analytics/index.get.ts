export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireAuth(event, d)
  await applyLatency()
  checkFault(event)

  const days = queryInt(event, 'days', 30)
  const validDays = [7, 30, 90]
  const rangeDays = validDays.includes(days) ? days : 30

  const now = Date.now()
  const from = new Date(now - rangeDays * 86400_000).toISOString()
  const to = new Date(now).toISOString()
  const priorFrom = new Date(now - rangeDays * 2 * 86400_000).toISOString()

  // Submissions in range
  const submissionsInRange = d.requests.filter(r => r.submitted_at >= from && r.submitted_at <= to)
  const submissionsInPrior = d.requests.filter(r => r.submitted_at >= priorFrom && r.submitted_at < from)
  const submissionsTotal = submissionsInRange.length
  const submissionsGrowthPct = submissionsInPrior.length > 0
    ? Math.round(((submissionsTotal - submissionsInPrior.length) / submissionsInPrior.length) * 100)
    : submissionsTotal > 0 ? 100 : 0

  // Funnel stages
  const allInRange = d.requests.filter(r => r.created_at >= from)
  const funnel = [
    { stage: 'submitted', value: allInRange.length },
    { stage: 'approved', value: allInRange.filter(r => ['approved', 'paid', 'in_progress', 'completed', 'price_adjusted'].includes(r.status)).length },
    { stage: 'paid', value: allInRange.filter(r => ['paid', 'in_progress', 'completed'].includes(r.status)).length },
    { stage: 'in_progress', value: allInRange.filter(r => ['in_progress', 'completed'].includes(r.status)).length },
    { stage: 'completed', value: allInRange.filter(r => r.status === 'completed').length },
  ]

  // On-time delivery: completed requests where delivered_at <= due_at
  const completedInRange = allInRange.filter(r => r.status === 'completed')
  const onTimeCount = completedInRange.filter(r => r.delivered_at && r.due_at && r.delivered_at <= r.due_at).length
  const onTimeDeliveryPct = completedInRange.length > 0
    ? Math.round((onTimeCount / completedInRange.length) * 100)
    : 100

  // Avg rating from feedback in range
  const feedbackInRange = d.feedback.filter(f => f.created_at >= from)
  const avgRating = feedbackInRange.length > 0
    ? Math.round((feedbackInRange.reduce((sum, f) => sum + f.rating, 0) / feedbackInRange.length) * 10) / 10
    : 0

  // Avg price from paid requests in range
  const paidInRange = allInRange.filter(r => r.paid_price_cents !== null)
  const avgPriceCents = paidInRange.length > 0
    ? Math.round(paidInRange.reduce((sum, r) => sum + (r.paid_price_cents ?? 0), 0) / paidInRange.length)
    : 0

  // Refund rate: refunds / payments
  const refundsInRange = d.refunds.filter(rf => rf.created_at >= from)
  const paymentsInRange = d.payments.filter(p => p.status === 'succeeded' && p.created_at >= from)
  const refundRatePct = paymentsInRange.length > 0
    ? Math.round((refundsInRange.length / paymentsInRange.length) * 100)
    : 0

  // Acceptance rate: approved / (approved + rejected)
  const approvedCount = allInRange.filter(r => ['approved', 'paid', 'in_progress', 'completed'].includes(r.status)).length
  const rejectedCount = allInRange.filter(r => r.status === 'rejected').length
  const totalReviewed = approvedCount + rejectedCount
  const acceptanceRatePct = totalReviewed > 0 ? Math.round((approvedCount / totalReviewed) * 100) : 0

  // Payment conversion: paid / approved
  const approvedOrBeyond = allInRange.filter(r => ['approved', 'paid', 'in_progress', 'completed', 'price_adjusted'].includes(r.status)).length
  const paymentConversionPct = approvedOrBeyond > 0
    ? Math.round((paidInRange.length / approvedOrBeyond) * 100)
    : 0

  // Weekly submissions series
  const weekMs = 7 * 86400_000
  const weeklySubmissions: { date: string; value: number }[] = []
  for (let t = now - rangeDays * 86400_000; t < now; t += weekMs) {
    const weekStart = new Date(t).toISOString()
    const weekEnd = new Date(t + weekMs).toISOString()
    const count = d.requests.filter(r => r.submitted_at >= weekStart && r.submitted_at < weekEnd).length
    weeklySubmissions.push({ date: weekStart.slice(0, 10), value: count })
  }

  // Category distribution
  const catMap = new Map<string, number>()
  submissionsInRange.forEach((r) => {
    const cat = r.category || 'Uncategorized'
    catMap.set(cat, (catMap.get(cat) ?? 0) + 1)
  })
  const categoryDistribution = Array.from(catMap.entries()).map(([category, value]) => ({ category, value }))

  // Source distribution
  const srcMap = new Map<string, number>()
  submissionsInRange.forEach((r) => {
    const src = r.source || 'direct'
    srcMap.set(src, (srcMap.get(src) ?? 0) + 1)
  })
  const sourceDistribution = Array.from(srcMap.entries()).map(([source, value]) => ({ source, value }))

  // Rating distribution
  const ratingMap = new Map<number, number>()
  feedbackInRange.forEach((f) => {
    ratingMap.set(f.rating, (ratingMap.get(f.rating) ?? 0) + 1)
  })
  const ratingDistribution = Array.from(ratingMap.entries()).map(([rating, value]) => ({ rating, value }))

  return envelope({
    range: { from, to },
    submissions_total: submissionsTotal,
    submissions_growth_pct: submissionsGrowthPct,
    funnel,
    on_time_delivery_pct: onTimeDeliveryPct,
    avg_rating: avgRating,
    avg_price_cents: avgPriceCents,
    refund_rate_pct: refundRatePct,
    acceptance_rate_pct: acceptanceRatePct,
    payment_conversion_pct: paymentConversionPct,
    weekly_submissions: weeklySubmissions,
    category_distribution: categoryDistribution,
    source_distribution: sourceDistribution,
    rating_distribution: ratingDistribution,
  })
})
