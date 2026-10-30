<script setup lang="ts">
import type { PayResultData } from '~/types/api'
import { formatDateTime } from '~/utils/format'

useHead({ title: 'Payment received - request/room' })
const route = useRoute()
const api = useApi()
const shortId = String(route.params.shortId)
const sessionId = route.query.session_id as string || ''
const token = route.query.token as string || ''

const { data } = await useAsyncData(`pay-result-${shortId}`, () =>
  api.get<PayResultData>(`/requests/${shortId}/pay/result${sessionId ? `?session_id=${sessionId}` : ''}`),
)
</script>

<template>
  <main class="mx-auto max-w-3xl px-5 pb-20 pt-16 lg:px-8">
    <SkeletonLoader v-if="!data" type="panel" />

    <template v-else-if="data.status === 'succeeded'">
      <section class="panel p-8 sm:p-12 text-center">
        <div class="grid h-14 w-14 place-items-center rounded-full bg-[var(--green)] text-white mx-auto">
          <AppIcon name="check" :size="24" />
        </div>
        <h1 class="display mt-6 text-3xl font-semibold">Payment received! We'll start building your tool.</h1>
        <p v-if="data.due_at" class="mt-4 text-[var(--muted)]">
          Estimated delivery: <ClientOnly><time class="font-semibold text-[var(--ink)]">{{ formatDateTime(data.due_at) }}</time></ClientOnly>
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <NuxtLink :to="`/request/track/${data.token || token}`" class="btn btn-primary">Track my request →</NuxtLink>
        </div>
      </section>
    </template>

    <template v-else-if="data.status === 'failed'">
      <section class="panel p-8 sm:p-12 text-center">
        <div class="grid h-14 w-14 place-items-center rounded-full bg-[var(--status-rejected)] text-white mx-auto">
          <AppIcon name="x-circle" :size="24" />
        </div>
        <h1 class="display mt-6 text-3xl font-semibold">Payment could not be processed</h1>
        <p class="mt-4 text-[var(--muted)]">{{ data.failure_reason || 'Something went wrong with your payment. Please try again or use a different payment method.' }}</p>
        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <NuxtLink :to="`/request/${shortId}/pay`" class="btn btn-primary">Try again</NuxtLink>
          <a href="mailto:hello@requestroom.com" class="btn btn-secondary">Contact support</a>
        </div>
      </section>
    </template>

    <template v-else>
      <section class="panel p-8 text-center">
        <AppIcon name="clock" :size="32" class="mx-auto text-[var(--muted)]" />
        <h1 class="display mt-5 text-2xl font-semibold">Payment is being processed</h1>
        <p class="mt-3 text-[var(--muted)]">Your payment is being processed. This page will update shortly.</p>
      </section>
    </template>
  </main>
</template>
