<script setup lang="ts">
import type { RequestStatus } from '~/types/api'
import { formatRelative } from '~/utils/format'

defineProps<{
  entries: {
    from_status: RequestStatus | null
    to_status: RequestStatus
    actor_name: string
    reason: string | null
    created_at: string
  }[]
}>()
</script>

<template>
  <div class="mp-history-timeline">
    <!-- Vertical line -->
    <div class="mp-timeline-line" />

    <div class="mp-timeline-entries">
      <div
        v-for="(entry, idx) in entries"
        :key="idx"
        class="mp-timeline-entry"
      >
        <!-- Dot node -->
        <div class="mp-timeline-node">
          <AppIcon name="flag" :size="16" />
        </div>

        <!-- Content card -->
        <div class="mp-timeline-card">
          <div class="mp-timeline-statuses">
            <StatusBadge v-if="entry.from_status" :status="entry.from_status" size="sm" />
            <AppIcon v-if="entry.from_status" name="arrow" :size="14" class="mp-timeline-arrow" />
            <StatusBadge :status="entry.to_status" size="sm" />
          </div>
          <div class="mp-timeline-meta">
            <span class="mp-timeline-actor">{{ entry.actor_name }}</span>
            <span class="mp-timeline-time">{{ formatRelative(entry.created_at) }}</span>
          </div>
          <p v-if="entry.reason" class="mp-timeline-reason">{{ entry.reason }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mp-history-timeline {
  position: relative;
  font-family: 'Share Tech Mono', monospace;
}
.mp-timeline-line {
  position: absolute;
  left: 19px;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: rgba(255, 140, 0, 0.3);
}
.mp-timeline-entries {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.mp-timeline-entry {
  position: relative;
  display: flex;
  gap: 16px;
}
.mp-timeline-node {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  color: var(--rust);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-timeline-card {
  flex: 1;
  min-width: 0;
  padding: 16px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-timeline-statuses {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.mp-timeline-arrow {
  color: var(--silver-dim);
}
.mp-timeline-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
}
.mp-timeline-actor {
  font-weight: 600;
  color: var(--silver);
}
.mp-timeline-time {
  color: var(--silver-dim);
}
.mp-timeline-reason {
  margin-top: 4px;
  font-size: 13px;
  color: var(--silver-dim);
}
</style>
