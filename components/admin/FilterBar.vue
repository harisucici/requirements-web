<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: { q: string; status?: string }
  statuses?: { value: string; label: string }[]
}>(), {
  statuses: () => [],
})
const emit = defineEmits<{ 'update:modelValue': [value: { q: string; status?: string }] }>()

function updateQuery(q: string) {
  emit('update:modelValue', { ...props.modelValue, q })
}

function updateStatus(status: string) {
  emit('update:modelValue', { ...props.modelValue, status: status || undefined })
}
</script>

<template>
  <div class="mp-filter-bar">
    <div class="mp-search-wrapper">
      <AppIcon name="search" :size="16" class="mp-search-icon" />
      <input
        type="text"
        class="mp-search-input"
        placeholder="Search..."
        :value="modelValue.q"
        @input="updateQuery(($event.target as HTMLInputElement).value)"
      />
    </div>
    <select
      v-if="statuses.length"
      class="mp-status-select"
      :value="modelValue.status ?? ''"
      @change="updateStatus(($event.target as HTMLSelectElement).value)"
    >
      <option value="">All statuses</option>
      <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
    </select>
  </div>
</template>

<style scoped>
.mp-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-family: 'Share Tech Mono', monospace;
}
.mp-search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}
.mp-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--silver-dim);
  pointer-events: none;
}
.mp-search-input {
  width: 100%;
  padding: 10px 14px 10px 40px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  color: var(--silver);
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  transition: all 0.3s ease;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-search-input::placeholder {
  color: var(--silver-dim);
}
.mp-search-input:focus {
  border-color: var(--rust);
  outline: none;
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-status-select {
  min-width: 160px;
  padding: 10px 14px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  color: var(--silver);
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-status-select:hover, .mp-status-select:focus {
  border-color: var(--rust);
  outline: none;
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
</style>
