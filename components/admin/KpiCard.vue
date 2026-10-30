<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  value: string | number
  icon: string
  trend?: number
  tone?: 'default' | 'warning' | 'danger'
}>(), { tone: 'default' })

const toneColor = computed(() => {
  switch (props.tone) {
    case 'warning': return '#ffaf40'
    case 'danger': return '#ff6b6b'
    default: return '#ff8c00'
  }
})
</script>

<template>
  <div class="mp-kpi-card">
    <div class="mp-kpi-header">
      <span class="mp-kpi-label">{{ label }}</span>
      <AppIcon :name="icon" :size="20" />
    </div>
    <div class="mp-kpi-value">{{ value }}</div>
    <div v-if="trend != null" class="mp-kpi-trend" :style="{ color: toneColor }">
      <AppIcon :name="trend >= 0 ? 'arrow' : 'back'" :size="14" />
      <span>{{ trend >= 0 ? '+' : '' }}{{ trend }}%</span>
      <span class="mp-kpi-comparison">vs last period</span>
    </div>
  </div>
</template>

<style scoped>
.mp-kpi-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.2);
}
.mp-kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mp-kpi-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--copper);
}
.mp-kpi-header svg {
  color: var(--silver-dim);
}
.mp-kpi-value {
  font-family: 'Share Tech Mono', monospace;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--silver);
}
.mp-kpi-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  font-weight: 600;
}
.mp-kpi-comparison {
  font-weight: 400;
  color: var(--silver-dim);
}
</style>
