<script setup lang="ts">
const props = defineProps<{
  tags: string[]
}>()

const RISKY_KEYWORDS = ['backend', 'database', 'auth', 'payment', 'api', 'security', 'migration', 'third-party', 'webhook', 'cron']

function isRisky(tag: string): boolean {
  const lower = tag.toLowerCase()
  return RISKY_KEYWORDS.some(kw => lower.includes(kw))
}
</script>

<template>
  <div v-if="tags.length" class="mp-risk-tags">
    <span
      v-for="tag in tags"
      :key="tag"
      class="mp-risk-tag"
      :class="isRisky(tag) ? 'mp-risk-danger' : 'mp-risk-safe'"
    >
      <AppIcon v-if="isRisky(tag)" name="alert" :size="12" />
      {{ tag }}
    </span>
  </div>
  <span v-else class="mp-risk-empty">No risk tags</span>
</template>

<style scoped>
.mp-risk-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-family: 'Share Tech Mono', monospace;
}
.mp-risk-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
.mp-risk-safe {
  background: rgba(255, 140, 0, 0.15);
  color: var(--rust);
  border: 1px solid rgba(255, 140, 0, 0.5);
}
.mp-risk-danger {
  background: rgba(220, 38, 38, 0.15);
  color: #ff6b6b;
  border: 1px solid rgba(220, 38, 38, 0.5);
}
.mp-risk-empty {
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  color: var(--silver-dim);
}
</style>
