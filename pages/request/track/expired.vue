<script setup lang="ts">
useHead({ title: 'Link expired - request/room' })
</script>

<template>
  <main class="mx-auto max-w-3xl px-5 pb-20 pt-20">
    <EmptyState
      title="This link has expired"
      description="This tracking link is no longer active. If you have a request ID, contact us at hello@requestroom.com and we'll help you access your request."
      icon="clock"
    >
      <div class="mt-6 flex flex-wrap justify-center gap-4">
        <a href="mailto:hello@requestroom.com" class="btn btn-secondary">Contact support</a>
        <NuxtLink to="/request" class="btn btn-primary">Submit a new request</NuxtLink>
      </div>
    </EmptyState>
  </main>
</template>
