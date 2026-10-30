<script setup lang="ts">
import type { DuplicateWindowPayload } from '~/types/api'

const props = defineProps<{
  open: boolean
  payload: DuplicateWindowPayload
}>()
const emit = defineEmits<{
  viewExisting: []
  submitAnyway: []
  close: []
}>()
</script>

<template>
  <Modal :open="open" title="You already have a recent request" @close="emit('close')">
    <p class="mp-similar-message">
      We found a request from this email in the last 24 hours:
    </p>
    <div class="mp-similar-card">
      <p class="mp-similar-id">#{{ payload.existing_request.short_id }}</p>
      <p class="mp-similar-status">Status: {{ payload.existing_request.status }}</p>
    </div>
    <p class="mp-similar-hint">
      You can view it or submit a new one if this is a different tool.
    </p>
    <template #footer>
      <NuxtLink
        :to="`/request/track/${payload.existing_request.token}`"
        class="mp-btn mp-btn-primary"
        @click="emit('viewExisting')"
      >View existing request</NuxtLink>
      <button class="mp-btn mp-btn-secondary" @click="emit('submitAnyway')">Submit anyway</button>
    </template>
  </Modal>
</template>

<style scoped>
.mp-similar-message {
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  line-height: 1.7;
  color: var(--silver-dim);
}
.mp-similar-card {
  margin-top: 16px;
  padding: 16px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.2);
}
.mp-similar-id {
  font-family: 'Share Tech Mono', monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--rust);
  text-shadow: 0 0 8px rgba(255, 140, 0, 0.4);
}
.mp-similar-status {
  margin-top: 4px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  color: var(--silver-dim);
}
.mp-similar-hint {
  margin-top: 16px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  color: var(--silver-dim);
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
}
.mp-btn-primary {
  background: linear-gradient(135deg, var(--rust) 0%, #cc7000 100%);
  color: var(--iron);
  border-color: var(--rust);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-btn-secondary {
  background: rgba(74, 107, 124, 0.2);
  color: var(--silver);
  border-color: rgba(74, 107, 124, 0.5);
}
.mp-btn:hover {
  animation: mp-glitch 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.4);
}
@keyframes mp-glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-1px, 1px); }
  40% { transform: translate(1px, -1px); }
  60% { transform: translate(-1px, -1px); }
  80% { transform: translate(1px, 1px); }
}
</style>
