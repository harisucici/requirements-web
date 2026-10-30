<script setup lang="ts">
import { formatCents } from '~/utils/format'

const props = defineProps<{
  hours: number | null
  modelValue: number
}>()
const emit = defineEmits<{
  'update:modelValue': [value: number]
  'update:hours': [value: number | null]
}>()

interface Suggestion {
  priceCents: number
  priceLabel: string
  deliveryDays: string
  decision: string
}

function suggest(h: number | null): Suggestion | null {
  if (h == null || h <= 0) return null
  if (h < 1) return { priceCents: 500, priceLabel: '$5', deliveryDays: '1 day', decision: 'Accept' }
  if (h <= 3) return { priceCents: 1500, priceLabel: '$15', deliveryDays: '2 days', decision: 'Accept' }
  if (h <= 5) return { priceCents: 3500, priceLabel: '$20-50', deliveryDays: '3 days', decision: 'Accept (surcharge)' }
  if (h <= 10) return { priceCents: 7500, priceLabel: '$50-100', deliveryDays: '5 days', decision: 'Accept (2 reviewers)' }
  return { priceCents: 0, priceLabel: '--', deliveryDays: '--', decision: 'Refer out' }
}

const suggestion = computed(() => suggest(props.hours))

const autoApplied = ref(false)

watch(() => props.hours, (h) => {
  autoApplied.value = false
  const s = suggest(h)
  if (s && s.priceCents > 0 && !autoApplied.value) {
    emit('update:modelValue', s.priceCents)
    autoApplied.value = true
  }
}, { immediate: true })

function onHoursInput(val: string) {
  const num = val === '' ? null : Number(val)
  emit('update:hours', num)
}

function onPriceInput(val: string) {
  const cents = Math.round(Number(val) * 100)
  if (!isNaN(cents)) emit('update:modelValue', cents)
}
</script>

<template>
  <div class="mp-price-suggestion">
    <!-- Hours input -->
    <div class="mp-input-group">
      <label class="mp-label" for="price-hours">Estimated hours</label>
      <input
        id="price-hours"
        type="number"
        min="0"
        step="0.5"
        class="mp-input mp-input-sm"
        :value="hours ?? ''"
        placeholder="0"
        @input="onHoursInput(($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Auto suggestion card -->
    <div v-if="suggestion" class="mp-suggestion-card">
      <div class="mp-suggestion-header">
        <span class="mp-suggestion-label">Suggested Price</span>
        <span class="mp-suggestion-decision" :class="suggestion.decision === 'Refer out' ? 'mp-decision-danger' : 'mp-decision-safe'">
          {{ suggestion.decision }}
        </span>
      </div>
      <div class="mp-suggestion-price">{{ suggestion.priceLabel }}</div>
      <div class="mp-suggestion-delivery">
        <AppIcon name="clock" :size="14" />
        <span>Delivery: {{ suggestion.deliveryDays }}</span>
      </div>
    </div>

    <!-- Price override -->
    <div class="mp-input-group">
      <label class="mp-label" for="price-override">Price (USD)</label>
      <p class="mp-help">Auto-suggested; you can override.</p>
      <div class="mp-price-input-wrapper">
        <span class="mp-price-prefix">$</span>
        <input
          id="price-override"
          type="number"
          min="0"
          step="0.01"
          class="mp-input mp-input-sm"
          :value="modelValue ? (modelValue / 100).toFixed(2) : ''"
          placeholder="0.00"
          @input="onPriceInput(($event.target as HTMLInputElement).value)"
        />
      </div>
      <p class="mp-help">Stored as {{ formatCents(modelValue) }}</p>
    </div>
  </div>
</template>

<style scoped>
.mp-price-suggestion {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Share Tech Mono', monospace;
}
.mp-input-group {
  display: flex;
  flex-direction: column;
}
.mp-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--copper);
  margin-bottom: 8px;
}
.mp-input {
  padding: 10px 14px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  color: var(--silver);
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  transition: all 0.3s ease;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-input:focus {
  border-color: var(--rust);
  outline: none;
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-input-sm {
  width: 128px;
}
.mp-help {
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--silver-dim);
}
.mp-suggestion-card {
  padding: 16px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mp-suggestion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mp-suggestion-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--copper);
}
.mp-suggestion-decision {
  font-size: 14px;
  font-weight: 600;
}
.mp-decision-safe {
  color: var(--rust);
}
.mp-decision-danger {
  color: #ff6b6b;
}
.mp-suggestion-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--silver);
}
.mp-suggestion-delivery {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--silver-dim);
}
.mp-price-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mp-price-prefix {
  font-size: 14px;
  font-weight: 600;
  color: var(--silver-dim);
}
</style>
