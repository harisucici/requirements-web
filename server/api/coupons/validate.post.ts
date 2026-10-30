export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const d = useMockDb()
  const body = await readBody<{ code: string }>(event)

  if (!body.code?.trim()) {
    throw createError({ statusCode: 422, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'Please enter a coupon code.') })
  }

  const coupon = d.coupons.find(c => c.code === body.code!.trim().toUpperCase())
  if (!coupon) {
    throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', 'Coupon code not found.') })
  }

  if (!coupon.is_valid || new Date(coupon.valid_until) < new Date()) {
    throw createError({ statusCode: 422, statusMessage: 'VALIDATION_ERROR', data: errorBody('VALIDATION_ERROR', 'This coupon has expired.') })
  }

  return envelope(coupon)
})
