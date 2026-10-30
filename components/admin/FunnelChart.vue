<script setup lang="ts">
const props = defineProps<{
  stages: { stage: string; value: number }[]
}>()

const CHART_WIDTH = 400
const CHART_HEIGHT = 300
const STAGE_GAP = 8

const maxValue = computed(() => Math.max(...props.stages.map(s => s.value), 1))

const stageGeometry = computed(() => {
  const count = props.stages.length
  if (count === 0) return []
  const stageHeight = (CHART_HEIGHT - STAGE_GAP * (count - 1)) / count
  return props.stages.map((s, i) => {
    const widthRatio = s.value / maxValue.value
    const nextRatio = i < count - 1
      ? props.stages[i + 1]!.value / maxValue.value
      : widthRatio * 0.6
    const topWidth = widthRatio * CHART_WIDTH
    const bottomWidth = nextRatio * CHART_WIDTH
    const y = i * (stageHeight + STAGE_GAP)
    const topLeft = (CHART_WIDTH - topWidth) / 2
    const topRight = topLeft + topWidth
    const bottomLeft = (CHART_WIDTH - bottomWidth) / 2
    const bottomRight = bottomLeft + bottomWidth
    return {
      stage: s.stage,
      value: s.value,
      points: `${topLeft},${y} ${topRight},${y} ${bottomRight},${y + stageHeight} ${bottomLeft},${y + stageHeight}`,
      centerY: y + stageHeight / 2,
      conversion: i > 0
        ? Math.round((s.value / props.stages[i - 1]!.value) * 100)
        : 100,
    }
  })
})

const COLORS = ['#ff8c00', '#ff9f20', '#ffaf40', '#ffbf60', '#ffcf80', '#ffdf9f']
</script>

<template>
  <div class="mp-funnel-chart">
    <svg :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`" class="mp-funnel-svg" role="img" aria-label="Conversion funnel chart">
      <g v-for="(geo, idx) in stageGeometry" :key="geo.stage">
        <!-- Trapezoid -->
        <polygon
          :points="geo.points"
          :fill="COLORS[idx % COLORS.length]"
          opacity="0.85"
        />
        <!-- Stage label + value -->
        <text
          :x="CHART_WIDTH / 2"
          :y="geo.centerY - 4"
          text-anchor="middle"
          class="mp-funnel-label"
        >
          {{ geo.stage }}
        </text>
        <text
          :x="CHART_WIDTH / 2"
          :y="geo.centerY + 14"
          text-anchor="middle"
          class="mp-funnel-value"
        >
          {{ geo.value }}
          <template v-if="idx > 0"> ({{ geo.conversion }}%)</template>
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.mp-funnel-chart {
  padding: 20px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.2);
}
.mp-funnel-svg {
  width: 100%;
}
.mp-funnel-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  fill: var(--iron);
}
.mp-funnel-value {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  fill: rgba(26, 26, 26, 0.8);
}
</style>
