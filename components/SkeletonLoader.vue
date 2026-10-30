<script setup lang="ts">
withDefaults(defineProps<{ lines?: number; type?: 'text' | 'card' | 'table' | 'panel' }>(), { lines: 3, type: 'text' })
</script>

<template>
  <div aria-hidden="true" class="space-y-3 relative overflow-hidden cp-scanlines">
    <template v-if="type === 'text'">
      <div v-for="i in lines" :key="i" class="cp-skeleton-bar h-4 relative" :style="{ width: i === lines ? '60%' : '100%' }"></div>
    </template>
    <template v-else-if="type === 'card'">
      <div v-for="i in lines" :key="i" class="cp-skeleton-bar h-28 w-full relative"></div>
    </template>
    <template v-else-if="type === 'table'">
      <div class="cp-skeleton-bar h-10 w-full relative"></div>
      <div v-for="i in lines" :key="i" class="cp-skeleton-bar h-12 w-full relative"></div>
    </template>
    <template v-else>
      <div class="cp-skeleton-bar h-64 w-full relative"></div>
    </template>
  </div>
  <span class="sr-only" role="status">Loading…</span>
</template>

<style scoped>
@import '~/assets/cyberpunk.css';

.cp-skeleton-bar {
  background: linear-gradient(90deg, var(--iron) 0%, #2a2a2a 50%, var(--iron) 100%);
  background-size: 200% 100%;
  animation: cp-skeleton-sweep 2s ease-in-out infinite;
  border: 1px solid rgba(255, 140, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.cp-skeleton-bar::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(255, 140, 0, 0.05) 0px,
    rgba(255, 140, 0, 0.05) 1px,
    transparent 1px,
    transparent 3px
  );
}
</style>
