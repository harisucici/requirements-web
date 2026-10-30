<script setup lang="ts" generic="T extends Record<string, any>">
// Generic hand-built table: sortable headers, row click, mobile overflow (UX: table-handling).
export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  class?: string
  render?: (row: T) => string
}

const props = withDefaults(defineProps<{
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyTitle?: string
  emptyDescription?: string
  loading?: boolean
  clickable?: boolean
}>(), { emptyTitle: 'Nothing here yet', emptyDescription: '', loading: false, clickable: true })

const emit = defineEmits<{ rowClick: [T]; sort: [key: string, dir: 'asc' | 'desc'] }>()

const sortKey = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(col: Column<T>) {
  if (!col.sortable) return
  if (sortKey.value === col.key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = col.key; sortDir.value = 'asc' }
  emit('sort', sortKey.value, sortDir.value)
}
</script>

<template>
  <div>
    <div v-if="loading" class="mp-table-loading">
      <SkeletonLoader type="table" :lines="5" />
    </div>
    <EmptyState v-else-if="rows.length === 0" :title="emptyTitle" :description="emptyDescription">
      <slot name="empty-extra" />
    </EmptyState>
    <div v-else class="mp-table-wrapper">
      <table class="mp-table">
        <thead>
          <tr class="mp-table-header-row">
            <th v-for="col in columns" :key="col.key" class="mp-table-header" :class="col.class">
              <button v-if="col.sortable" class="mp-sort-btn" @click="toggleSort(col)">
                {{ col.label }}
                <span aria-hidden="true">{{ sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
              </button>
              <template v-else>{{ col.label }}</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in rows" :key="rowKey(row)"
            class="mp-table-row"
            :class="{ 'mp-row-clickable': clickable }"
            :tabindex="clickable ? 0 : undefined"
            @click="clickable && emit('rowClick', row)"
            @keydown.enter="clickable && emit('rowClick', row)"
            :style="{ animationDelay: `${idx * 50}ms` }"
          >
            <!-- Row scan effect on hover -->
            <div class="mp-row-scan">
              <div class="mp-row-scan-bar" />
            </div>
            <td v-for="col in columns" :key="col.key" class="mp-table-cell" :class="col.class">
              <slot :name="`cell-${col.key}`" :row="row">
                {{ col.render ? col.render(row) : row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.mp-table-loading {
  padding: 20px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-table-wrapper {
  overflow-x: auto;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.2);
}
.mp-table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  text-align: left;
}
.mp-table-header-row {
  border-bottom: 1px solid rgba(255, 140, 0, 0.3);
}
.mp-table-header {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--copper);
}
.mp-sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  color: var(--copper);
  transition: color 0.3s ease;
}
.mp-sort-btn:hover {
  color: var(--rust);
}
.mp-table-row {
  position: relative;
  border-bottom: 1px solid rgba(255, 140, 0, 0.2);
  animation: mp-fade-in 0.3s ease-out both;
}
@keyframes mp-fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.mp-row-clickable {
  cursor: pointer;
  transition: background 0.3s ease;
}
.mp-row-clickable:hover {
  background: rgba(255, 140, 0, 0.08);
}
.mp-row-scan {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.mp-row-clickable:hover .mp-row-scan {
  opacity: 1;
}
.mp-row-scan-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 0, 0.2), transparent);
  animation: mp-row-scan 1.5s linear infinite;
}
@keyframes mp-row-scan {
  0% { left: -30%; }
  100% { left: 100%; }
}
.mp-table-cell {
  position: relative;
  z-index: 10;
  padding: 14px 16px;
  vertical-align: middle;
  color: var(--silver);
}
</style>
