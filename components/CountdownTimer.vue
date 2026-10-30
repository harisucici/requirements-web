<script setup lang="ts">
const props = defineProps<{ dueAt: string | null }>()

const { text, overdue } = useCountdown(() => props.dueAt)
</script>

<template>
  <div v-if="dueAt" class="cp-panel cp-scanlines px-3 py-2 inline-flex items-center gap-2 text-sm font-semibold cp-mono" :class="overdue ? 'text-[var(--cp-red)]' : 'text-[var(--cp-amber)]'">
    <span class="cp-led" :class="overdue ? 'cp-led-red' : 'cp-led-amber'" />
    <AppIcon :name="overdue ? 'alert' : 'clock'" :size="16" />
    <span v-if="overdue">Delayed – new ETA: <ClientOnly>{{ new Date(dueAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) }}</ClientOnly></span>
    <span v-else class="tracking-wider">{{ text }}</span>
  </div>
</template>

<style scoped>
@import '~/assets/cyberpunk.css';
</style>
