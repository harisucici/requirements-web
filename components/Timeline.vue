<script setup lang="ts">
import type { TimelineEvent, RequestStatus } from '~/types/api'
import { STATUS_META } from '~/utils/status'

const props = defineProps<{ events: TimelineEvent[]; currentStatus: RequestStatus }>()

/** The 6 main user-facing nodes (R-303). */
const MAIN_ORDER: RequestStatus[] = ['pending', 'approved', 'paid', 'in_progress', 'completed']
const MAIN_LABELS: Record<string, string> = {
  pending: 'Submitted',
  approved: 'Approved – Awaiting Payment',
  paid: 'Payment Received',
  in_progress: 'In Development',
  completed: 'Completed',
}

interface TimelineNode {
  key: string
  label: string
  status: RequestStatus
  done: boolean
  current: boolean
  detail: string | null
  timestamp: string | null
  extras: TimelineEvent[]
}

const nodes = computed<TimelineNode[]>(() => {
  const mainEvents = props.events.filter(e => e.is_main_node)
  const extras = props.events.filter(e => !e.is_main_node)

  const statusReached = new Set<RequestStatus>()
  let currentIdx = -1
  for (const evt of mainEvents) {
    statusReached.add(evt.status)
  }
  // Determine current node index
  const currentStatus = props.currentStatus
  if (currentStatus === 'canceled' || currentStatus === 'rejected' || currentStatus === 'needs_clarification' || currentStatus === 'price_adjusted') {
    // Find the last main node that was reached
    for (let i = MAIN_ORDER.length - 1; i >= 0; i--) {
      if (statusReached.has(MAIN_ORDER[i]!)) { currentIdx = i; break }
    }
  } else {
    currentIdx = MAIN_ORDER.indexOf(currentStatus)
  }

  return MAIN_ORDER.map((status, i) => {
    const evt = mainEvents.find(e => e.status === status)
    const nodeExtras = extras.filter(e => {
      // Attach extras to the preceding main node
      const eIdx = MAIN_ORDER.indexOf(e.status)
      return eIdx === i || (eIdx === -1 && MAIN_ORDER.indexOf(status) === i)
    })
    return {
      key: status,
      label: MAIN_LABELS[status] ?? STATUS_META[status]?.label ?? status,
      status,
      done: evt != null && i < currentIdx,
      current: i === currentIdx,
      detail: evt?.detail ?? null,
      timestamp: evt?.timestamp ?? null,
      extras: nodeExtras,
    }
  })
})

const expanded = ref<Record<string, boolean>>({})
function toggle(key: string) { expanded.value[key] = !expanded.value[key] }
</script>

