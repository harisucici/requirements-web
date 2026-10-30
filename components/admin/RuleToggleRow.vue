<script setup lang="ts">
import type { AutomationRule } from '~/types/api'

const props = defineProps<{
  rule: AutomationRule
}>()

const emit = defineEmits<{
  update: [rule: AutomationRule]
}>()

const enabled = ref(props.rule.is_enabled)
const thresholdDays = ref(props.rule.threshold_days ?? '')
const thresholdHours = ref(props.rule.threshold_hours ?? '')

watch(() => props.rule, (r) => {
  enabled.value = r.is_enabled
  thresholdDays.value = r.threshold_days ?? ''
  thresholdHours.value = r.threshold_hours ?? ''
}, { deep: true })

function patch(changes: Partial<AutomationRule>) {
  emit('update', { ...props.rule, ...changes })
}

function onToggle() {
  patch({ is_enabled: enabled.value })
}

function onDaysChange() {
  const val = thresholdDays.value
  patch({ threshold_days: val === '' ? null : Number(val) })
}

function onHoursChange() {
  const val = thresholdHours.value
  patch({ threshold_hours: val === '' ? null : Number(val) })
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: 'mp-priority-p0',
  P1: 'mp-priority-p1',
  P2: 'mp-priority-p2',
}
</script>

<template>
  <div class="mp-rule-row">
    <!-- Code badge -->
    <span class="mp-rule-code">
      {{ rule.code }}
    </span>

    <!-- Description + thresholds -->
    <div class="mp-rule-content">
      <p class="mp-rule-description">{{ rule.description }}</p>
      <div class="mp-rule-thresholds">
        <label class="mp-threshold-label">
          Days
          <input
            type="number"
            min="0"
            class="mp-threshold-input"
            v-model="thresholdDays"
            @change="onDaysChange"
          />
        </label>
        <label class="mp-threshold-label">
          Hours
          <input
            type="number"
            min="0"
            class="mp-threshold-input"
            v-model="thresholdHours"
            @change="onHoursChange"
          />
        </label>
      </div>
    </div>

    <!-- Priority badge -->
    <span
      class="mp-rule-priority"
      :class="PRIORITY_COLORS[rule.priority] ?? PRIORITY_COLORS.P2"
    >
      {{ rule.priority }}
    </span>

    <!-- Toggle -->
    <button
      type="button"
      role="switch"
      :aria-checked="enabled"
      class="mp-toggle"
      :class="enabled ? 'mp-toggle-on' : 'mp-toggle-off'"
      @click="enabled = !enabled; onToggle()"
    >
      <span
        class="mp-toggle-knob"
        :class="enabled ? 'mp-knob-on' : 'mp-knob-off'"
      />
    </button>
  </div>
</template>

<style scoped>
.mp-rule-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  font-family: 'Share Tech Mono', monospace;
  flex-wrap: wrap;
}
.mp-rule-code {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 140, 0, 0.15);
  color: var(--rust);
  border: 1px solid rgba(255, 140, 0, 0.5);
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
  flex-shrink: 0;
}
.mp-rule-content {
  flex: 1;
  min-width: 200px;
}
.mp-rule-description {
  font-size: 14px;
  font-weight: 500;
  color: var(--silver);
}
.mp-rule-thresholds {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}
.mp-threshold-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--silver-dim);
}
.mp-threshold-input {
  width: 64px;
  padding: 4px 8px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: var(--silver);
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(255, 140, 0, 0.3);
  text-align: center;
  transition: all 0.3s ease;
}
.mp-threshold-input:focus {
  border-color: var(--rust);
  outline: none;
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-rule-priority {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
  flex-shrink: 0;
}
.mp-priority-p0 {
  background: rgba(220, 38, 38, 0.2);
  color: #ff6b6b;
  border: 1px solid rgba(220, 38, 38, 0.5);
}
.mp-priority-p1 {
  background: rgba(255, 140, 0, 0.2);
  color: var(--rust);
  border: 1px solid rgba(255, 140, 0, 0.5);
}
.mp-priority-p2 {
  background: rgba(74, 107, 124, 0.2);
  color: var(--copper);
  border: 1px solid rgba(74, 107, 124, 0.5);
}
.mp-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}
.mp-toggle-on {
  background: var(--rust);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.6);
}
.mp-toggle-off {
  background: rgba(74, 107, 124, 0.3);
}
.mp-toggle-knob {
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--iron);
  border-radius: 50%;
  transition: transform 0.3s ease;
}
.mp-knob-on {
  transform: translateX(20px);
}
.mp-knob-off {
  transform: translateX(2px);
}
</style>
