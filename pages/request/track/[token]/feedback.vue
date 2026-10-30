<script setup lang="ts">
import type { Feedback } from '~/types/api'
import { formatDateTime } from '~/utils/format'

useHead({ title: 'Leave feedback - request/room' })
const route = useRoute()
const api = useApi()
const toast = useToast()
const token = String(route.params.token)

// Check if editing
const { data: deliveryData } = await useAsyncData(`fb-delivery-${token}`, () =>
  api.get<{ feedback: Feedback | null }>(`/requests/${token}/delivery`),
)

const existing = computed(() => deliveryData.value?.feedback ?? null)
const editing = ref(false)
const rating = ref(0)
const comment = ref('')
const npsScore = ref<number | null>(null)
const improvementSuggestion = ref('')
const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

// Init from existing
watch(existing, (fb) => {
  if (fb) {
    rating.value = fb.rating
    comment.value = fb.comment ?? ''
    npsScore.value = fb.nps_score
    improvementSuggestion.value = fb.improvement_suggestion ?? ''
  }
}, { immediate: true })

const canEdit = computed(() => existing.value && new Date(existing.value.editable_until) > new Date())
const isEditing = computed(() => !existing.value || editing.value)

async function submit() {
  if (!rating.value) {
    error.value = 'Please choose a rating'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    if (existing.value && editing.value) {
      await api.patch(`/requests/${token}/feedback`, {
        rating: rating.value,
        comment: comment.value || undefined,
        nps_score: npsScore.value ?? undefined,
        improvement_suggestion: improvementSuggestion.value || undefined,
      })
      toast.success('Feedback updated!')
    } else {
      await api.post(`/requests/${token}/feedback`, {
        rating: rating.value,
        comment: comment.value || undefined,
        nps_score: npsScore.value ?? undefined,
        improvement_suggestion: improvementSuggestion.value || undefined,
      })
      toast.success('Thanks for the feedback!')
    }
    submitted.value = true
    editing.value = false
  } catch (e: any) {
    error.value = e.message || 'Connection failed, please try again'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-5 pb-20 pt-12 lg:px-8">
    <section class="panel p-7 sm:p-10">
      <div class="section-header mechanical-enter mb-8">
        <div class="corner-bracket tl"></div><div class="corner-bracket tr"></div>
        <div class="corner-bracket bl"></div><div class="corner-bracket br"></div>
        <span class="screw screw-tl"></span><span class="screw screw-tr"></span>
        <div>
          <div class="data-label">{{ existing ? 'FEEDBACK LOG' : 'ASSESSMENT PROTOCOL' }}</div>
          <h1 class="glitch-title mt-1" data-text="How did we do?">How did we do?</h1>
        </div>
        <span class="ml-auto status-indicator success"></span>
      </div>

      <!-- Already submitted & not editing -->
      <div v-if="existing && !editing && !submitted" class="mt-8">
        <div class="panel p-5">
          <div class="flex items-center gap-2">
            <span v-for="star in 5" :key="star" class="text-2xl" :class="star <= existing.rating ? 'text-[var(--yellow)]' : 'text-[var(--line)]'">★</span>
          </div>
          <p v-if="existing.comment" class="mt-3 leading-7 text-[var(--muted)]">{{ existing.comment }}</p>
          <p v-if="existing.nps_score != null" class="mt-2 text-sm text-[var(--muted)]">NPS: {{ existing.nps_score }}/10</p>
          <p v-if="existing.improvement_suggestion" class="mt-2 text-sm text-[var(--muted)]">Suggestion: {{ existing.improvement_suggestion }}</p>
        </div>

        <div v-if="canEdit" class="mt-4">
          <p class="text-sm text-[var(--muted)]">
            <ClientOnly>You can edit your feedback until <time>{{ formatDateTime(existing.editable_until) }}</time></ClientOnly>
          </p>
          <button class="btn btn-secondary btn-sm mt-3" @click="editing = true">Edit feedback</button>
        </div>
        <p v-else class="mt-4 text-sm text-[var(--muted)]">The editing window has closed.</p>
      </div>

      <!-- Success -->
      <div v-else-if="submitted && !editing" class="mt-8 bg-[#e6f4ec] p-5 text-center">
        <p class="font-semibold text-[var(--green)]">Thanks for the thoughtful feedback!</p>
        <NuxtLink :to="`/request/track/${token}`" class="btn btn-secondary btn-sm mt-4">Back to tracking →</NuxtLink>
      </div>

      <!-- Form -->
      <form v-else class="mt-8 space-y-8" @submit.prevent="submit">
        <!-- Star rating -->
        <fieldset>
          <legend class="label">Your rating <span aria-hidden="true">*</span></legend>
          <div class="mt-3">
            <StarRating v-model="rating" />
          </div>
          <p v-if="error" role="alert" class="error-text mt-2">{{ error }}</p>
        </fieldset>

        <!-- Comment -->
        <div>
          <label for="comment" class="label">What stood out?</label>
          <textarea id="comment" v-model="comment" rows="5" class="field mt-2" placeholder="Optional, but always useful." />
        </div>

        <!-- NPS -->
        <div>
          <label class="label">Would you recommend us? <span class="font-normal text-[var(--muted)]">(0-10, optional)</span></label>
          <div class="mt-3">
            <NpsSlider v-model="npsScore" />
          </div>
        </div>

        <!-- Improvement -->
        <div>
          <label for="improvement" class="label">Any suggestions? <span class="font-normal text-[var(--muted)]">(optional)</span></label>
          <textarea id="improvement" v-model="improvementSuggestion" rows="3" class="field mt-2" placeholder="How could we improve?" />
        </div>

        <div class="flex gap-4">
          <button type="submit" :disabled="submitting" class="btn btn-primary">
            <AppIcon v-if="submitting" name="spinner" :size="15" class="animate-spin" />
            {{ submitting ? 'Sending...' : (editing ? 'Update feedback →' : 'Send feedback →') }}
          </button>
          <button v-if="editing" type="button" class="btn btn-ghost" @click="editing = false">Cancel</button>
        </div>
      </form>
    </section>
  </main>
</template>
