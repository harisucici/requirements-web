<script setup lang="ts">
defineProps<{
  columns: {
    stage: string
    label: string
    cards: any[]
  }[]
}>()

const emit = defineEmits<{
  move: [requestId: string, fromStage: string, toStage: string]
}>()

const dragOverColumn = ref<string | null>(null)
const draggedRequestId = ref<string | null>(null)
const draggedFromStage = ref<string>('')

function onDragStart(e: DragEvent, stage: string) {
  const id = e.dataTransfer?.getData('text/plain') ?? ''
  // The card component sets data; we just track state for the board.
  draggedFromStage.value = stage
}

function onDragOver(e: DragEvent, stage: string) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverColumn.value = stage
}

function onDragLeave(stage: string) {
  if (dragOverColumn.value === stage) dragOverColumn.value = null
}

function onDrop(e: DragEvent, toStage: string) {
  e.preventDefault()
  dragOverColumn.value = null
  const requestId = e.dataTransfer?.getData('text/plain')
  const fromStage = e.dataTransfer?.getData('application/x-stage')
  if (requestId && fromStage && fromStage !== toStage) {
    emit('move', requestId, fromStage, toStage)
  }
}

function onDragEnd() {
  dragOverColumn.value = null
  draggedRequestId.value = null
  draggedFromStage.value = ''
}
</script>

<template>
  <div class="mp-kanban-board">
    <div
      v-for="col in columns"
      :key="col.stage"
      class="mp-kanban-column"
      :class="{ 'mp-column-hover': dragOverColumn === col.stage }"
      @dragover="onDragOver($event, col.stage)"
      @dragleave="onDragLeave(col.stage)"
      @drop="onDrop($event, col.stage)"
      @dragend="onDragEnd"
    >
      <!-- Column header -->
      <div class="mp-column-header">
        <h3 class="mp-column-title">{{ col.label }}</h3>
        <span class="mp-column-count">
          {{ col.cards.length }}
        </span>
      </div>

      <!-- Cards -->
      <div class="mp-column-cards">
        <AdminKanbanCard
          v-for="card in col.cards"
          :key="card.short_id ?? card.id"
          :request="card"
          @start="$emit('move', card.short_id ?? card.id, col.stage, col.stage)"
        />
        <div
          v-if="col.cards.length === 0"
          class="mp-column-empty"
        >
          Drop cards here
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mp-kanban-board {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
}
@media (min-width: 768px) {
  .mp-kanban-board {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1280px) {
  .mp-kanban-board {
    grid-template-columns: repeat(4, 1fr);
  }
}
.mp-kanban-column {
  min-height: 400px;
  padding: 12px;
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(255, 140, 0, 0.2);
  transition: all 0.3s ease;
}
.mp-column-hover {
  border-color: var(--rust);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.3);
}
.mp-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}
.mp-column-title {
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--copper);
}
.mp-column-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  background: rgba(74, 107, 124, 0.2);
  color: var(--copper);
  border: 1px solid rgba(74, 107, 124, 0.5);
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
.mp-column-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mp-column-empty {
  padding: 24px;
  text-align: center;
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  color: var(--silver-dim);
  background: var(--iron);
  border: 1px dashed rgba(255, 140, 0, 0.3);
}
</style>
