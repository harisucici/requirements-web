<script setup lang="ts">
import type { Request, Assessment, InternalNote, StatusHistoryEntry, TeamMember, EmailTemplate, Clarification, Attachment, Payment, Refund, Feedback, ModificationRequest } from '~/types/api'
import { SCORE_DIMENSIONS, DECISION_HINT_LABELS, LAUNCH_CHECKLIST } from '~/utils/constants'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const api = useApi()
const toast = useToast()
const { hasRole } = useAdminAuth()
const shortId = computed(() => route.params.id as string)

interface DetailData {
  request: Request
  user: { email: string; name: string | null; request_count: number }
  attachments: Attachment[]
  assessment: Assessment | null
  notes: InternalNote[]
  clarifications: Clarification[]
  payments: Payment[]
  refunds: Refund[]
  feedback: Feedback[]
  modifications: ModificationRequest[]
  status_history: StatusHistoryEntry[]
  risk_tags: string[]
  similar: Request[]
  team_members: TeamMember[]
  email_templates: EmailTemplate[]
}

const { data, pending, error, refresh } = await useAsyncData(
  () => `admin-request-${shortId.value}`,
  () => api.get<DetailData>(`/admin/requests/${shortId.value}`),
)

const r = computed(() => data.value?.request)
const canDecide = computed(() => hasRole('reviewer', 'admin'))

// Decision modals
const activeModal = ref<'accept' | 'reject' | 'clarify' | 'price_adjust' | null>(null)
const decisionBusy = ref(false)

// Accept form
const acceptHours = ref<number | null>(null)
const acceptPrice = ref(0)
const acceptDueAt = ref('')
const acceptWarning = ref('')
watch(acceptHours, (h) => {
  if (h == null || h <= 0) return
  if (h < 1) { acceptPrice.value = 500; acceptDueAt.value = daysFromNowClient(1) }
  else if (h <= 3) { acceptPrice.value = 1500; acceptDueAt.value = daysFromNowClient(2) }
  else if (h <= 5) { acceptPrice.value = 3500; acceptDueAt.value = daysFromNowClient(3) }
  else if (h <= 10) { acceptPrice.value = 7500; acceptDueAt.value = daysFromNowClient(5) }
  else { acceptPrice.value = 0; acceptDueAt.value = '' }
})

function daysFromNowClient(d: number) {
  return new Date(Date.now() + d * 86400_000).toISOString().slice(0, 10)
}

// Reject form
const rejectReason = ref('')

// Clarify form
const clarifyQuestions = ref<{ text: string }[]>([{ text: '' }])
function addQuestion() { clarifyQuestions.value.push({ text: '' }) }
function removeQuestion(i: number) { clarifyQuestions.value.splice(i, 1) }

// Price adjust form
const adjustPrice = ref(0)
const adjustReason = ref('')

async function submitDecision() {
  if (!r.value || decisionBusy.value) return
  decisionBusy.value = true
  try {
    const action = activeModal.value!
    const body: Record<string, unknown> = { action }
    if (action === 'accept') {
      body.quoted_price_cents = acceptPrice.value
      body.due_at = acceptDueAt.value ? new Date(acceptDueAt.value).toISOString() : undefined
      body.estimated_hours = acceptHours.value
    } else if (action === 'reject') {
      if (!rejectReason.value.trim()) { toast.error('A rejection reason is required.'); decisionBusy.value = false; return }
      body.reason = rejectReason.value
    } else if (action === 'clarify') {
      const qs = clarifyQuestions.value.filter(q => q.text.trim()).map(q => q.text)
      if (qs.length === 0) { toast.error('At least one question is required.'); decisionBusy.value = false; return }
      body.questions = qs
    } else if (action === 'price_adjust') {
      body.quoted_price_cents = adjustPrice.value
      body.reason = adjustReason.value
    }
    const result = await api.post<any>(`/admin/requests/${shortId.value}/decision`, body)
    if (result?.warning) acceptWarning.value = result.warning
    toast.success(`Decision applied: ${action}`)
    activeModal.value = null
    resetForms()
    await refresh()
  } catch (err: any) {
    if (err?.code === 'INVALID_TRANSITION') {
      toast.error('This request has moved on')
      await refresh()
    } else {
      toast.error(err?.message ?? 'Failed to apply decision')
    }
  } finally {
    decisionBusy.value = false
  }
}

