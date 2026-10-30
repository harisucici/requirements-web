<script setup lang="ts">
import type { CreateRequestResult, DuplicateWindowPayload } from '~/types/api'
import { DESCRIPTION_LIMITS } from '~/utils/constants'

useHead({ title: 'Submit a request - request/room' })

const api = useApi()
const toast = useToast()

// --- Form state ---
const step = ref(1)
const form = reactive({
  description: '',
  email: '',
  useCase: '',
  expectedDelivery: '',
  budgetCents: '',
  termsAccepted: false,
  attachments: [] as { id: string; name: string; size: number; progress: number }[],
})
const submitting = ref(false)
const error = ref('')
const blurred = reactive<Record<string, boolean>>({})

// Draft
const { restored, bind, persist, clear, dismissRestoreHint } = useDraft<typeof form>('rm_draft_v1')
onMounted(() => bind(form))

// Validation
const descLen = computed(() => form.description.length)
const descValid = computed(() => descLen.value >= DESCRIPTION_LIMITS.min && descLen.value <= DESCRIPTION_LIMITS.max)
const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
const step1Valid = computed(() => descValid.value && emailValid.value)
const step2Valid = computed(() => form.termsAccepted && form.attachments.every(f => f.progress >= 100))
const canSubmit = computed(() => step1Valid.value && step2Valid.value)

// Duplicate window dialog
const dupDialog = ref(false)
const dupPayload = ref<DuplicateWindowPayload | null>(null)

function onBlur(field: string) { blurred[field] = true }

async function goToStep2() {
  if (!step1Valid.value) {
    blurred.description = true
    blurred.email = true
    return
  }
  persist()
  step.value = 2
}

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    const result = await api.post<CreateRequestResult>('/requests', {
      description: form.description.trim(),
      email: form.email.trim(),
      use_case: form.useCase || undefined,
      expected_delivery: form.expectedDelivery || undefined,
      budget_cents: form.budgetCents ? Number(form.budgetCents) * 100 : undefined,
      terms_accepted: form.termsAccepted,
      attachment_ids: form.attachments.map(f => f.id),
    })
    clear()
    await navigateTo(`/request/success/${result.short_id}?token=${result.token}`)
  } catch (e: any) {
    if (e.code === 'DUPLICATE_WINDOW') {
      dupPayload.value = e.payload as DuplicateWindowPayload
      dupDialog.value = true
    } else {
      error.value = 'Connection failed, please try again'
    }
    submitting.value = false
  }
}

