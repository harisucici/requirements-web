<script setup lang="ts">
import type { TrackAction } from '~/types/api'
import { ACTION_META } from '~/utils/status'

const props = defineProps<{
  actions: TrackAction[]
  token: string
  shortId: string
}>()

const emit = defineEmits<{ action: [TrackAction] }>()

function hrefFor(action: TrackAction): string {
  const { token, shortId } = props
  switch (action) {
    case 'pay': return `/request/${shortId}/pay?token=${token}`
    case 'answer_questions': return `/request/track/${token}/clarify`
    case 'accept_new_price': return `/request/track/${token}/clarify?decision=accept`
    case 'reject_new_price': return `/request/track/${token}/cancel?decision=reject`
    case 'cancel_request': return `/request/track/${token}/cancel`
    case 'view_tool': return `/request/track/${token}/delivery`
    case 'leave_feedback': return `/request/track/${token}/feedback`
    case 'edit_feedback': return `/request/track/${token}/feedback?edit=1`
    case 'request_modification': return `/request/track/${token}/modify`
    case 'request_refund': return `/request/track/${token}/cancel?refund=1`
    default: return '#'
  }
}

function variantClass(action: TrackAction): string {
  const meta = ACTION_META[action]
  if (!meta) return 'mp-btn-secondary'
  switch (meta.variant) {
    case 'primary': return 'mp-btn-primary'
    case 'secondary': return 'mp-btn-secondary'
    case 'danger': return 'mp-btn-danger'
    case 'ghost': return 'mp-btn-ghost'
    default: return 'mp-btn-secondary'
  }
}

/** rush_upgrade has no page — it is handled in-place by the parent (R-307). */
const isEvent = (a: TrackAction) => a === 'rush_upgrade'
</script>

<template>
  <div class="mp-action-bar" role="group" aria-label="Available actions">
    <template v-for="action in actions" :key="action">
      <button v-if="isEvent(action)" type="button" class="mp-btn" :class="variantClass(action)" @click="emit('action', action)">
        {{ ACTION_META[action]?.label ?? action }}
      </button>
      <NuxtLink v-else :to="hrefFor(action)" class="mp-btn" :class="variantClass(action)">
        {{ ACTION_META[action]?.label ?? action }}
      </NuxtLink>
    </template>
  </div>
</template>

<style scoped>
.mp-action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.mp-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  border: 1px solid rgba(255, 140, 0, 0.3);
  background: var(--iron);
  color: var(--silver);
}
.mp-btn:hover {
  animation: mp-glitch 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.4);
}
.mp-btn-primary {
  background: linear-gradient(135deg, var(--rust) 0%, #cc7000 100%);
  color: var(--iron);
  border-color: var(--rust);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-btn-primary:hover {
  background: linear-gradient(135deg, #ff9f20 0%, var(--rust) 100%);
}
.mp-btn-secondary {
  background: rgba(74, 107, 124, 0.2);
  color: var(--silver);
  border-color: rgba(74, 107, 124, 0.5);
}
.mp-btn-secondary:hover {
  background: rgba(74, 107, 124, 0.4);
}
.mp-btn-danger {
  background: rgba(220, 38, 38, 0.2);
  color: #ff6b6b;
  border-color: rgba(220, 38, 38, 0.5);
}
.mp-btn-danger:hover {
  background: rgba(220, 38, 38, 0.4);
  box-shadow: 0 0 15px rgba(220, 38, 38, 0.4);
}
.mp-btn-ghost {
  background: transparent;
  color: var(--silver);
  border: 1px solid rgba(255, 140, 0, 0.2);
}
.mp-btn-ghost:hover {
  border-color: rgba(255, 140, 0, 0.6);
}
.mp-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  animation: none;
}
@keyframes mp-glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-1px, 1px); }
  40% { transform: translate(1px, -1px); }
  60% { transform: translate(-1px, -1px); }
  80% { transform: translate(1px, 1px); }
}
</style>