function resetForms() {
  acceptHours.value = null; acceptPrice.value = 0; acceptDueAt.value = ''; acceptWarning.value = ''
  rejectReason.value = ''
  clarifyQuestions.value = [{ text: '' }]
  adjustPrice.value = 0; adjustReason.value = ''
}

// Assessment
const assessmentScores = ref({
  feasibility: 3, time: 3, value: 3, capability: 3, risk: 3,
  complexity_stars: 3, estimated_hours: null as number | null,
})
const assessmentBusy = ref(false)
const weightedTotal = computed(() => {
  const s = assessmentScores.value
  return Math.round((0.3 * s.feasibility + 0.25 * s.time + 0.2 * s.value + 0.15 * s.capability + 0.1 * s.risk) * 100) / 100
})
const decisionHint = computed(() => {
  const w = weightedTotal.value
  if (w > 4) return 'accept'
  if (w >= 3) return 'accept_with_surcharge'
  if (w >= 2) return 'discuss'
  return 'reject'
})
watch(() => data.value?.assessment, (a) => {
  if (a) {
    assessmentScores.value = {
      feasibility: a.score_feasibility, time: a.score_time, value: a.score_value,
      capability: a.score_capability, risk: a.score_risk,
      complexity_stars: a.complexity_stars, estimated_hours: a.estimated_hours,
    }
  }
}, { immediate: true })

async function saveAssessment() {
  if (!r.value || assessmentBusy.value) return
  assessmentBusy.value = true
  try {
    await api.post(`/admin/requests/${shortId.value}/assessment`, assessmentScores.value)
    toast.success('Assessment saved')
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to save assessment')
  } finally {
    assessmentBusy.value = false
  }
}

// Assignee
const assigneeId = ref<string | null>(null)
const assignBusy = ref(false)
watch(() => data.value?.request?.assignee_id, (id) => { assigneeId.value = id ?? null }, { immediate: true })
async function assignMember() {
  if (assignBusy.value) return
  assignBusy.value = true
  try {
    await api.post(`/admin/requests/${shortId.value}/assign`, { assignee_id: assigneeId.value })
    toast.success('Assignee updated')
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to assign')
  } finally {
    assignBusy.value = false
  }
}

// Notes
const noteContent = ref('')
const noteVisible = ref(false)
const noteBusy = ref(false)
async function addNote() {
  if (!noteContent.value.trim() || noteBusy.value) return
  noteBusy.value = true
  try {
    await api.post(`/admin/requests/${shortId.value}/notes`, { content: noteContent.value, visible_to_user: noteVisible.value })
    noteContent.value = ''; noteVisible.value = false
    toast.success('Note added')
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to add note')
  } finally {
    noteBusy.value = false
  }
}

// Reply drawer
const replyOpen = ref(false)

const KNOWN_RISKY = ['backend', 'database', 'auth', 'mobile-app', 'network', 'canvas-export']
</script>

