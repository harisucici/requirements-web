<script setup lang="ts">
import type { CancelEstimate } from '~/types/api'
import { CANCEL_REASONS } from '~/utils/constants'
import { formatCents } from '~/utils/format'

useHead({ title: 'Cancel request - request/room' })
const route = useRoute()
const api = useApi()
const toast = useToast()
const token = String(route.params.token)
const isRefund = route.query.refund === '1'

const { data: estimate, error: estErr } = await useAsyncData(`cancel-est-${token}`, () =>
  api.get<CancelEstimate>(`/requests/${token}/cancel-estimate`),
)

const reason = ref('')
const note = ref('')
const showConfirm = ref(false)
const submitting = ref(false)
const done = ref(false)
const resultMessage = ref('')

const canSubmit = computed(() => {
  if (estimate.value?.status === 'completed') return reason.value !== ''
  return reason.value !== ''
})

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    const body: Record<string, string> = { reason: reason.value }
    if (note.value) body.cancel_note = note.value
    const q = isRefund ? '?refund=1' : ''
    const result = await api.post<any>(`/requests/${token}/cancel${q}`, body)
    done.value = true
    resultMessage.value = result.message || 'Your request has been canceled.'
    toast.success(resultMessage.value)
  } catch (e: any) {
    toast.error(e.message || 'Connection failed, please try again')
  } finally {
    submitting.value = false
    showConfirm.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-5 pb-20 pt-12 lg:px-8">
    <section class="panel p-7 sm:p-10">
      <!-- Done state -->
      <div v-if="done" class="text-center py-8">
        <div class="grid h-14 w-14 place-items-center rounded-full bg-[var(--muted)] text-white mx-auto">
          <AppIcon name="x-circle" :size="24" />
        </div>
        <div class="section-header mechanical-enter mt-5 mb-5">
          <div class="corner-bracket tl"></div><div class="corner-bracket tr"></div>
          <div class="corner-bracket bl"></div><div class="corner-bracket br"></div>
          <span class="screw screw-tl"></span><span class="screw screw-tr"></span>
          <h1 class="glitch-title mt-1" data-text="Your request has been canceled">Your request has been canceled</h1>
          <span class="ml-auto status-indicator danger"></span>
        </div>
        <p class="mt-3 text-[var(--muted)]">{{ resultMessage }}</p>
        <p class="mt-2 text-sm text-[var(--muted)]">You will receive a confirmation email shortly. Refunds typically process within 3-5 business days.</p>
        <NuxtLink to="/request" class="btn btn-primary mt-8">Submit a new request →</NuxtLink>
      </div>

      <template v-else>
        <div class="section-header mechanical-enter mb-8">
          <div class="corner-bracket tl"></div><div class="corner-bracket tr"></div>
          <div class="corner-bracket bl"></div><div class="corner-bracket br"></div>
          <span class="screw screw-tl"></span><span class="screw screw-tr"></span>
          <div>
            <div class="data-label">{{ isRefund ? 'REFUND PROTOCOL' : 'TERMINATION PROTOCOL' }}</div>
            <h1 class="glitch-title mt-1" :data-text="isRefund ? 'Request a refund' : 'Cancel your request'">{{ isRefund ? 'Request a refund' : 'Cancel your request' }}</h1>
          </div>
          <span class="ml-auto status-indicator warning"></span>
        </div>

        <!-- Refund estimate -->
        <div v-if="estimate" class="panel mt-6 p-5" :class="estimate.refundable_cents > 0 ? 'border-[var(--green)]' : ''">
          <div class="flex justify-between font-semibold">
            <span>Estimated refund</span>
            <span>{{ formatCents(estimate.refundable_cents) }}</span>
          </div>
          <div v-if="estimate.fee_cents > 0" class="mt-1 flex justify-between text-sm text-[var(--muted)]">
            <span>Processing fee (2.9% + $0.30)</span>
            <span>{{ formatCents(estimate.fee_cents) }}</span>
          </div>
          <p class="mt-3 text-sm text-[var(--muted)]">{{ estimate.explanation }}</p>
          <p v-if="estimate.requires_review" class="mt-2 text-xs font-semibold text-[var(--status-needs-clarification)]">
            This refund requires team review.
          </p>
        </div>

        <!-- Form -->
        <form class="mt-8 space-y-6" @submit.prevent="showConfirm = true">
          <div>
            <label for="reason" class="label">Reason <span aria-hidden="true">*</span></label>
            <select id="reason" v-model="reason" class="field mt-2" required>
              <option value="" disabled>Select a reason</option>
              <option v-for="r in CANCEL_REASONS" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
          </div>

          <div v-if="reason === 'other'">
            <label for="note" class="label">Please explain</label>
            <textarea id="note" v-model="note" rows="3" class="field mt-2" />
          </div>

          <button type="submit" :disabled="!canSubmit" class="btn btn-danger">
            {{ isRefund ? 'Request refund' : 'Cancel request' }}
          </button>
        </form>

        <!-- Confirm dialog -->
        <ConfirmDialog
          :open="showConfirm"
          :title="isRefund ? 'Confirm refund request?' : 'Cancel this request?'"
          :message="isRefund ? 'Your refund request will be reviewed by our team. This cannot be undone once approved.' : 'This will close your request. This action cannot be undone.'"
          :confirm-label="isRefund ? 'Request refund' : 'Yes, cancel'"
          variant="danger"
          :loading="submitting"
          @confirm="submit"
          @cancel="showConfirm = false"
        />
      </template>
    </section>
  </main>
</template>
