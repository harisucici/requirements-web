<script setup lang="ts">
import { formatRelative } from '~/utils/format'

const props = defineProps<{
  modelValue: {
    key: string
    label: string
    checked: boolean
    checked_by: string | null
    checked_at: string | null
  }[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: typeof props.modelValue] }>()

function toggle(idx: number) {
  const updated = props.modelValue.map((item, i) =>
    i === idx
      ? { ...item, checked: !item.checked, checked_by: !item.checked ? 'current_user' : null, checked_at: !item.checked ? new Date().toISOString() : null }
      : item,
  )
  emit('update:modelValue', updated)
}

const completedCount = computed(() => props.modelValue.filter(i => i.checked).length)
</script>

<template>
  <div class="mp-checklist">
    <div class="mp-checklist-header">
      <span class="mp-checklist-title">Launch Checklist</span>
      <span class="mp-checklist-progress">{{ completedCount }} / {{ modelValue.length }} complete</span>
    </div>

    <!-- Progress bar -->
    <div class="mp-progress-bar">
      <div
        class="mp-progress-fill"
        :style="{ width: `${(completedCount / modelValue.length) * 100}%` }"
      />
    </div>

    <!-- Checklist items -->
    <div class="mp-checklist-items">
      <label
        v-for="(item, idx) in modelValue"
        :key="item.key"
        class="mp-checklist-item"
      >
        <input
          type="checkbox"
          class="mp-checkbox"
          :checked="item.checked"
          @change="toggle(idx)"
        />
        <div class="mp-item-content">
          <span
            class="mp-item-label"
            :class="item.checked ? 'mp-item-checked' : ''"
          >
            {{ item.label }}
          </span>
          <div v-if="item.checked && item.checked_by" class="mp-item-meta">
            {{ item.checked_by }} &middot; {{ formatRelative(item.checked_at ?? '') }}
          </div>
        </div>
        <AppIcon
          :name="item.checked ? 'check-circle' : 'circle'"
          :size="16"
          :class="item.checked ? 'mp-icon-checked' : 'mp-icon-unchecked'"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.mp-checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: 'Share Tech Mono', monospace;
}
.mp-checklist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mp-checklist-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--copper);
}
.mp-checklist-progress {
  font-size: 13px;
  font-weight: 600;
  color: var(--silver-dim);
}
.mp-progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 140, 0, 0.1);
  overflow: hidden;
}
.mp-progress-fill {
  height: 100%;
  background: var(--rust);
  box-shadow: 0 0 8px rgba(255, 140, 0, 0.6);
  transition: width 0.3s ease;
}
.mp-checklist-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mp-checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-checklist-item:hover {
  border-color: var(--rust);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-checkbox {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  accent-color: var(--rust);
  flex-shrink: 0;
}
.mp-item-content {
  flex: 1;
  min-width: 0;
}
.mp-item-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--silver);
}
.mp-item-checked {
  text-decoration: line-through;
  color: var(--silver-dim);
}
.mp-item-meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--silver-dim);
}
.mp-icon-checked {
  color: var(--rust);
}
.mp-icon-unchecked {
  color: rgba(255, 140, 0, 0.3);
}
</style>
