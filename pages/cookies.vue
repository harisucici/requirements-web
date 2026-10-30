<script setup lang="ts">
import type { LegalPage } from '~/types/api'
useHead({ title: 'Cookie Policy - request/room' })
const api = useApi()
const { data } = await useAsyncData('legal-cookie-policy', () => api.get<LegalPage>('/legal/cookie-policy'))
</script>

<template>
  <main class="mx-auto max-w-4xl px-5 pb-20 pt-12 lg:px-8">
    <SkeletonLoader v-if="!data" type="text" :lines="12" />
    <LegalDoc v-else :page="data" />
  </main>
</template>
