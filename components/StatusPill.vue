<script setup lang="ts">
// Deprecated wrapper kept for existing pages; use <StatusBadge> in new code.
import type { RequestStatus } from '~/types/api'
defineProps<{ status: RequestStatus | string }>()
</script>

<template>
  <span class="mp-status-pill">
    <StatusBadge :status="(status as RequestStatus)" size="sm" />
  </span>
</template>

<style scoped>
.mp-status-pill {
  display: inline-flex;
  font-family: 'Share Tech Mono', monospace;
}
</style>
