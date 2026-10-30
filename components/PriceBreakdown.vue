<script setup lang="ts">
import type { PriceBreakdownData } from '~/types/api'
import { formatCents } from '~/utils/format'

defineProps<{ data: PriceBreakdownData }>()
</script>

<template>
  <div class="mp-price-breakdown">
    <div class="mp-price-row">
      <span>Base price</span>
      <span class="mp-price-value">{{ formatCents(data.base_cents) }}</span>
    </div>
    <div v-if="data.rush_cents > 0" class="mp-price-row">
      <span>Rush fee</span>
      <span class="mp-price-value">{{ formatCents(data.rush_cents) }}</span>
    </div>
    <div v-if="data.addons_cents > 0" class="mp-price-row">
      <span>Add-ons</span>
      <span class="mp-price-value">{{ formatCents(data.addons_cents) }}</span>
    </div>
    <div v-if="data.coupon_discount_cents > 0" class="mp-price-row mp-price-discount">
      <span>Coupon discount</span>
      <span class="mp-price-value">-{{ formatCents(data.coupon_discount_cents) }}</span>
    </div>
    <div class="mp-price-total">
      <span>Total</span>
      <span class="mp-price-value">{{ formatCents(data.total_cents) }}</span>
    </div>
  </div>
</template>

<style scoped>
.mp-price-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: 'Share Tech Mono', monospace;
}
.mp-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--silver-dim);
}
.mp-price-value {
  font-weight: 600;
  color: var(--silver);
}
.mp-price-discount {
  color: var(--rust);
}
.mp-price-discount .mp-price-value {
  color: var(--rust);
}
.mp-price-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 140, 0, 0.3);
  font-size: 18px;
  font-weight: 700;
  color: var(--silver);
}
.mp-price-total .mp-price-value {
  color: var(--rust);
  font-size: 20px;
  text-shadow: 0 0 8px rgba(255, 140, 0, 0.4);
}
</style>
