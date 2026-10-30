<script setup lang="ts">
import type { PriceBreakdownData, CheckoutResult } from '~/types/api'
import { formatCents } from '~/utils/format'

useHead({ title: 'Payment - request/room' })
const route = useRoute()
const api = useApi()
const toast = useToast()
const shortId = String(route.params.shortId)

const { data: price, refresh: refreshPrice } = await useAsyncData(`price-${shortId}`, () =>
  api.get<PriceBreakdownData>(`/requests/${shortId}/price`),
)

const couponCode = ref('')
const couponError = ref('')
const applyingCoupon = ref(false)
const checkingOut = ref(false)

async function applyCoupon() {
  if (!couponCode.value.trim()) return
  couponError.value = ''
  applyingCoupon.value = true
  try {
    await api.post('/coupons/validate', { code: couponCode.value.trim() })
    await refreshPrice()
    toast.success('Coupon applied!')
  } catch (e: any) {
    couponError.value = e.message || 'Invalid coupon'
  } finally {
    applyingCoupon.value = false
  }
}

async function checkout() {
  checkingOut.value = true
  try {
    const result = await api.post<CheckoutResult>('/payments/checkout', { short_id: shortId })
    await navigateTo(result.url)
  } catch (e: any) {
    toast.error(e.message || 'Connection failed, please try again')
  } finally {
    checkingOut.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-5 pb-20 pt-12 lg:px-8">
    <SkeletonLoader v-if="!price" type="panel" />

    <template v-else>
      <!-- Canceled status -->
      <div v-if="price.status === 'canceled'" class="panel p-8 text-center">
        <EmptyState
          title="Payment closed"
          description="This request has been canceled. Payment is no longer available."
          icon="x-circle"
        />
      </div>

      <template v-else>
        <section class="panel p-7 sm:p-10">
          <p class="eyebrow">Secure checkout</p>
          <h1 class="display mt-3 text-3xl font-semibold">Complete your payment</h1>

          <!-- Order summary -->
          <div class="mt-8 border border-[var(--line)] bg-white/60 p-5">
            <p class="font-semibold">Order Summary</p>
            <p class="mt-1 text-sm text-[var(--muted)]">#{{ price.short_id }} — {{ price.description_excerpt }}{{ price.description_excerpt.length >= 120 ? '…' : '' }}</p>
          </div>

          <!-- Price breakdown -->
          <div class="mt-8">
            <PriceBreakdown :data="price" />
          </div>

          <!-- Coupon -->
          <div class="mt-8 border-t border-[var(--line)] pt-6">
            <label for="coupon" class="label">Have a coupon?</label>
            <div class="mt-2 flex gap-3">
              <input id="coupon" v-model="couponCode" class="field flex-1" placeholder="Enter coupon code" />
              <button class="btn btn-secondary btn-sm" :disabled="applyingCoupon || !couponCode.trim()" @click="applyCoupon">
                {{ applyingCoupon ? 'Applying...' : 'Apply' }}
              </button>
            </div>
            <p v-if="couponError" role="alert" class="error-text mt-1">{{ couponError }}</p>
          </div>

          <!-- Trust badges -->
          <div class="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--muted)]">
            <span class="flex items-center gap-1"><AppIcon name="lock" :size="12" /> SSL secure checkout</span>
            <span class="flex items-center gap-1"><AppIcon name="shield" :size="12" /> 30-day refund guarantee</span>
          </div>

          <!-- Checkout button -->
          <button class="btn btn-primary mt-8 w-full" :disabled="checkingOut" @click="checkout">
            <AppIcon v-if="checkingOut" name="spinner" :size="15" class="animate-spin" />
            {{ checkingOut ? 'Redirecting...' : `Proceed to Payment — ${formatCents(price.total_cents)}` }}
          </button>
        </section>
      </template>
    </template>
  </main>
</template>
