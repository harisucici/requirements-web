<script setup lang="ts">
const props = withDefaults(defineProps<{ total: number; page: number; pageSize?: number }>(), { pageSize: 10 })
const emit = defineEmits<{ 'update:page': [number] }>()
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const window = computed(() => {
  const list: number[] = []
  const from = Math.max(1, Math.min(props.page - 2, pages.value - 4))
  const to = Math.min(pages.value, from + 4)
  for (let i = from; i <= to; i++) list.push(i)
  return list
})
const fromItem = computed(() => props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1)
const toItem = computed(() => Math.min(props.page * props.pageSize, props.total))
</script>

<template>
  <nav v-if="total > pageSize" class="mp-pagination" aria-label="Pagination">
    <p class="mp-pagination-info" role="status" aria-atomic="true">
      <span class="mp-led-indicator" />
      Showing {{ fromItem }}–{{ toItem }} of {{ total }}
    </p>
    <div class="mp-pagination-controls">
      <button class="mp-page-btn" :disabled="page <= 1" aria-label="Previous page" @click="emit('update:page', page - 1)">
        <AppIcon name="back" :size="13" />
      </button>
      <button
        v-for="p in window" :key="p"
        class="mp-page-btn" :class="{ 'mp-page-active': p === page }"
        :aria-current="p === page ? 'page' : undefined"
        @click="emit('update:page', p)"
      >{{ p }}</button>
      <button class="mp-page-btn" :disabled="page >= pages" aria-label="Next page" @click="emit('update:page', page + 1)">
        <AppIcon name="arrow" :size="13" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
.mp-pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
}
.mp-pagination-info {
  display: flex;
  align-items: center;
  color: var(--silver-dim);
}
.mp-led-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 8px;
  background: var(--rust);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255, 140, 0, 0.6);
  animation: mp-pulse 2s ease-in-out infinite;
}
@keyframes mp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.mp-pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}
.mp-page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  color: var(--silver);
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
.mp-page-btn:hover:not(:disabled) {
  border-color: var(--rust);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-page-active {
  background: linear-gradient(135deg, var(--rust) 0%, #cc7000 100%);
  color: var(--iron);
  border-color: var(--rust);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.4);
}
.mp-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
