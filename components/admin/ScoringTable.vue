<script setup lang="ts">
import { SCORE_DIMENSIONS, DECISION_HINT_LABELS } from '~/utils/constants'

const props = defineProps<{
  modelValue: {
    feasibility: number
    time: number
    value: number
    capability: number
    risk: number
    complexity_stars: number
    estimated_hours: number | null
  }
}>()
const emit = defineEmits<{ 'update:modelValue': [value: typeof props.modelValue] }>()

const SCORES = [1, 2, 3, 4, 5]

function updateDimension(key: string, val: number) {
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}

function updateComplexity(val: number) {
  emit('update:modelValue', { ...props.modelValue, complexity_stars: val })
}

function updateHours(val: string) {
  const num = val === '' ? null : Number(val)
  emit('update:modelValue', { ...props.modelValue, estimated_hours: num })
}

const weightedTotal = computed(() => {
  let total = 0
  for (const dim of SCORE_DIMENSIONS) {
    const score = (props.modelValue as Record<string, number>)[dim.key] ?? 0
    total += score * dim.weight
  }
  return Math.round(total * 100) / 100
})

const decisionHint = computed(() => {
  const t = weightedTotal.value
  if (t >= 4) return 'accept'
  if (t >= 3) return 'accept_with_surcharge'
  if (t >= 2) return 'discuss'
  return 'reject'
})

const decisionLabel = computed(() => DECISION_HINT_LABELS[decisionHint.value] ?? '')
</script>

<template>
  <div class="mp-scoring-table">
    <table class="mp-table">
      <thead>
        <tr class="mp-table-header">
          <th class="mp-th">Dimension</th>
          <th class="mp-th mp-th-center">Weight</th>
          <th class="mp-th mp-th-center">Score (1-5)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dim in SCORE_DIMENSIONS" :key="dim.key" class="mp-table-row">
          <td class="mp-td mp-td-label">{{ dim.label }}</td>
          <td class="mp-td mp-td-center mp-td-muted">{{ (dim.weight * 100).toFixed(0) }}%</td>
          <td class="mp-td mp-td-center">
            <select
              class="mp-score-select"
              :value="(modelValue as any)[dim.key]"
              @change="updateDimension(dim.key, Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="s in SCORES" :key="s" :value="s">{{ s }}</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Weighted total + recommendation -->
    <div class="mp-scoring-summary">
      <div class="mp-summary-section">
        <span class="mp-summary-label">Weighted Total</span>
        <div class="mp-summary-value">{{ weightedTotal.toFixed(2) }} / 5.00</div>
      </div>
      <div class="mp-summary-section mp-summary-right">
        <span class="mp-summary-label">Recommendation</span>
        <div class="mp-summary-decision" :class="{
          'mp-decision-accept': decisionHint === 'accept',
          'mp-decision-surcharge': decisionHint === 'accept_with_surcharge' || decisionHint === 'discuss',
          'mp-decision-reject': decisionHint === 'reject',
        }">
          {{ decisionLabel }}
        </div>
      </div>
    </div>

    <!-- Complexity stars -->
    <div class="mp-scoring-row">
      <label class="mp-row-label">Complexity</label>
      <div class="mp-stars">
        <button
          v-for="s in 5"
          :key="s"
          type="button"
          class="mp-star-btn"
          :class="s <= modelValue.complexity_stars ? 'mp-star-active' : 'mp-star-inactive'"
          @click="updateComplexity(s)"
        >
          <AppIcon name="star" :size="20" />
        </button>
      </div>
    </div>

    <!-- Estimated hours -->
    <div class="mp-scoring-row">
      <label class="mp-row-label" for="est-hours">Estimated hours</label>
      <input
        id="est-hours"
        type="number"
        min="0"
        step="0.5"
        class="mp-hours-input"
        :value="modelValue.estimated_hours ?? ''"
        placeholder="0"
        @input="updateHours(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<style scoped>
.mp-scoring-table {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Share Tech Mono', monospace;
}
.mp-table {
  width: 100%;
  font-size: 14px;
}
.mp-table-header {
  text-align: left;
  color: var(--silver-dim);
}
.mp-th {
  padding-bottom: 8px;
  font-weight: 600;
}
.mp-th-center {
  text-align: center;
}
.mp-table-row {
  border-top: 1px solid rgba(255, 140, 0, 0.2);
}
.mp-td {
  padding: 10px 0;
}
.mp-td-label {
  font-weight: 500;
  color: var(--silver);
}
.mp-td-center {
  text-align: center;
}
.mp-td-muted {
  color: var(--silver-dim);
}
.mp-score-select {
  width: 80px;
  margin: 0 auto;
  display: block;
  text-align: center;
  padding: 6px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  color: var(--silver);
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  transition: all 0.3s ease;
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
.mp-score-select:focus {
  border-color: var(--rust);
  outline: none;
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-scoring-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-summary-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mp-summary-right {
  text-align: right;
}
.mp-summary-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--copper);
}
.mp-summary-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--silver);
}
.mp-summary-decision {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 600;
}
.mp-decision-accept {
  color: var(--rust);
}
.mp-decision-surcharge {
  color: #ffaf40;
}
.mp-decision-reject {
  color: #ff6b6b;
}
.mp-scoring-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.mp-row-label {
  width: 160px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--copper);
}
.mp-stars {
  display: flex;
  gap: 4px;
}
.mp-star-btn {
  transition: all 0.3s ease;
}
.mp-star-active {
  color: #ffaf40;
}
.mp-star-inactive {
  color: rgba(255, 140, 0, 0.3);
}
.mp-star-btn:hover {
  color: var(--rust);
}
.mp-hours-input {
  width: 112px;
  padding: 10px 14px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  color: var(--silver);
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  transition: all 0.3s ease;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-hours-input:focus {
  border-color: var(--rust);
  outline: none;
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
</style>
