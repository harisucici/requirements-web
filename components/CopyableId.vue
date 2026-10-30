<script setup lang="ts">
const props = withDefaults(defineProps<{ value: string; prefix?: string; label?: string }>(), { prefix: '#', label: 'Copy ID' })
const { copied, copy } = useClipboard()
</script>

<template>
  <button
    type="button"
    class="mp-copyable"
    :aria-label="`${label}: ${prefix}${value}`"
    @click="copy(value)"
  >
    <span class="mp-copy-prefix">{{ prefix }}</span><span class="mp-copy-value">{{ value }}</span>
    <span class="mp-copy-status" :class="copied ? 'mp-copied' : ''" role="status">
      <AppIcon :name="copied ? 'check' : 'copy'" :size="13" />
      {{ copied ? 'Copied' : label }}
    </span>
  </button>
</template>

<style scoped>
.mp-copyable {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--silver);
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-copyable:hover {
  border-color: var(--rust);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.3);
}
.mp-copy-prefix {
  color: var(--copper);
}
.mp-copy-value {
  color: var(--rust);
}
.mp-copy-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--silver-dim);
}
.mp-copy-status.mp-copied {
  color: var(--rust);
}
</style>
