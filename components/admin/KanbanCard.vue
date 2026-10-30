<script setup lang="ts">
import { formatRelative } from '~/utils/format'

const props = defineProps<{
  request: {
    short_id: string
    description: string
    assignee_name: string | null
    due_at: string | null
    progress_percent: number
    delay_count: number
    status: string
    dev_stage: string | null
  }
}>()

const emit = defineEmits<{
  start: []
  progress: []
  delay: []
}>()

const truncatedDesc = computed(() => {
  const d = props.request.description
  return d.length > 80 ? d.slice(0, 80) + '...' : d
})

const initial = computed(() => {
  const name = props.request.assignee_name
  return name ? name.charAt(0).toUpperCase() : '?'
})

const dueLabel = computed(() => {
  if (!props.request.due_at) return null
  return formatRelative(props.request.due_at)
})

const isOverdue = computed(() => {
  if (!props.request.due_at) return false
  return new Date(props.request.due_at).getTime() < Date.now()
})

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData('text/plain', props.request.short_id)
  e.dataTransfer?.setData('application/x-stage', props.request.dev_stage ?? '')
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}
</script>

<template>
  <div
    class="mp-kanban-card"
    draggable="true"
    @dragstart="onDragStart"
  >
    <!-- Header: short_id + delay flag -->
    <div class="mp-card-header">
      <span class="mp-card-id">{{ request.short_id }}</span>
      <span
        v-if="request.delay_count > 0"
        class="mp-card-delay"
      >
        <AppIcon name="alert" :size="12" />
        {{ request.delay_count }} delay{{ request.delay_count > 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Description -->
    <p class="mp-card-desc">{{ truncatedDesc }}</p>

    <!-- Progress bar -->
    <div class="mp-progress-bar">
      <div
        class="mp-progress-fill"
        :class="request.progress_percent >= 100 ? 'mp-progress-complete' : 'mp-progress-active'"
        :style="{ width: `${request.progress_percent}%` }"
      />
    </div>

    <!-- Footer: avatar + due chip -->
    <div class="mp-card-footer">
      <div class="mp-avatar-group">
        <div class="mp-avatar">
          {{ initial }}
        </div>
        <span v-if="request.assignee_name" class="mp-assignee-name">
          {{ request.assignee_name }}
        </span>
      </div>
      <span
        v-if="dueLabel"
        class="mp-due-chip"
        :class="isOverdue ? 'mp-due-overdue' : ''"
      >
        <AppIcon name="clock" :size="12" />
        {{ dueLabel }}
      </span>
    </div>

    <!-- Action buttons -->
    <div class="mp-card-actions">
      <button class="mp-action-btn" @click.stop="emit('start')">
        <AppIcon name="play" :size="12" />
      </button>
      <button class="mp-action-btn" @click.stop="emit('progress')">
        <AppIcon name="arrow" :size="12" />
      </button>
      <button class="mp-action-btn mp-action-danger" @click.stop="emit('delay')">
        <AppIcon name="alert" :size="12" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.mp-kanban-card {
  padding: 12px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  cursor: grab;
  transition: all 0.3s ease;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-kanban-card:active {
  cursor: grabbing;
}
.mp-kanban-card:hover {
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.3);
}
.mp-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.mp-card-id {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--rust);
}
.mp-card-delay {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: #ff6b6b;
}
.mp-card-desc {
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
  color: var(--silver);
  margin-bottom: 12px;
}
.mp-progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 140, 0, 0.1);
  overflow: hidden;
  margin-bottom: 12px;
}
.mp-progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}
.mp-progress-complete {
  background: var(--rust);
  box-shadow: 0 0 8px rgba(255, 140, 0, 0.6);
}
.mp-progress-active {
  background: linear-gradient(90deg, var(--rust) 0%, #ffaf40 100%);
}
.mp-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mp-avatar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mp-avatar {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 140, 0, 0.2);
  color: var(--rust);
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
.mp-assignee-name {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: var(--silver-dim);
}
.mp-due-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--silver-dim);
}
.mp-due-overdue {
  color: #ff6b6b;
}
.mp-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 140, 0, 0.2);
}
.mp-action-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: rgba(74, 107, 124, 0.2);
  border: 1px solid rgba(74, 107, 124, 0.5);
  color: var(--silver);
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
.mp-action-btn:hover {
  background: rgba(74, 107, 124, 0.4);
  border-color: var(--copper);
}
.mp-action-danger {
  background: rgba(220, 38, 38, 0.2);
  border-color: rgba(220, 38, 38, 0.5);
  color: #ff6b6b;
}
.mp-action-danger:hover {
  background: rgba(220, 38, 38, 0.4);
  border-color: #ff6b6b;
}
</style>
