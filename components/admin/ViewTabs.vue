<script setup lang="ts">
defineProps<{
  tabs: { key: string; label: string; count?: number }[]
  modelValue: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <nav class="mp-view-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      role="tab"
      :aria-selected="modelValue === tab.key"
      class="mp-tab-btn"
      :class="{ 'mp-tab-active': modelValue === tab.key }"
      @click="emit('update:modelValue', tab.key)"
    >
      <span class="mp-tab-content">
        {{ tab.label }}
        <span
          v-if="tab.count != null"
          class="mp-tab-count"
          :class="{ 'mp-count-active': modelValue === tab.key }"
        >
          {{ tab.count }}
        </span>
      </span>
      <span
        v-if="modelValue === tab.key"
        class="mp-tab-indicator"
      />
    </button>
  </nav>
</template>

<style scoped>
.mp-view-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid rgba(255, 140, 0, 0.2);
}
.mp-tab-btn {
  position: relative;
  padding: 12px 16px;
  background: none;
  border: none;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--silver-dim);
  cursor: pointer;
  transition: all 0.3s ease;
}
.mp-tab-btn:hover {
  color: var(--silver);
}
.mp-tab-active {
  color: var(--rust);
}
.mp-tab-content {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mp-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(74, 107, 124, 0.2);
  color: var(--copper);
  border: 1px solid rgba(74, 107, 124, 0.5);
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
.mp-count-active {
  background: rgba(255, 140, 0, 0.2);
  color: var(--rust);
  border-color: rgba(255, 140, 0, 0.5);
}
.mp-tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--rust);
  box-shadow: 0 0 8px rgba(255, 140, 0, 0.6);
}
</style>
