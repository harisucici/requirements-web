<script setup lang="ts">
import type { LegalPage } from '~/types/api'
useHead({ title: 'Privacy Policy - request/room' })
const api = useApi()
const { data } = await useAsyncData('legal-privacy-policy', () => api.get<LegalPage>('/legal/privacy-policy'))
</script>

<template>
  <div class="page-container">
    <div class="mechanical-bg"></div>
    <div class="scanline"></div>
    
    <main class="page-content" style="max-width: 900px; padding-top: 3rem">
      <div class="section-header mechanical-enter">
        <div class="corner-bracket tl"></div>
        <div class="corner-bracket tr"></div>
        <h2 class="glitch-title" data-text="PRIVACY POLICY">PRIVACY POLICY</h2>
      </div>

      <div v-if="!data" class="hud-panel p-8">
        <SkeletonLoader type="text" :lines="12" />
      </div>
      
      <LegalDoc v-else :page="data" class="hud-panel mechanical-fade-in p-8" />
    </main>
  </div>
</template>
