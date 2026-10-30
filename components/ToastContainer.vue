<script setup lang="ts">
const { toasts, dismiss } = useToast()
const ICONS = { success: 'check-circle', error: 'x-circle', warning: 'alert', info: 'info' } as const
const TONES = {
  success: 'mp-toast-success',
  error: 'mp-toast-error',
  warning: 'mp-toast-warning',
  info: 'mp-toast-info',
} as const
</script>

<template>
  <div class="mp-toast-container" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts" :key="t.id"
        class="mp-toast"
        :class="TONES[t.type]"
        role="status"
      >
        <AppIcon :name="ICONS[t.type]" :size="18" class="mp-toast-icon" />
        <p class="mp-toast-message">{{ t.message }}</p>
        <button class="mp-toast-close" :aria-label="'Dismiss notification'" @click="dismiss(t.id)">
          <AppIcon name="x" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.mp-toast-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 28rem;
  transform: translateX(-50%);
  padding: 0 16px;
  pointer-events: none;
}
.mp-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  font-family: 'Share Tech Mono', monospace;
  pointer-events: auto;
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.2);
}
.mp-toast-icon {
  flex-shrink: 0;
  margin-top: 2px;
}
.mp-toast-message {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--silver);
}
.mp-toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--silver-dim);
  transition: color 0.3s ease;
}
.mp-toast-close:hover {
  color: var(--silver);
}
.mp-toast-success {
  border-left: 3px solid var(--rust);
}
.mp-toast-success .mp-toast-icon {
  color: var(--rust);
}
.mp-toast-error {
  border-left: 3px solid #ff6b6b;
}
.mp-toast-error .mp-toast-icon {
  color: #ff6b6b;
}
.mp-toast-warning {
  border-left: 3px solid #ffaf40;
}
.mp-toast-warning .mp-toast-icon {
  color: #ffaf40;
}
.mp-toast-info {
  border-left: 3px solid var(--copper);
}
.mp-toast-info .mp-toast-icon {
  color: var(--copper);
}
</style>
