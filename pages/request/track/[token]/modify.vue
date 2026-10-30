<script setup lang="ts">
import type { RevisionQuota, ModificationRequest } from '~/types/api'
import { MODIFICATION_MIN_CHARS } from '~/utils/constants'
import { formatCents } from '~/utils/format'

useHead({ title: 'Request modification - request/room' })
const route = useRoute()
const api = useApi()
const toast = useToast()
const token = String(route.params.token)

const { data: deliveryData } = await useAsyncData(`mod-delivery-${token}`, () =>
  api.get<{ revision_quota: RevisionQuota }>(`/requests/${token}/delivery`),
)

const quota = computed(() => deliveryData.value?.revision_quota)
const description = ref('')
const blurred = ref(false)
const submitting = ref(false)
const result = ref<{ modification: ModificationRequest; revision_quota: RevisionQuota } | null>(null)

const valid = computed(() => description.value.trim().length >= MODIFICATION_MIN_CHARS)

async function submit() {
  if (!valid.value || submitting.value) return
  submitting.value = true
  try {
    const res = await api.post<{ modification: ModificationRequest; revision_quota: RevisionQuota }>(`/requests/${token}/modify`, { description: description.value.trim() })
    result.value = res
    toast.success(res.modification.is_free ? 'Modification accepted!' : 'Payment required for this modification.')
  } catch (e: any) {
    toast.error(e.message || 'Connection failed, please try again')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-5 pb-20 pt-12 lg:px-8">
    <section class="panel p-7 sm:p-10">
      <!-- Result state -->
      <div v-if="result" class="text-center py-4">
        <template v-if="result.modification.is_free">
          <div class="grid h-14 w-14 place-items-center rounded-full bg-[var(--green)] text-white mx-auto">
            <AppIcon name="check" :size="24" />
          </div>
          <h1 class="display mt-5 text-2xl font-semibold">Modification accepted</h1>
          <p class="mt-3 text-[var(--muted)]">Our team will respond within 12 hours with an updated tool. You'll receive an email when it's ready.</p>
        </template>
        <template v-else>
          <div class="grid h-14 w-14 place-items-center rounded-full bg-[var(--yellow)] text-[var(--ink)] mx-auto">
            <AppIcon name="card" :size="24" />
          </div>
          <h1 class="display mt-5 text-2xl font-semibold">Payment required</h1>
          <p class="mt-3 text-[var(--muted)]">No free revisions remaining. A {{ formatCents(result.modification.charge_cents) }} payment is required before we start this modification.</p>
          <p class="mt-2 text-sm text-[var(--muted)]">A payment link has been sent to your email.</p>
        </template>
        <div class="mt-6 text-sm text-[var(--muted)]">
          <span v-if="result.revision_quota.remaining > 0">{{ result.revision_quota.remaining }} free revision{{ result.revision_quota.remaining !== 1 ? 's' : '' }} remaining</span>
          <span v-else>No free revisions left</span>
        </div>
        <NuxtLink :to="`/request/track/${token}`" class="btn btn-primary mt-8">Back to tracking →</NuxtLink>
      </div>

      <!-- Form -->
      <template v-else>
        <p class="eyebrow">Request a change</p>
        <h1 class="display mt-3 text-3xl font-semibold">Request Modification</h1>

        <!-- Revision quota -->
        <div v-if="quota" class="mt-6 panel p-4">
          <p class="text-sm font-semibold">
            <span v-if="quota.remaining > 0">{{ quota.remaining }} free revision{{ quota.remaining !== 1 ? 's' : '' }} remaining</span>
            <span v-else>No free revisions left — additional revisions are {{ formatCents(quota.extra_revision_fee_cents) }} each</span>
          </p>
        </div>

        <form class="mt-8 space-y-6" @submit.prevent="submit">
          <div>
            <label for="mod-desc" class="label">Describe the modification <span aria-hidden="true">*</span></label>
            <textarea
              id="mod-desc"
              v-model="description"
              rows="5"
              class="field mt-2"
              placeholder="Describe what needs to change (at least 20 characters)..."
              :aria-invalid="blurred && !valid"
              @blur="blurred = true"
            />
            <p class="mt-1 text-sm text-[var(--muted)]">{{ description.length }} characters (minimum {{ MODIFICATION_MIN_CHARS }})</p>
            <p v-if="blurred && !valid" role="alert" class="error-text mt-1">Please describe your modification in at least {{ MODIFICATION_MIN_CHARS }} characters.</p>
          </div>

          <p class="text-sm text-[var(--muted)]">Modifications are limited to adjustments within the original request scope. Major changes will be treated as a new request.</p>

          <button type="submit" :disabled="!valid || submitting" class="btn btn-primary">
            <AppIcon v-if="submitting" name="spinner" :size="15" class="animate-spin" />
            {{ submitting ? 'Submitting...' : 'Submit modification request →' }}
          </button>
        </form>
      </template>
    </section>
  </main>
</template>