<template>
  <ol class="mp-timeline" aria-label="Request timeline">
    <li v-for="(node, idx) in nodes" :key="node.key" class="mp-timeline-item">
      <!-- connector line -->
      <span
        v-if="idx < nodes.length - 1"
        class="mp-timeline-connector"
        :class="{ 'mp-connector-done': node.done || node.current }"
        aria-hidden="true"
      />
      <!-- marker -->
      <span
        class="mp-timeline-marker"
        :class="{
          'mp-marker-done': node.done,
          'mp-marker-current': node.current,
        }"
        :aria-label="node.done ? 'Completed' : node.current ? 'Current step' : 'Upcoming'"
      >
        <AppIcon v-if="node.done" name="check" :size="14" />
        <span v-else-if="node.current" aria-hidden="true" class="mp-marker-dot" />
        <span v-else aria-hidden="true">○</span>
      </span>
      <!-- content -->
      <div class="mp-timeline-content">
        <button
          class="mp-timeline-toggle"
          :aria-expanded="expanded[node.key] ?? false"
          @click="toggle(node.key)"
        >
          <div>
            <p class="mp-timeline-label" :class="{
              'mp-label-current': node.current,
              'mp-label-done': node.done,
              'mp-label-pending': !node.done && !node.current,
            }">
              {{ node.label }}
            </p>
            <ClientOnly>
              <time v-if="node.timestamp" class="mp-timeline-time">
                {{ new Date(node.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) }}
              </time>
            </ClientOnly>
          </div>
          <AppIcon name="chevron-down" :size="16" class="mp-toggle-chevron" :class="{ 'mp-chevron-open': expanded[node.key] }" />
        </button>
        <div v-if="expanded[node.key] && (node.detail || node.extras.length)" class="mp-timeline-detail">
          <p v-if="node.detail">{{ node.detail }}</p>
          <div v-for="extra in node.extras" :key="extra.id" class="mp-timeline-extra">
            <p><span class="mp-extra-label">{{ extra.label }}</span> — {{ extra.detail }}</p>
            <ClientOnly>
              <time class="mp-extra-time">{{ new Date(extra.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) }}</time>
            </ClientOnly>
          </div>
        </div>
      </div>
    </li>
    <!-- Non-main events that didn't get attached (e.g. canceled, rejected, needs_clarification) -->
    <li v-for="evt in events.filter(e => !e.is_main_node && !MAIN_ORDER.includes(e.status))" :key="evt.id" class="mp-timeline-item">
      <span class="mp-timeline-marker mp-marker-extra">
        <AppIcon :name="STATUS_META[evt.status]?.icon ?? 'info'" :size="14" />
      </span>
      <div class="mp-timeline-content">
        <p class="mp-timeline-label mp-label-done">{{ evt.label }}</p>
        <p v-if="evt.detail" class="mp-timeline-detail-text">{{ evt.detail }}</p>
        <ClientOnly>
          <time class="mp-timeline-time">{{ new Date(evt.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) }}</time>
        </ClientOnly>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.mp-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: 'Share Tech Mono', monospace;
}
.mp-timeline-item {
  position: relative;
  display: flex;
  gap: 16px;
  padding-bottom: 32px;
}
.mp-timeline-item:last-child {
  padding-bottom: 0;
}
.mp-timeline-connector {
  position: absolute;
  left: 15px;
  top: 36px;
  bottom: 0;
  width: 1px;
  background: rgba(255, 140, 0, 0.2);
}
.mp-connector-done {
  background: var(--rust);
  box-shadow: 0 0 8px rgba(255, 140, 0, 0.4);
}
.mp-timeline-marker {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  color: var(--silver-dim);
  font-size: 12px;
  font-weight: 700;
  clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
}
.mp-marker-done {
  background: rgba(255, 140, 0, 0.2);
  border-color: var(--rust);
  color: var(--rust);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-marker-current {
  background: var(--iron);
  border-color: var(--rust);
  color: var(--rust);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.5);
  animation: mp-pulse 2s ease-in-out infinite;
}
.mp-marker-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--rust);
  border-radius: 50%;
}
.mp-marker-extra {
  background: rgba(74, 107, 124, 0.2);
  border-color: rgba(74, 107, 124, 0.5);
  color: var(--copper);
}
@keyframes mp-pulse {
  0%, 100% { box-shadow: 0 0 15px rgba(255, 140, 0, 0.5); }
  50% { box-shadow: 0 0 20px rgba(255, 140, 0, 0.8); }
}
.mp-timeline-content {
  flex: 1;
  min-width: 0;
}
.mp-timeline-toggle {
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.mp-timeline-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--silver);
}
.mp-label-current {
  color: var(--rust);
  text-shadow: 0 0 8px rgba(255, 140, 0, 0.4);
}
.mp-label-done {
  color: var(--silver);
}
.mp-label-pending {
  color: var(--silver-dim);
}
.mp-timeline-time {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--silver-dim);
}
.mp-toggle-chevron {
  margin-top: 4px;
  flex-shrink: 0;
  color: var(--silver-dim);
  transition: transform 0.3s ease;
}
.mp-chevron-open {
  transform: rotate(180deg);
}
.mp-timeline-detail {
  margin-top: 12px;
  border-left: 2px solid rgba(255, 140, 0, 0.3);
  padding-left: 16px;
  font-size: 13px;
  color: var(--silver-dim);
}
.mp-timeline-detail p {
  margin: 0;
}
.mp-timeline-detail-text {
  margin-top: 4px;
  font-size: 13px;
  color: var(--silver-dim);
}
.mp-timeline-extra {
  margin-top: 8px;
  font-size: 12px;
}
.mp-extra-label {
  font-weight: 600;
  color: var(--silver);
}
.mp-extra-time {
  display: block;
  margin-top: 2px;
  color: var(--silver-dim);
}
</style>
