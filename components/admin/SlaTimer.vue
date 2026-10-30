<script setup lang="ts">
const props = withDefaults(defineProps<{
  dueAt: string
  label?: string
}>(), { label: 'SLA' })

const { text, overdue } = useCountdown(() => props.dueAt)

/** Color based on remaining time thresholds. */
const urgencyColor = computed(() => {
  if (overdue.value) return '#ff6b6b'
  const diff = new Date(props.dueAt).getTime() - Date.now()
  const hours = diff / 3600000
  if (hours <= 2) return '#ff6b6b'
  if (hours <= 6) return '#ffaf40'
  return '#ff8c00'
})
</script>

<template>
  <div class="mp-sla-timer">
    <AppIcon name="clock" :size="16" :style="{ color: urgencyColor }" />
    <div class="mp-sla-content">
      <span class="mp-sla-label">{{ label }}</span>
      <span class="mp-sla-value" :style="{ color: urgencyColor }">
        {{ text }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.mp-sla-timer {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'Share Tech Mono', monospace;
}
.mp-sla-content {
  display: flex;
  flex-direction: column;
}
.mp-sla-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--copper);
}
.mp-sla-value {
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 0 8px currentColor;
}
</style>
