<script setup lang="ts">
import type { MockConfirmResult } from '~/types/api'
import { formatCents } from '~/utils/format'

// Dark shell standalone page - no default layout wrapping
definePageMeta({ layout: false })

const route = useRoute()
const api = useApi()
const sessionId = String(route.params.sessionId)
const confirming = ref(false)
const failing = ref(false)
const inlineError = ref('')

interface SessionInfo { session_id: string; short_id: string; amount_cents: number; status: string; type?: string }
const { data: session } = await useAsyncData(`mock-session-${sessionId}`, () =>
  api.get<SessionInfo>(`/payments/mock/${sessionId}`),
)

async function confirm() {
  confirming.value = true
  inlineError.value = ''
  try {
    const result = await api.post<MockConfirmResult>(`/payments/mock/${sessionId}/confirm`)
    // Land on the payment success page (U-07 / R-404); track link lives there.
    await navigateTo(`/request/${result.short_id}/pay/success?session_id=${sessionId}&token=${result.token}`)
  } catch (e: any) {
    confirming.value = false
    inlineError.value = e?.message || 'Payment confirmation failed. Please try again.'
  }
}

/** Demo-only: exercise the U-08 failed-payment flow. */
async function simulateDecline() {
  failing.value = true
  inlineError.value = ''
  try {
    const result = await api.post<{ short_id: string; token: string }>(`/payments/mock/${sessionId}/fail`)
    await navigateTo(`/request/${result.short_id}/pay/failed?session_id=${sessionId}&token=${result.token}`)
  } catch (e: any) {
    failing.value = false
    inlineError.value = e?.message || 'Could not simulate a failure.'
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#202b25] px-5 py-12">
    <main class="mx-auto max-w-md">
      <div class="mb-6 flex items-center justify-between text-white">
        <NuxtLink to="/" class="font-semibold">request<span class="text-[var(--coral)]">/</span>room</NuxtLink>
        <span class="text-xs uppercase tracking-widest text-white/50">Mock checkout</span>
      </div>
      <section class="bg-[#f5f4ee] p-7 sm:p-9">
        <p class="eyebrow">Secure checkout</p>
        <h1 class="display mt-3 text-3xl font-semibold">{{ session?.type === 'rush_surcharge' ? 'Rush upgrade' : 'Confirm your request' }}</h1>
        <p class="mt-5 leading-7 text-[var(--muted)]">This demo payment follows the same boundary as Stripe Checkout. No card details are collected.</p>

        <div class="my-8 border-y border-[var(--line)] py-5">
          <div class="flex justify-between font-semibold">
            <span>{{ session?.type === 'rush_surcharge' ? 'Rush surcharge (50%)' : 'Tool request' }}</span>
            <span v-if="session">#{{ session.short_id }}</span>
          </div>
          <div class="mt-3 flex justify-between text-2xl font-semibold">
            <span>Total</span>
            <span>{{ session ? formatCents(session.amount_cents) : '--' }}</span>
          </div>
        </div>

        <p v-if="inlineError" role="alert" class="mb-4 bg-[#fff0eb] px-4 py-3 text-sm font-semibold text-[var(--status-rejected)]">{{ inlineError }}</p>

        <button
          class="w-full rounded-full bg-[var(--green)] px-5 py-4 font-bold text-white transition hover:bg-[#15543f] disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="confirming || failing"
          @click="confirm"
        >
          {{ confirming ? 'Confirming...' : 'Confirm payment →' }}
        </button>

        <div class="mt-5 flex items-center justify-between text-xs text-[var(--muted)]">
          <span class="inline-flex items-center gap-1"><AppIcon name="lock" :size="12" /> SSL encrypted · 30-day refund guarantee</span>
          <button class="underline decoration-dotted hover:text-[var(--ink)]" :disabled="confirming || failing" @click="simulateDecline">
            {{ failing ? 'Simulating…' : 'Simulate declined card' }}
          </button>
        </div>
      </section>
    </main>
  </div>
</template>
