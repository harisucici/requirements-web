<script setup lang="ts">
withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  loading?: boolean
}>(), { confirmLabel: 'Confirm', cancelLabel: 'Go back', variant: 'default', loading: false })
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <Modal :open="open" :title="title" size="sm" @close="emit('cancel')">
    <p class="mp-confirm-message">{{ message }}</p>
    <slot />
    <template #footer>
      <button class="mp-btn mp-btn-secondary" :disabled="loading" @click="emit('cancel')">{{ cancelLabel }}</button>
      <button class="mp-btn" :class="variant === 'danger' ? 'mp-btn-danger' : 'mp-btn-primary'" :disabled="loading" @click="emit('confirm')">
        <AppIcon v-if="loading" name="spinner" :size="15" class="animate-spin" />
        {{ confirmLabel }}
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.mp-confirm-message {
  line-height: 1.7;
  color: var(--silver-dim);
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
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
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  border: 1px solid rgba(255, 140, 0, 0.3);
  background: var(--iron);
  color: var(--silver);
}
.mp-btn:hover:not(:disabled) {
  animation: mp-glitch 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.4);
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
.mp-btn-danger {
  background: rgba(220, 38, 38, 0.2);
  color: #ff6b6b;
  border-color: rgba(220, 38, 38, 0.5);
}
.mp-btn:disabled { opacity: 0.4; cursor: not-allowed; animation: none; }
@keyframes mp-glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-1px, 1px); }
  40% { transform: translate(1px, -1px); }
  60% { transform: translate(-1px, -1px); }
  80% { transform: translate(1px, 1px); }
}
</style>
