<script setup lang="ts">
const props = defineProps<{ category: string | null | undefined; size?: 'sm' | 'md' }>()
const LABELS: Record<string, string> = {
  bug: 'Bug', feature_request: 'Feature request', ux: 'UX', other: 'Other',
  data_viz: 'Data viz', calculator: 'Calculator', text: 'Text processing', creative: 'Creative tool',
}
const TONES: Record<string, string> = {
  bug: 'mp-tag-bug',
  feature_request: 'mp-tag-feature',
  ux: 'mp-tag-ux',
  other: 'mp-tag-other',
}
const label = computed(() => LABELS[props.category ?? ''] ?? props.category ?? '—')
const tone = computed(() => TONES[props.category ?? ''] ?? 'mp-tag-default')
</script>

<template>
  <span class="mp-category-tag" :class="[tone, size === 'sm' ? 'mp-tag-sm' : 'mp-tag-md']">
    <span class="mp-tag-corner"></span>
    {{ label }}
  </span>
</template>

<style scoped>
.mp-category-tag {
  position: relative;
  display: inline-flex;
  align-items: center;
  font-family: 'Share Tech Mono', monospace;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid rgba(255, 140, 0, 0.3);
  background: var(--iron);
  color: var(--silver);
  clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
}
.mp-tag-sm { padding: 2px 8px; font-size: 0.7rem; }
.mp-tag-md { padding: 4px 12px; font-size: 0.75rem; }
.mp-tag-corner {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 4px;
  height: 4px;
  background: var(--rust);
  border-radius: 50%;
}
.mp-tag-bug { background: rgba(220, 38, 38, 0.15); color: #ff6b6b; border-color: rgba(220, 38, 38, 0.5); }
.mp-tag-bug .mp-tag-corner { background: #ff6b6b; }
.mp-tag-feature { background: rgba(37, 99, 235, 0.15); color: #5b9dff; border-color: rgba(37, 99, 235, 0.5); }
.mp-tag-feature .mp-tag-corner { background: #5b9dff; }
.mp-tag-ux { background: rgba(124, 58, 237, 0.15); color: #a78bfa; border-color: rgba(124, 58, 237, 0.5); }
.mp-tag-ux .mp-tag-corner { background: #a78bfa; }
.mp-tag-other { background: rgba(74, 107, 124, 0.15); color: var(--copper); border-color: rgba(74, 107, 124, 0.5); }
.mp-tag-other .mp-tag-corner { background: var(--copper); }
.mp-tag-default { background: rgba(255, 140, 0, 0.15); color: var(--rust); border-color: rgba(255, 140, 0, 0.5); }
.mp-tag-default .mp-tag-corner { background: var(--rust); }
</style>
