<script setup lang="ts">
import type { TrackedRequest } from '~/types/api'

useHead({ title: 'Answer questions - request/room' })
const route = useRoute()
const api = useApi()
const toast = useToast()
const token = String(route.params.token)

const { data: trackData } = await useAsyncData(`clarify-track-${token}`, () =>
  api.get<TrackedRequest>(`/requests/track/${token}`),
)

const questions = computed(() => trackData.value?.active_clarification?.questions ?? [])
const answers = ref<{ no: number; text: string }[]>([])
const submitting = ref(false)
const submitted = ref(false)

watch(questions, (qs) => {
  answers.value = qs.map(q => ({ no: q.no, text: '' }))
}, { immediate: true })

const allAnswered = computed(() => answers.value.every(a => a.text.trim().length > 0))

async function submit() {
  if (!allAnswered.value || submitting.value) return
  submitting.value = true
  try {
    await api.post(`/requests/${token}/clarify`, { answers: answers.value })
    submitted.value = true
    toast.success('Answers submitted! Your request is back in the review queue.')
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
      <!-- Success state -->
      <div v-if="submitted" class="text-center py-8">
        <div class="grid h-14 w-14 place-items-center rounded-full bg-[var(--green)] text-white mx-auto">
          <AppIcon name="check" :size="24" />
        </div>
        <div class="section-header mechanical-enter mt-5 mb-5">
          <div class="corner-bracket tl"></div><div class="corner-bracket tr"></div>
          <div class="corner-bracket bl"></div><div class="corner-bracket br"></div>
          <span class="screw screw-tl"></span><span class="screw screw-tr"></span>
          <h1 class="glitch-title mt-1" data-text="Answers submitted!">Answers submitted!</h1>
          <span class="ml-auto status-indicator success"></span>
        </div>
        <p class="mt-3 text-[var(--muted)]">Your request is back in the review queue. We'll get back to you within 12 hours.</p>
        <NuxtLink :to="`/request/track/${token}`" class="btn btn-primary mt-8">Back to tracking →</NuxtLink>
      </div>

      <!-- Questions form -->
      <template v-else>
        <div class="section-header mechanical-enter mb-8">
          <div class="corner-bracket tl"></div><div class="corner-bracket tr"></div>
          <div class="corner-bracket bl"></div><div class="corner-bracket br"></div>
          <span class="screw screw-tl"></span><span class="screw screw-tr"></span>
          <div>
            <div class="data-label">INFORMATION REQUIRED</div>
            <h1 class="glitch-title mt-1" data-text="Answer these questions">Answer these questions</h1>
          </div>
          <span class="ml-auto status-indicator warning"></span>
        </div>
        <p class="mt-3 text-[var(--muted)]">Your answers put the request back in the review queue.</p>

        <form class="mt-8 space-y-8" @submit.prevent="submit">
          <div v-for="(q, idx) in questions" :key="q.no">
            <label :for="`q-${q.no}`" class="label">
              <span class="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--green)] text-xs text-white">{{ q.no }}</span>
              {{ q.text }}
            </label>
            <textarea
              :id="`q-${q.no}`"
              v-model="answers[idx]!.text"
              rows="3"
              class="field mt-2"
              :placeholder="`Your answer for question ${q.no}...`"
              required
              :aria-invalid="answers[idx]?.text !== undefined && answers[idx]!.text.trim().length === 0"
            />
          </div>

          <button type="submit" :disabled="!allAnswered || submitting" class="btn btn-primary">
            <AppIcon v-if="submitting" name="spinner" :size="15" class="animate-spin" />
            {{ submitting ? 'Submitting...' : 'Submit answers →' }}
          </button>
        </form>
      </template>
    </section>
  </main>
</template>
