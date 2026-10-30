export default defineEventHandler(async (event) => {
  const d = useMockDb()
  requireRole(event, d, ['admin'])
  await applyLatency()
  checkFault(event)

  const page = queryInt(event, 'page', 1)
  const pageSize = queryInt(event, 'page_size', 10)

  // Enrich refunds with payment context
  const items = d.refunds.map((rf) => {
    const payment = d.payments.find(p => p.id === rf.payment_id)
    return {
      ...rf,
      payment: payment
        ? { provider: payment.provider, amount_cents: payment.amount_cents, status: payment.status, paid_at: payment.paid_at }
        : null,
    }
  }).sort((a, b) => b.created_at.localeCompare(a.created_at))

  return envelope(paginate(items, page, pageSize))
})
