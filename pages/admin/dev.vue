<script setup lang="ts">
import type { DevBoardData, Request, DevStage } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()
const toast = useToast()
const { hasRole, session } = useAdminAuth()

const { data, pending, refresh } = await useAsyncData('admin-dev-board', () =>
  api.get<DevBoardData>('/admin/dev/board'),
)

const columns = computed(() => data.value?.columns ?? [])
const draggedCard = ref<Request | null>(null)
const dragOverStage = ref<string | null>(null)

// Drag handlers
function onDragStart(e: DragEvent, card: Request) {
  draggedCard.value = card
  e.dataTransfer?.setData('text/plain', card.short_id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragOver(e: DragEvent, stage: string) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverStage.value = stage
}

function onDragLeave() {
  dragOverStage.value = null
}

async function onDrop(e: DragEvent, toStage: string) {
  e.preventDefault()
  dragOverStage.value = null
  const card = draggedCard.value
  if (!card) return

  // Developer can only drag own cards
  if (session.value?.role === 'developer' && card.assignee_id !== session.value.id) {
    toast.error('You can only move your own cards.')
    return
  }

  const fromStage = card.dev_stage ?? (card.status === 'paid' ? 'paid' : 'in_progress')
  if (fromStage === toStage) return

  try {
    await api.post(`/admin/dev/${card.short_id}/stage`, { stage: toStage })
    toast.success(`Moved ${card.short_id} to ${toStage}`)
    await refresh()
  } catch (err: any) {
    if (err?.code === 'INVALID_TRANSITION') {
      toast.error('This request has moved on')
      await refresh()
    } else {
      toast.error(err?.message ?? 'Failed to move card')
    }
  }
  draggedCard.value = null
}

// Card actions
const progressModal = ref<Request | null>(null)
const delayModal = ref<Request | null>(null)
const progressValue = ref(0)
const delayDate = ref('')
const delayReason = ref('')
const actionBusy = ref(false)

async function startDev(card: Request) {
  actionBusy.value = true
  try {
    await api.post(`/admin/requests/${card.short_id}/start`, {})
    toast.success(`Started development on ${card.short_id}`)
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to start')
  } finally { actionBusy.value = false }
}

async function updateProgress() {
  if (!progressModal.value) return
  actionBusy.value = true
  try {
    await api.patch(`/admin/requests/${progressModal.value.short_id}/progress`, { progress_percent: progressValue.value })
    toast.success('Progress updated')
    progressModal.value = null
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to update progress')
  } finally { actionBusy.value = false }
}

async function submitDelay() {
  if (!delayModal.value || !delayDate.value || !delayReason.value.trim()) return
  actionBusy.value = true
  try {
    await api.post(`/admin/requests/${delayModal.value.short_id}/delay`, {
      new_due_at: new Date(delayDate.value).toISOString(),
      reason: delayReason.value,
    })
    toast.success('Delay recorded')
    delayModal.value = null
    delayDate.value = ''
    delayReason.value = ''
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to record delay')
  } finally { actionBusy.value = false }
}

function isOverdue(card: Request) {
  return card.due_at && new Date(card.due_at) < new Date()
}

const STAGE_COLORS: Record<string, string> = {
  paid: 'border-[var(--status-paid)]',
  in_progress: 'border-[var(--status-in-progress)]',
  testing: 'border-[var(--yellow)]',
  ready: 'border-[var(--status-completed)]',
}
</script>

<template>
  <div>
    <div class="section-header mechanical-enter mb-8">
      <div class="corner-bracket tl"></div>
      <div class="corner-bracket tr"></div>
      <div class="corner-bracket bl"></div>
      <div class="corner-bracket br"></div>
      <span class="screw screw-tl"></span>
      <span class="screw screw-tr"></span>
      <div>
        <div class="data-label">DEVELOPMENT MODULE</div>
        <h1 class="glitch-title mt-1" data-text="DEV BOARD">DEV BOARD</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <div v-if="pending" class="grid gap-4 md:grid-cols-4">
      <div v-for="i in 4" :key="i" class="admin-panel p-4"><SkeletonLoader type="card" :lines="3" /></div>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="col in columns" :key="col.stage"
        class="admin-panel p-4"
        :class="[dragOverStage === col.stage ? 'drag-over' : '', 'border-t-2', STAGE_COLORS[col.stage] ?? '']"
        @dragover="(e) => onDragOver(e as DragEvent, col.stage)"
        @dragleave="onDragLeave"
        @drop="(e) => onDrop(e as DragEvent, col.stage)"
      >
        <div class="mb-3 flex items-center justify-between">
          <h2 class="display text-sm font-bold uppercase tracking-wider">{{ col.label }}</h2>
          <span class="grid h-6 w-6 place-items-center rounded-full bg-[rgba(30,107,82,.08)] text-xs font-bold text-[var(--green)]">{{ col.cards.length }}</span>
        </div>

        <div class="space-y-3">
          <div
            v-for="card in col.cards" :key="card.id"
            class="cursor-grab border border-[var(--line)] bg-white p-3 transition-shadow hover:shadow-md active:cursor-grabbing"
            draggable="true"
            :class="{ dragging: draggedCard?.id === card.id }"
            @dragstart="(e) => onDragStart(e as DragEvent, card)"
          >
            <div class="flex items-start justify-between gap-2">
              <NuxtLink :to="`/admin/requests/${card.short_id}`" class="font-mono text-xs font-bold hover:text-[var(--green)] hover:underline">
                {{ card.short_id }}
              </NuxtLink>
              <span v-if="card.delay_count > 0" class="rounded bg-[rgba(222,104,72,.12)] px-1.5 py-0.5 text-[.65rem] font-bold text-[var(--coral)]">
                +{{ card.delay_count }} delay
              </span>
            </div>

            <p class="mt-2 text-sm leading-5 line-clamp-2">{{ card.description }}</p>

            <div class="mt-3 flex items-center gap-2">
              <span v-if="card.assignee_name" class="grid h-6 w-6 place-items-center rounded-full bg-[var(--green)] text-[.6rem] font-bold text-white">
                {{ card.assignee_name.slice(0, 1) }}
              </span>
              <span v-if="card.due_at" class="text-xs" :class="isOverdue(card) ? 'font-bold text-[var(--status-rejected)]' : 'text-[var(--muted)]'">
                <ClientOnly>{{ card.due_at ? formatDate(card.due_at) : '' }}</ClientOnly>
              </span>
            </div>

            <!-- Progress bar -->
            <div v-if="card.status === 'in_progress'" class="mt-2">
              <div class="h-1.5 w-full bg-[var(--line)]">
                <div class="h-full bg-[var(--green)] transition-all" :style="{ width: `${card.progress_percent}%` }" />
              </div>
              <p class="mt-1 text-[.65rem] text-[var(--muted)]">{{ card.progress_percent }}%</p>
            </div>

            <!-- Actions -->
            <div class="mt-2 flex flex-wrap gap-1">
              <button
                v-if="card.status === 'paid'"
                class="btn btn-sm btn-primary"
                :disabled="actionBusy"
                @click.stop="startDev(card)"
              >
                <AppIcon name="play" :size="12" /> Start
              </button>
              <button
                v-if="card.status === 'in_progress'"
                class="btn btn-sm btn-secondary"
                @click.stop="progressModal = card; progressValue = card.progress_percent"
              >
                Progress
              </button>
              <button
                v-if="['paid', 'in_progress'].includes(card.status)"
                class="btn btn-sm btn-ghost"
                @click.stop="delayModal = card"
              >
                Delay
              </button>
            </div>
          </div>

          <p v-if="col.cards.length === 0" class="py-8 text-center text-xs text-[var(--muted)]">
            Drop cards here
          </p>
        </div>
      </div>
    </div>

    <!-- Progress Modal -->
    <Modal :open="!!progressModal" title="Update progress" @close="progressModal = null">
      <div>
        <label for="progress-value" class="label">Progress percentage</label>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="v in [0, 25, 50, 80, 100]" :key="v"
            class="btn btn-sm" :class="progressValue === v ? 'btn-primary' : 'btn-secondary'"
            @click="progressValue = v"
          >{{ v }}%</button>
        </div>
        <input id="progress-value" v-model.number="progressValue" type="range" min="0" max="100" step="5" class="mt-4 w-full" />
        <p class="mt-2 text-center text-sm font-bold">{{ progressValue }}%</p>
      </div>
      <template #footer>
        <button class="btn btn-sm btn-secondary" @click="progressModal = null">Cancel</button>
        <button :disabled="actionBusy" class="btn btn-sm btn-primary" @click="updateProgress">
          <AppIcon v-if="actionBusy" name="spinner" :size="14" class="animate-spin" /> Update
        </button>
      </template>
    </Modal>

    <!-- Delay Modal -->
    <Modal :open="!!delayModal" title="Record delay" @close="delayModal = null">
      <div class="space-y-4">
        <div>
          <label for="delay-date" class="label">New ETA</label>
          <input id="delay-date" v-model="delayDate" type="date" class="field mt-1" required />
        </div>
        <div>
          <label for="delay-reason" class="label">Reason (required)</label>
          <textarea id="delay-reason" v-model="delayReason" class="field mt-1" rows="3" placeholder="Why is this delayed?" required />
        </div>
      </div>
      <template #footer>
        <button class="btn btn-sm btn-secondary" @click="delayModal = null">Cancel</button>
        <button :disabled="actionBusy || !delayDate || !delayReason.trim()" class="btn btn-sm btn-primary" @click="submitDelay">
          <AppIcon v-if="actionBusy" name="spinner" :size="14" class="animate-spin" /> Record delay
        </button>
      </template>
    </Modal>
  </div>
</template>
