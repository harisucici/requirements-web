<script setup lang="ts">
useHead({ title: 'Request submitted - request/room' })
const route = useRoute()
const shortId = computed(() => String(route.params.shortId))
const token = computed(() => String(route.query.token || ''))
</script>

<template>
  <main class="mx-auto max-w-3xl px-5 pb-20 pt-16 lg:px-8">
    <section class="panel p-8 sm:p-12">
      <div class="grid h-14 w-14 place-items-center rounded-full bg-[var(--green)] text-2xl text-white">
        <AppIcon name="check" :size="24" />
      </div>
      <div class="section-header mechanical-enter mt-8 mb-8">
        <div class="corner-bracket tl"></div>
        <div class="corner-bracket tr"></div>
        <div class="corner-bracket bl"></div>
        <div class="corner-bracket br"></div>
        <span class="screw screw-tl"></span>
        <span class="screw screw-tr"></span>
        <div>
          <div class="data-label">YOU ARE ON YOUR WAY</div>
          <h1 class="glitch-title mt-1" data-text="Request Submitted Successfully!">Request Submitted Successfully!</h1>
        </div>
        <span class="ml-auto status-indicator success"></span>
      </div>
      <p class="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
        We will review your idea and get back to you within 12 hours. Keep this request ID handy.
      </p>

      <div class="mt-8">
        <CopyableId :value="shortId" />
      </div>

      <h2 class="mt-10 font-semibold">Next steps</h2>
      <ol class="mt-3 space-y-2 text-sm text-[var(--muted)] list-decimal list-inside">
        <li>Our team reviews your request (typically within 12 hours)</li>
        <li>You receive an email with a fixed quote or clarification questions</li>
        <li>After payment, development starts within 24 hours</li>
        <li>Your tool is delivered with a tracking link</li>
      </ol>

      <div class="mt-10 flex flex-wrap gap-4">
        <NuxtLink :to="`/request/track/${token}`" class="btn btn-primary">
          Track my request →
        </NuxtLink>
        <NuxtLink to="/request" class="btn btn-secondary">
          Submit another request
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