async function submitForce() {
  dupDialog.value = false
  submitting.value = true
  error.value = ''
  try {
    const result = await api.post<CreateRequestResult>('/requests?force=1', {
      description: form.description.trim(),
      email: form.email.trim(),
      use_case: form.useCase || undefined,
      expected_delivery: form.expectedDelivery || undefined,
      budget_cents: form.budgetCents ? Number(form.budgetCents) * 100 : undefined,
      terms_accepted: form.termsAccepted,
      attachment_ids: form.attachments.map(f => f.id),
    })
    clear()
    await navigateTo(`/request/success/${result.short_id}?token=${result.token}`)
  } catch {
    error.value = 'Connection failed, please try again'
    submitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-4xl px-5 pb-20 pt-8 lg:px-8">
    <!-- Hero -->
    <div class="section-header mechanical-enter mb-8">
      <div class="corner-bracket tl"></div>
      <div class="corner-bracket tr"></div>
      <div class="corner-bracket bl"></div>
      <div class="corner-bracket br"></div>
      <span class="screw screw-tl"></span>
      <span class="screw screw-tr"></span>
      <div class="max-w-2xl">
        <div class="data-label">START WITH THE BOTTLENECK</div>
        <h1 class="glitch-title mt-1" data-text="Tell us what you need, we'll build it in 24 hours">Tell us what you need, we'll build it in 24 hours</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <!-- Step indicator -->
    <div class="mt-10 flex items-center gap-4 text-sm">
      <span :class="step >= 1 ? 'font-bold text-[var(--green)]' : 'text-[var(--muted)]'">Step 1 of 2</span>
      <span class="h-px flex-1 bg-[var(--line)]" />
      <span :class="step >= 2 ? 'font-bold text-[var(--green)]' : 'text-[var(--muted)]'">Step 2 of 2</span>
    </div>

    <!-- Draft restored banner -->
    <div v-if="restored" class="mt-6 flex items-center justify-between border-l-4 border-[var(--yellow)] bg-[#fff8e8] px-4 py-3 text-sm">
      <span>Draft restored</span>
      <button class="text-[var(--muted)] hover:text-[var(--ink)]" @click="dismissRestoreHint"><AppIcon name="x" :size="14" /></button>
    </div>

    <!-- Form -->
    <form class="panel mt-8 p-6 sm:p-9" @submit.prevent="submit" novalidate>
      <!-- Step 1: Description + Email -->
      <div v-show="step === 1" class="space-y-7">
        <div>
          <label for="description" class="label">Describe your tool <span aria-hidden="true">*</span></label>
          <textarea
            id="description" v-model="form.description" rows="7" maxlength="2000"
            class="field mt-2 resize-y"
            placeholder="I need a tool that converts CSV files to..."
            :aria-invalid="blurred.description && !descValid"
            aria-describedby="desc-help desc-err"
            @blur="onBlur('description'); persist()"
          />
          <div id="desc-help" class="mt-2 flex justify-between text-sm text-[var(--muted)]">
            <span>Be specific about the annoying part.</span>
            <span>{{ descLen }}/{{ DESCRIPTION_LIMITS.max }} characters</span>
          </div>
          <p v-if="blurred.description && descLen > 0 && descLen < DESCRIPTION_LIMITS.min" id="desc-err" role="alert" class="error-text mt-1">
            Please describe your tool in at least {{ DESCRIPTION_LIMITS.min }} characters.
          </p>
        </div>

        <div>
          <label for="email" class="label">Your email <span aria-hidden="true">*</span></label>
          <input
            id="email" v-model="form.email" type="email" autocomplete="email"
            class="field mt-2" placeholder="you@example.com" aria-required="true"
            :aria-invalid="blurred.email && !emailValid"
            @blur="onBlur('email'); persist()"
          />
          <p v-if="blurred.email && !emailValid" role="alert" class="error-text mt-1">Enter a valid email address so we can reach you.</p>
        </div>

        <button type="button" class="btn btn-primary" :disabled="!step1Valid" @click="goToStep2">
          Continue to step 2 →
        </button>
      </div>

      <!-- Step 2: Details + Submit -->
      <div v-show="step === 2" class="space-y-7">
        <div>
          <label for="use-case" class="label">Where will you use it? <span class="font-normal text-[var(--muted)]">(optional)</span></label>
          <input id="use-case" v-model="form.useCase" class="field mt-2" placeholder="At work, every Monday morning" />
        </div>

        <div>
          <label for="delivery" class="label">Expected delivery <span class="font-normal text-[var(--muted)]">(optional)</span></label>
          <select id="delivery" v-model="form.expectedDelivery" class="field mt-2">
            <option value="">No preference</option>
            <option value="2_days">2 days</option>
            <option value="1_week">1 week</option>
            <option value="2_weeks">2 weeks</option>
          </select>
        </div>

        <div>
          <label for="budget" class="label">Budget <span class="font-normal text-[var(--muted)]">(optional, in $)</span></label>
          <input id="budget" v-model="form.budgetCents" type="number" min="0" step="1" class="field mt-2" placeholder="15" />
          <p class="help mt-1">Our typical range is $5-10, please contact us for complex projects.</p>
        </div>

        <div>
          <label class="label">Attachments <span class="font-normal text-[var(--muted)]">(optional)</span></label>
          <div class="mt-2">
            <FileUploader v-model="form.attachments" />
          </div>
        </div>

        <div class="flex items-start gap-3">
          <input id="terms" v-model="form.termsAccepted" type="checkbox" class="mt-1 h-5 w-5 accent-[var(--green)]" />
          <label for="terms" class="text-sm leading-6 text-[var(--muted)]">
            I agree to the <NuxtLink to="/terms" class="font-semibold text-[var(--green)] underline" target="_blank">terms</NuxtLink>
            and <NuxtLink to="/privacy" class="font-semibold text-[var(--green)] underline" target="_blank">privacy policy</NuxtLink>.
          </label>
        </div>

        <p v-if="error" role="alert" class="bg-[#fff0eb] px-4 py-3 text-sm font-semibold text-[var(--coral)]">{{ error }}</p>

        <div class="flex flex-wrap gap-4">
          <button type="button" class="btn btn-ghost" @click="step = 1">← Back</button>
          <button type="submit" :disabled="!canSubmit || submitting" class="btn btn-primary">
            <AppIcon v-if="submitting" name="spinner" :size="15" class="animate-spin" />
            {{ submitting ? 'Submitting...' : 'Send my request →' }}
          </button>
        </div>
      </div>
    </form>

    <!-- Trust bar -->
    <TrustBadges />

    <!-- Legal links below form (NF-C1) -->
    <div class="mt-4 flex flex-wrap justify-center gap-4 text-xs text-[var(--muted)]">
      <NuxtLink to="/privacy" class="hover:text-[var(--ink)]">Privacy Policy</NuxtLink>
      <NuxtLink to="/terms" class="hover:text-[var(--ink)]">Terms of Service</NuxtLink>
      <NuxtLink to="/cookies" class="hover:text-[var(--ink)]">Cookie Policy</NuxtLink>
    </div>

    <!-- Success case cards -->
    <section class="mt-16" aria-label="Recent success stories">
      <p class="eyebrow text-center">Built recently</p>
      <h2 class="display mt-3 text-center text-2xl font-semibold">Tools our customers love</h2>
      <div class="mt-8 grid gap-6 sm:grid-cols-3">
        <div class="panel p-5">
          <div class="flex h-28 items-center justify-center bg-[rgba(30,107,82,.06)] text-[var(--green)]"><AppIcon name="file" :size="32" /></div>
          <h3 class="mt-3 text-sm font-semibold">CSV to Excel converter</h3>
          <p class="mt-1 text-xs text-[var(--muted)]">"Headers frozen, numbers aligned — exactly what I needed." — ★★★★★</p>
        </div>
        <div class="panel p-5">
          <div class="flex h-28 items-center justify-center bg-[rgba(222,104,72,.06)] text-[var(--coral)]"><AppIcon name="chart" :size="32" /></div>
          <h3 class="mt-3 text-sm font-semibold">Markdown preview editor</h3>
          <p class="mt-1 text-xs text-[var(--muted)]">"Live rendering + copy-to-HTML saved me an hour." — ★★★★☆</p>
        </div>
        <div class="panel p-5">
          <div class="flex h-28 items-center justify-center bg-[rgba(240,189,89,.08)] text-[var(--yellow)]"><AppIcon name="edit" :size="32" /></div>
          <h3 class="mt-3 text-sm font-semibold">QR code generator</h3>
          <p class="mt-1 text-xs text-[var(--muted)]">"Logo upload + color picker, ready in 2 days." — ★★★★★</p>
        </div>
      </div>
    </section>

    <!-- Duplicate window dialog -->
    <SimilarRequestDialog
      v-if="dupPayload"
      :open="dupDialog"
      :payload="dupPayload"
      @close="dupDialog = false"
      @view-existing="dupDialog = false"
      @submit-anyway="submitForce"
    />
  </main>
</template>