<template>
  <div>
    <div v-if="pending" class="space-y-6">
      <div class="admin-panel p-6"><SkeletonLoader type="panel" /></div>
    </div>

    <div v-else-if="error" class="admin-panel p-8">
      <EmptyState title="Failed to load request" description="The request may have been removed." icon="alert" />
    </div>

    <template v-else-if="r && data">
      <!-- Header -->
      <div class="mb-6 flex flex-wrap items-center gap-4">
        <NuxtLink to="/admin/requests" class="btn btn-sm btn-ghost text-white/60 hover:text-white">
          <AppIcon name="back" :size="14" /> Back to list
        </NuxtLink>
        <div class="flex-1">
          <span class="font-mono text-xs text-white/40">{{ r.short_id }}</span>
          <h1 class="display text-xl font-semibold text-white">{{ r.description.slice(0, 80) }}{{ r.description.length > 80 ? '...' : '' }}</h1>
        </div>
        <StatusBadge :status="r.status" :substatus="r.substatus" />
      </div>

      <!-- Two-column grid -->
      <div class="grid gap-6 lg:grid-cols-[55fr_45fr]">
        <!-- LEFT: Details -->
        <div class="space-y-6">
          <!-- Requester -->
          <div class="admin-panel p-6">
            <p class="eyebrow">Requester</p>
            <div class="mt-3 flex items-center gap-3">
              <span class="grid h-10 w-10 place-items-center rounded-full bg-[var(--green)] text-sm font-bold text-white">
                {{ data.user.email.slice(0, 1).toUpperCase() }}
              </span>
              <div>
                <p class="font-semibold">{{ data.user.name ?? data.user.email }}</p>
                <p class="text-sm text-[var(--muted)]">{{ data.user.email }} · {{ data.user.request_count }} request(s)</p>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="admin-panel p-6">
            <p class="eyebrow">Description</p>
            <p class="mt-3 whitespace-pre-wrap leading-7">{{ r.description }}</p>
            <div v-if="r.use_case" class="mt-4 border-t border-[var(--line)] pt-4">
              <p class="eyebrow">Use case</p>
              <p class="mt-1 text-sm leading-6">{{ r.use_case }}</p>
            </div>
            <div class="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p class="text-xs font-bold uppercase text-[var(--muted)]">Expected delivery</p>
                <p class="mt-1 text-sm font-semibold">{{ r.expected_delivery ?? '—' }}</p>
              </div>
              <div>
                <p class="text-xs font-bold uppercase text-[var(--muted)]">Budget</p>
                <p class="mt-1 text-sm font-semibold">{{ formatCents(r.budget_cents) }}</p>
              </div>
              <div>
                <p class="text-xs font-bold uppercase text-[var(--muted)]">Source</p>
                <p class="mt-1 text-sm font-semibold">{{ r.source ?? '—' }}</p>
              </div>
            </div>
          </div>

          <!-- Attachments -->
          <div v-if="data.attachments.length > 0" class="admin-panel p-6">
            <p class="eyebrow">Attachments ({{ data.attachments.length }})</p>
            <div class="mt-3 flex flex-wrap gap-3">
              <div
                v-for="att in data.attachments" :key="att.id"
                class="flex items-center gap-2 border border-[var(--line)] bg-[rgba(30,107,82,.03)] p-3"
              >
                <AppIcon name="file" :size="16" class="text-[var(--green)]" />
                <div>
                  <p class="text-sm font-semibold">{{ att.file_name }}</p>
                  <p class="text-xs text-[var(--muted)]">{{ formatBytes(att.size_bytes) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Risk tags -->
          <div v-if="data.risk_tags.length > 0" class="admin-panel p-6">
            <p class="eyebrow">Risk tags</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="tag in data.risk_tags" :key="tag"
                class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                :class="KNOWN_RISKY.includes(tag) ? 'bg-[rgba(222,104,72,.12)] text-[var(--coral)]' : 'bg-[rgba(30,107,82,.08)] text-[var(--green)]'"
              >
                <AppIcon name="alert" :size="11" /> {{ tag }}
              </span>
            </div>
          </div>

          <!-- Similar requests -->
          <div v-if="data.similar.length > 0" class="admin-panel p-6">
            <p class="eyebrow">Similar requests</p>
            <ul class="mt-3 divide-y divide-[var(--line)]">
              <li v-for="sim in data.similar" :key="sim.id" class="py-2">
                <NuxtLink :to="`/admin/requests/${sim.short_id}`" class="text-sm font-semibold hover:text-[var(--green)] hover:underline">
                  {{ sim.short_id }}
                </NuxtLink>
                <p class="text-sm text-[var(--muted)]">{{ sim.description.slice(0, 100) }}...</p>
              </li>
            </ul>
          </div>

          <!-- Clarifications -->
          <div v-if="data.clarifications.length > 0" class="admin-panel p-6">
            <p class="eyebrow">Clarifications ({{ data.clarifications.length }})</p>
            <div v-for="cl in data.clarifications" :key="cl.id" class="mt-3 border-l-2 border-[var(--green)] pl-4">
              <p class="text-xs font-bold text-[var(--muted)]">Round {{ cl.round }}</p>
              <ol class="mt-2 list-decimal space-y-1 pl-4 text-sm">
                <li v-for="q in cl.questions" :key="q.no">{{ q.text }}</li>
              </ol>
              <div v-if="cl.answers" class="mt-2 border-t border-[var(--line)] pt-2">
                <p class="text-xs font-bold text-[var(--green)]">Answers received</p>
                <ol class="mt-1 list-decimal space-y-1 pl-4 text-sm">
                  <li v-for="a in cl.answers" :key="a.no">{{ a.text }}</li>
                </ol>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="admin-panel p-6">
            <p class="eyebrow">Internal notes ({{ data.notes.length }})</p>
            <ul class="mt-3 space-y-3">
              <li v-for="note in data.notes" :key="note.id" class="border-l-2 border-[var(--line)] pl-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold">{{ note.author_name }}</span>
                  <span class="text-xs text-[var(--muted)]">
                    <ClientOnly>{{ formatRelative(note.created_at) }}</ClientOnly>
                  </span>
                  <span v-if="note.visible_to_user" class="rounded bg-[rgba(37,99,235,.1)] px-1.5 py-0.5 text-[.65rem] font-bold text-[var(--status-approved)]">visible to user</span>
                </div>
                <p class="mt-1 text-sm leading-6">{{ note.content }}</p>
              </li>
            </ul>
            <div class="mt-4 border-t border-[var(--line)] pt-4">
              <label for="note-content" class="label">Add a note</label>
              <textarea id="note-content" v-model="noteContent" class="field mt-1" rows="3" placeholder="Write an internal note..." />
              <div class="mt-2 flex items-center gap-4">
                <label class="flex items-center gap-2 text-sm">
                  <input v-model="noteVisible" type="checkbox" class="h-4 w-4" />
                  Visible to user
                </label>
                <button :disabled="noteBusy || !noteContent.trim()" class="btn btn-sm btn-primary" @click="addNote">
                  <AppIcon v-if="noteBusy" name="spinner" :size="14" class="animate-spin" />
                  Add note
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Actions (sticky) -->
        <div class="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <!-- Decision buttons -->
          <div v-if="canDecide && ['pending', 'needs_clarification'].includes(r.status)" class="admin-panel p-6">
            <p class="eyebrow">Decision</p>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <button class="btn btn-sm btn-primary" @click="activeModal = 'accept'; resetForms()">
                <AppIcon name="check-circle" :size="14" /> Accept
              </button>
              <button class="btn btn-sm btn-danger" @click="activeModal = 'reject'; resetForms()">
                <AppIcon name="x-circle" :size="14" /> Reject
              </button>
              <button class="btn btn-sm btn-secondary" @click="activeModal = 'clarify'; resetForms()">
                <AppIcon name="question" :size="14" /> Clarify
              </button>
              <button class="btn btn-sm btn-secondary" @click="activeModal = 'price_adjust'; resetForms()">
                <AppIcon name="tag" :size="14" /> Adjust price
              </button>
            </div>
          </div>

          <!-- Pricing info -->
          <div class="admin-panel p-6">
            <p class="eyebrow">Pricing</p>
            <div class="mt-3 space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-[var(--muted)]">Budget</span>
                <span class="font-semibold">{{ formatCents(r.budget_cents) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--muted)]">Quoted</span>
                <span class="font-semibold">{{ formatCents(r.quoted_price_cents) }}</span>
              </div>
              <div v-if="r.paid_price_cents" class="flex justify-between">
                <span class="text-[var(--muted)]">Paid</span>
                <span class="font-bold text-[var(--green)]">{{ formatCents(r.paid_price_cents) }}</span>
              </div>
            </div>
          </div>

          <!-- Scoring -->
          <div class="admin-panel p-6">
            <p class="eyebrow">Assessment</p>
            <div class="mt-4 space-y-3">
              <div v-for="dim in SCORE_DIMENSIONS" :key="dim.key" class="flex items-center gap-3">
                <span class="w-32 text-xs font-semibold">{{ dim.label }}</span>
                <select
                  v-model.number="(assessmentScores as any)[dim.key]"
                  class="field w-20 py-1 text-center text-sm"
                >
                  <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
                </select>
                <span class="text-xs text-[var(--muted)]">w:{{ dim.weight }}</span>
              </div>
            </div>
            <div class="mt-4 border-t border-[var(--line)] pt-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold">Weighted total</span>
                <span class="display text-xl font-bold">{{ weightedTotal.toFixed(2) }}</span>
              </div>
              <p class="mt-1 text-sm font-semibold" :class="decisionHint === 'accept' ? 'text-[var(--green)]' : decisionHint === 'reject' ? 'text-[var(--status-rejected)]' : 'text-[var(--yellow)]'">
                {{ DECISION_HINT_LABELS[decisionHint] }}
              </p>
            </div>
            <div class="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
              <div class="flex items-center gap-3">
                <span class="w-32 text-xs font-semibold">Complexity</span>
                <div class="flex gap-1">
                  <button
                    v-for="n in 5" :key="n"
                    class="text-lg transition-colors"
                    :class="n <= assessmentScores.complexity_stars ? 'text-[var(--yellow)]' : 'text-[var(--line)]'"
                    @click="assessmentScores.complexity_stars = n"
                  >
                    <AppIcon name="star" :size="16" />
                  </button>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <label for="est-hours" class="w-32 text-xs font-semibold">Est. hours</label>
                <input id="est-hours" v-model.number="assessmentScores.estimated_hours" type="number" min="0" step="0.5" class="field w-24 py-1 text-sm" />
              </div>
            </div>
            <button
              :disabled="assessmentBusy"
              class="btn btn-sm btn-primary mt-4 w-full"
              @click="saveAssessment"
            >
              <AppIcon v-if="assessmentBusy" name="spinner" :size="14" class="animate-spin" />
              Save assessment
            </button>
          </div>

          <!-- Assignee -->
          <div class="admin-panel p-6">
            <p class="eyebrow">Assignee</p>
            <div class="mt-3">
              <select v-model="assigneeId" class="field text-sm">
                <option :value="null">Unassigned</option>
                <option v-for="m in data.team_members" :key="m.id" :value="m.id">
                  {{ m.name }} ({{ m.active_task_count }}/{{ m.load_threshold }}) — {{ m.skill_tags.join(', ') }}
                </option>
              </select>
              <p v-if="assigneeId && data.team_members.find(m => m.id === assigneeId && m.active_task_count >= m.load_threshold)" class="error-text mt-1">
                This member is at or over their load threshold.
              </p>
              <button :disabled="assignBusy" class="btn btn-sm btn-secondary mt-3 w-full" @click="assignMember">
                <AppIcon v-if="assignBusy" name="spinner" :size="14" class="animate-spin" />
                Assign
              </button>
            </div>
          </div>

          <!-- Reply -->
          <div class="admin-panel p-6">
            <p class="eyebrow">Reply to user</p>
            <button class="btn btn-sm btn-secondary mt-3 w-full" @click="replyOpen = true">
              <AppIcon name="send" :size="14" /> Open reply drawer
            </button>
          </div>

          <!-- Links -->
          <div class="admin-panel p-4">
            <div class="flex flex-wrap gap-2">
              <NuxtLink :to="`/admin/requests/${shortId}/history`" class="btn btn-sm btn-ghost">
                <AppIcon name="clock" :size="13" /> History
              </NuxtLink>
              <NuxtLink v-if="r.status === 'in_progress'" :to="`/admin/requests/${shortId}/deliver`" class="btn btn-sm btn-ghost">
                <AppIcon name="flag" :size="13" /> Deliver
              </NuxtLink>
            </div>
          </div>

          <!-- Key dates -->
          <div class="admin-panel p-6">
            <p class="eyebrow">Timeline</p>
            <dl class="mt-3 space-y-2 text-sm">
              <div class="flex justify-between"><dt class="text-[var(--muted)]">Submitted</dt><dd><ClientOnly>{{ formatRelative(r.submitted_at) }}</ClientOnly></dd></div>
              <div v-if="r.first_reviewed_at" class="flex justify-between"><dt class="text-[var(--muted)]">First reviewed</dt><dd><ClientOnly>{{ formatRelative(r.first_reviewed_at) }}</ClientOnly></dd></div>
              <div v-if="r.due_at" class="flex justify-between">
                <dt class="text-[var(--muted)]">Due</dt>
                <dd :class="new Date(r.due_at) < new Date() ? 'font-bold text-[var(--status-rejected)]' : ''">
                  <ClientOnly>{{ formatDate(r.due_at) }}</ClientOnly>
                </dd>
              </div>
              <div v-if="r.delivered_at" class="flex justify-between"><dt class="text-[var(--muted)]">Delivered</dt><dd><ClientOnly>{{ formatRelative(r.delivered_at) }}</ClientOnly></dd></div>
              <div v-if="r.delay_count > 0" class="flex justify-between"><dt class="text-[var(--muted)]">Delays</dt><dd class="font-bold text-[var(--coral)]">{{ r.delay_count }}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <!-- Decision Modals -->
      <Modal :open="activeModal === 'accept'" title="Accept request" @close="activeModal = null">
        <div class="space-y-4">
          <div>
            <label for="accept-hours" class="label">Estimated hours</label>
            <input id="accept-hours" v-model.number="acceptHours" type="number" min="0" step="0.5" class="field mt-1" placeholder="e.g. 2" />
          </div>
          <div>
            <label for="accept-price" class="label">Quoted price (cents)</label>
            <input id="accept-price" v-model.number="acceptPrice" type="number" min="0" class="field mt-1" />
            <p class="help">Price is auto-suggested from hours. You can override it.</p>
          </div>
          <div>
            <label for="accept-due" class="label">Due date</label>
            <input id="accept-due" v-model="acceptDueAt" type="date" class="field mt-1" />
          </div>
          <p v-if="acceptWarning" class="rounded bg-[rgba(240,189,89,.15)] p-3 text-sm font-semibold text-[var(--yellow)]">
            <AppIcon name="alert" :size="14" class="inline" /> {{ acceptWarning }}
          </p>
        </div>
        <template #footer>
          <button class="btn btn-sm btn-secondary" @click="activeModal = null">Cancel</button>
          <button :disabled="decisionBusy || !acceptPrice" class="btn btn-sm btn-primary" @click="submitDecision">
            <AppIcon v-if="decisionBusy" name="spinner" :size="14" class="animate-spin" />
            Accept & quote
          </button>
        </template>
      </Modal>

      <Modal :open="activeModal === 'reject'" title="Reject request" @close="activeModal = null">
        <div>
          <label for="reject-reason" class="label">Reason (required)</label>
          <textarea id="reject-reason" v-model="rejectReason" class="field mt-1" rows="4" placeholder="Explain why this request cannot be accepted..." required />
          <p v-if="activeModal === 'reject' && !rejectReason.trim()" class="error-text mt-1" role="alert">A rejection reason is required.</p>
        </div>
        <template #footer>
          <button class="btn btn-sm btn-secondary" @click="activeModal = null">Cancel</button>
          <button :disabled="decisionBusy || !rejectReason.trim()" class="btn btn-sm btn-danger" @click="submitDecision">
            <AppIcon v-if="decisionBusy" name="spinner" :size="14" class="animate-spin" />
            Reject
          </button>
        </template>
      </Modal>

      <Modal :open="activeModal === 'clarify'" title="Request clarification" @close="activeModal = null">
        <div>
          <p class="label">Questions for the requester</p>
          <div class="mt-2 space-y-3">
            <div v-for="(q, i) in clarifyQuestions" :key="i" class="flex items-start gap-2">
              <span class="mt-2 text-sm font-bold text-[var(--muted)]">{{ i + 1 }}.</span>
              <input v-model="q.text" class="field flex-1" :placeholder="`Question ${i + 1}`" />
              <button v-if="clarifyQuestions.length > 1" class="mt-1 text-[var(--muted)] hover:text-[var(--status-rejected)]" @click="removeQuestion(i)">
                <AppIcon name="trash" :size="14" />
              </button>
            </div>
          </div>
          <button class="btn btn-sm btn-ghost mt-2" @click="addQuestion">
            <AppIcon name="plus" :size="13" /> Add question
          </button>
        </div>
        <template #footer>
          <button class="btn btn-sm btn-secondary" @click="activeModal = null">Cancel</button>
          <button :disabled="decisionBusy" class="btn btn-sm btn-primary" @click="submitDecision">
            <AppIcon v-if="decisionBusy" name="spinner" :size="14" class="animate-spin" />
            Send questions
          </button>
        </template>
      </Modal>

      <Modal :open="activeModal === 'price_adjust'" title="Adjust price" @close="activeModal = null">
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <p class="text-xs font-bold uppercase text-[var(--muted)]">Current quote</p>
              <p class="display text-xl font-bold">{{ formatCents(r.quoted_price_cents ?? r.budget_cents) }}</p>
            </div>
            <AppIcon name="arrow" :size="20" class="text-[var(--muted)]" />
            <div class="flex-1">
              <label for="adjust-price" class="label">New price (cents)</label>
              <input id="adjust-price" v-model.number="adjustPrice" type="number" min="0" class="field mt-1" />
            </div>
          </div>
          <div>
            <label for="adjust-reason" class="label">Reason</label>
            <textarea id="adjust-reason" v-model="adjustReason" class="field mt-1" rows="3" placeholder="Explain the price change..." />
          </div>
        </div>
        <template #footer>
          <button class="btn btn-sm btn-secondary" @click="activeModal = null">Cancel</button>
          <button :disabled="decisionBusy || !adjustPrice || !adjustReason.trim()" class="btn btn-sm btn-primary" @click="submitDecision">
            <AppIcon v-if="decisionBusy" name="spinner" :size="14" class="animate-spin" />
            Update price
          </button>
        </template>
      </Modal>

      <!-- Reply Drawer -->
      <AdminReplyDrawer
        :open="replyOpen"
        :templates="data.email_templates"
        :request-id="r.id"
        :request-short-id="r.short_id"
        :user-email="data.user.email"
        @close="replyOpen = false"
        @sent="toast.success('Reply sent'); replyOpen = false; refresh()"
      />
    </template>
  </div>
</template>
