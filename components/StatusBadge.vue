<script setup lang="ts">
import type { RequestStatus } from '~/types/api'
import { STATUS_META } from '~/utils/status'

const props = withDefaults(defineProps<{
  status: RequestStatus
  substatus?: string | null
  size?: 'sm' | 'md'
}>(), { size: 'md', substatus: null })

const meta = computed(() => STATUS_META[props.status] ?? STATUS_META.pending)
// P0: price_adjusted degrades to approved + substatus (Q9); show the repriced label.
const label = computed(() =>
  props.status === 'approved' && props.substatus === 'awaiting_price_confirmation'
    ? STATUS_META.price_adjusted.label
    : meta.value.label,
)
const color = computed(() =>
  props.status === 'approved' && props.substatus === 'awaiting_price_confirmation'
    ? STATUS_META.price_adjusted.textColor
    : meta.value.textColor,
)
const bg = computed(() =>
  props.status === 'approved' && props.substatus === 'awaiting_price_confirmation'
    ? STATUS_META.price_adjusted.bg
    : meta.value.bg,
)
</script>

<template>
  <span
    class="mp-status-badge"
    :class="size === 'sm' ? 'mp-badge-sm' : 'mp-badge-md'"
    :style="{ color, backgroundColor: bg, borderColor: color }"
  >
    <AppIcon :name="meta.icon" :size="size === 'sm' ? 12 : 14" />
    <span>{{ label }}</span>
  </span>
</template>

<style scoped>
.mp-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Share Tech Mono', monospace;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid;
  clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
  box-shadow: 0 0 8px currentColor;
}
.mp-badge-sm {
  padding: 2px 10px;
  font-size: 11px;
}
.mp-badge-md {
  padding: 6px 14px;
  font-size: 13px;
}
</style>
