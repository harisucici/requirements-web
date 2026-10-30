<script setup lang="ts">
import type { LegalPage } from '~/types/api'

defineProps<{ page: LegalPage }>()
</script>

<template>
  <article class="mp-legal-doc">
    <p class="mp-legal-eyebrow">Legal</p>
    <h1 class="mp-legal-title">{{ page.title }}</h1>
    <p class="mp-legal-date">Last updated: {{ new Date(page.updated_at).toLocaleDateString('en-US', { dateStyle: 'long' }) }}</p>
    <div class="mp-legal-content">
      <section v-for="(section, idx) in page.sections" :key="idx" class="mp-legal-section">
        <h2 class="mp-legal-heading">{{ section.heading }}</h2>
        <div class="mp-legal-body" style="white-space: pre-line;">{{ section.body }}</div>
      </section>
    </div>
  </article>
</template>

<style scoped>
.mp-legal-doc {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Share Tech Mono', monospace;
}
.mp-legal-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--copper);
  margin-bottom: 12px;
}
.mp-legal-title {
  font-size: 36px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--silver);
  margin-top: 12px;
}
.mp-legal-date {
  margin-top: 8px;
  font-size: 14px;
  color: var(--silver-dim);
}
.mp-legal-content {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.mp-legal-section {
  border-left: 2px solid rgba(255, 140, 0, 0.3);
  padding-left: 20px;
}
.mp-legal-heading {
  font-size: 20px;
  font-weight: 600;
  color: var(--rust);
  letter-spacing: 0.02em;
}
.mp-legal-body {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--silver-dim);
}
</style>
