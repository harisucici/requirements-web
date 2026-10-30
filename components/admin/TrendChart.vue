<script setup lang="ts">
const props = withDefaults(defineProps<{
  data: { date: string; value: number }[]
  label?: string
}>(), { label: '' })

const CHART_WIDTH = 600
const CHART_HEIGHT = 200
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 }

const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

const maxVal = computed(() => Math.max(...props.data.map(d => d.value), 1))
const minVal = computed(() => Math.min(...props.data.map(d => d.value), 0))
const range = computed(() => maxVal.value - minVal.value || 1)

const points = computed(() => {
  const count = props.data.length
  if (count === 0) return ''
  return props.data.map((d, i) => {
    const x = PADDING.left + (i / Math.max(count - 1, 1)) * plotWidth
    const y = PADDING.top + plotHeight - ((d.value - minVal.value) / range.value) * plotHeight
    return `${x},${y}`
  }).join(' ')
})

const polylineFill = computed(() => {
  const count = props.data.length
  if (count === 0) return ''
  const first = PADDING.left
  const last = PADDING.left + ((count - 1) / Math.max(count - 1, 1)) * plotWidth
  const bottom = PADDING.top + plotHeight
  return `${first},${bottom} ${points.value} ${last},${bottom}`
})

/** Y-axis ticks (up to 5). */
const yTicks = computed(() => {
  const ticks: { value: number; y: number }[] = []
  const step = range.value / 4
  for (let i = 0; i <= 4; i++) {
    const val = minVal.value + step * i
    const y = PADDING.top + plotHeight - ((val - minVal.value) / range.value) * plotHeight
    ticks.push({ value: Math.round(val), y })
  }
  return ticks
})

/** X-axis labels (first, middle, last). */
const xLabels = computed(() => {
  const count = props.data.length
  if (count === 0) return []
  const indices = count <= 3
    ? props.data.map((_, i) => i)
    : [0, Math.floor(count / 2), count - 1]
  return indices.map(i => ({
    x: PADDING.left + (i / Math.max(count - 1, 1)) * plotWidth,
    label: props.data[i]!.date,
  }))
})
</script>

<template>
  <div class="mp-trend-chart">
    <span v-if="label" class="mp-chart-label">{{ label }}</span>
    <svg :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`" class="mp-chart-svg" role="img" :aria-label="label || 'Trend chart'">
      <!-- Grid lines -->
      <line
        v-for="tick in yTicks"
        :key="tick.value"
        :x1="PADDING.left"
        :y1="tick.y"
        :x2="CHART_WIDTH - PADDING.right"
        :y2="tick.y"
        stroke="rgba(255, 140, 0, 0.1)"
        stroke-width="1"
        stroke-dasharray="4 4"
      />

      <!-- Area fill -->
      <polygon
        v-if="polylineFill"
        :points="polylineFill"
        fill="rgba(255, 140, 0, 0.1)"
      />

      <!-- Polyline -->
      <polyline
        v-if="points"
        :points="points"
        fill="none"
        stroke="#ff8c00"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-linecap="round"
        filter="drop-shadow(0 0 4px rgba(255, 140, 0, 0.4))"
      />

      <!-- Data dots -->
      <g v-for="(d, i) in data" :key="i">
        <circle
          :cx="PADDING.left + (i / Math.max(data.length - 1, 1)) * plotWidth"
          :cy="PADDING.top + plotHeight - ((d.value - minVal) / range) * plotHeight"
          r="3.5"
          fill="#ff8c00"
          filter="drop-shadow(0 0 3px rgba(255, 140, 0, 0.6))"
        />
      </g>

      <!-- Y-axis labels -->
      <text
        v-for="tick in yTicks"
        :key="'y-' + tick.value"
        :x="PADDING.left - 8"
        :y="tick.y + 4"
        text-anchor="end"
        class="mp-axis-label"
      >
        {{ tick.value }}
      </text>

      <!-- X-axis labels -->
      <text
        v-for="xl in xLabels"
        :key="xl.label"
        :x="xl.x"
        :y="CHART_HEIGHT - 8"
        text-anchor="middle"
        class="mp-axis-label"
      >
        {{ xl.label }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
.mp-trend-chart {
  padding: 20px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.2);
}
.mp-chart-label {
  display: block;
  margin-bottom: 12px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--copper);
}
.mp-chart-svg {
  width: 100%;
}
.mp-axis-label {
  fill: var(--silver-dim);
  font-size: 10px;
  font-family: 'Share Tech Mono', monospace;
}
</style>
