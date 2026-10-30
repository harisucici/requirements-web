<script setup lang="ts">
import type { TrackedRequest } from '~/types/api'
import { formatCents } from '~/utils/format'

useHead({ title: 'Track request - request/room' })
const route = useRoute()
const api = useApi()
const toast = useToast()
const token = String(route.params.token)

const { data, error, refresh } = await useAsyncData(`track-${token}`, () =>
  api.get<TrackedRequest>(`/requests/track/${token}`),
)

// Handle 404/410 → redirect to expired
watch(error, (err: any) => {
  if (err?.code === 'TOKEN_EXPIRED' || err?.statusCode === 410) {
    navigateTo('/request/track/expired')
  } else if (err?.code === 'TOKEN_NOT_FOUND' || err?.statusCode === 404) {
    navigateTo('/request/track/expired')
  }
})

// Countdown for in_progress
const dueAt = computed(() => data.value?.due_at ?? null)

async function handleAction(action: string) {
  if (action === 'accept_new_price') {
    try {
      await api.post(`/requests/${token}/price-decision`, { decision: 'accept' })
      toast.success('Price accepted! You can now proceed to payment.')
      await refresh()
    } catch (e: any) {
      toast.error(e.message || 'Connection failed, please try again')
    }
  } else if (action === 'reject_new_price') {
    try {
      await api.post(`/requests/${token}/price-decision`, { decision: 'reject' })
      toast.info('Price declined. The request has been closed.')
      await refresh()
    } catch (e: any) {
      toast.error(e.message || 'Connection failed, please try again')
    }
  } else if (action === 'rush_upgrade') {
    rushDialogOpen.value = true
  }
}

// R-307 (P2): rush upgrade — 50% surcharge checkout while in development.
const rushDialogOpen = ref(false)
const rushBusy = ref(false)
const rushAmount = computed(() => Math.round((data.value?.paid_price_cents ?? data.value?.quoted_price_cents ?? 0) * 0.5))

async function startRush() {
  if (!data.value) return
  rushBusy.value = true
  try {
    const result = await api.post<{ session_id: string; url: string }>('/payments/checkout', {
      short_id: data.value.short_id,
      type: 'rush_surcharge',
    })
    await navigateTo(result.url)
  } catch (e: any) {
    toast.error(e.message || 'Connection failed, please try again')
    rushBusy.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-5xl px-5 pb-20 pt-10 lg:px-8">
    <!-- Loading -->
    <div v-if="!data && !error" class="space-y-6">
      <SkeletonLoader type="panel" />
    </div>

    <!-- Error -->
    <div v-else-if="error && !data" class="py-16 text-center">
      <EmptyState
        title="This tracking link is not available."
        description="The link may have expired or is invalid."
        action-label="Submit a new request"
        action-to="/request"
        icon="x-circle"
      />
    </div>

    <!-- Data -->
    <template v-else-if="data">
      <!-- Header -->
      <div class="section-header mechanical-enter mb-8">
        <div class="corner-bracket tl"></div>
        <div class="corner-bracket tr"></div>
        <div class="corner-bracket bl"></div>
        <div class="corner-bracket br"></div>
        <span class="screw screw-tl"></span>
        <span class="screw screw-tr"></span>
        <div>
          <div class="data-label">YOUR REQUEST MODULE</div>
          <h1 class="glitch-title mt-1" data-text="#{{ data.short_id }}">#{{ data.short_id }}</h1>
        </div>
        <div class="ml-auto flex items-center gap-4">
          <StatusBadge :status="data.status" :substatus="data.substatus" />
          <span class="status-indicator success"></span>
        </div>
      </div>

      <!-- Countdown -->
      <div v-if="data.status === 'in_progress' && data.due_at" class="mt-6">
        <CountdownTimer :due-at="data.due_at" />
      </div>

      <div class="mt-10 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
        <!-- Timeline -->
        <section class="panel p-6 sm:p-9">
          <p class="eyebrow">Progress</p>
          <div class="mt-8">
            <Timeline :events="data.timeline" :current-status="data.status" />
          </div>
        </section>

        <!-- Sidebar -->
        <aside class="space-y-6">
          <!-- Action bar -->
          <div class="panel p-6 sm:p-8">
            <p class="eyebrow">Next step</p>
            <h2 class="mt-3 text-xl font-semibold">
              {{ data.status === 'approved' ? 'Ready when you are.' :
                 data.status === 'completed' ? 'Your tool is ready.' :
                 data.status === 'needs_clarification' ? 'We need your input.' :
                 data.status === 'canceled' ? 'This request is closed.' :
                 'We are on it.' }}
            </h2>
            <p class="mt-3 text-sm leading-7 text-[var(--muted)]">
              {{ data.status === 'approved' ? `Your fixed quote is $${((data.quoted_price_cents ?? 0) / 100).toFixed(2)}. Complete payment within 7 days.` :
                 data.status === 'completed' ? 'Open your delivered tool and tell us how it feels.' :
                 data.status === 'needs_clarification' ? 'Answer the questions below to put your request back in the review queue.' :
                 data.status === 'canceled' ? `Reason: ${data.cancel_reason || 'canceled'}` :
                 'We will email you when this request moves forward.' }}
            </p>

            <div class="mt-6">
              <ActionBar
                :actions="data.available_actions"
                :token="token"
                :short-id="data.short_id"
                @action="handleAction"
              />
            </div>

            <!-- Price decision buttons for approved + awaiting_price_confirmation -->
            <div v-if="data.substatus === 'awaiting_price_confirmation'" class="mt-4 flex flex-wrap gap-3">
              <button class="btn btn-primary btn-sm" @click="handleAction('accept_new_price')">Accept New Price</button>
              <button class="btn btn-danger btn-sm" @click="handleAction('reject_new_price')">Decline</button>
            </div>
          </div>

          <!-- Description -->
          <div class="panel p-6">
            <p class="eyebrow">Your request</p>
            <p class="mt-3 text-sm leading-7 text-[var(--muted)]">{{ data.description }}</p>
          </div>
        </aside>
      </div>

      <!-- Rush upgrade dialog (R-307) -->
      <ConfirmDialog
        :open="rushDialogOpen"
        title="Need it faster?"
        :message="`Upgrade to rush delivery for ${formatCents(rushAmount)} (50% of your price). We commit to delivering within 24 hours of payment.`"
        confirm-label="Continue to payment"
        :loading="rushBusy"
        @confirm="startRush"
        @cancel="rushDialogOpen = false; rushBusy = false"
      />
    </template>
  </main>
</template>
