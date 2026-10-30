<script setup lang="ts">
import type { PayResultData } from '~/types/api'

useHead({ title: 'Payment failed - request/room' })
const route = useRoute()
const api = useApi()
const shortId = String(route.params.shortId)
const token = route.query.token as string || ''

const { data } = await useAsyncData(`pay-fail-${shortId}`, () =>
  api.get<PayResultData>(`/requests/${shortId}/pay/result`),
)
</script>

<template>
  <main class="mx-auto max-w-3xl px-5 pb-20 pt-16 lg:px-8">
    <section class="panel p-8 sm:p-12 text-center">
      <div class="grid h-14 w-14 place-items-center rounded-full bg-[var(--status-rejected)] text-white mx-auto">
        <AppIcon name="x-circle" :size="24" />
      </div>
      <h1 class="display mt-6 text-3xl font-semibold">We couldn't process your payment</h1>
      <p class="mt-4 text-[var(--muted)]">{{ data?.failure_reason || 'Your payment could not be processed. This can happen due to insufficient funds, card restrictions, or a temporary issue.' }}</p>

      <div class="mt-8 flex flex-wrap justify-center gap-4">
        <NuxtLink :to="`/request/${shortId}/pay${token ? `?token=${token}` : ''}`" class="btn btn-primary">
          <AppIcon name="refresh" :size="15" />
          Retry payment
        </NuxtLink>
        <a href="mailto:hello@requestroom.com" class="btn btn-secondary">
          <AppIcon name="mail" :size="15" />
          Contact support
        </a>
      </div>

      <p class="mt-6 text-xs text-[var(--muted)]">
        No charges have been made to your account. If the issue persists, try a different payment method.
      </p>
    </section>
  </main>
</template>
