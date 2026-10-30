<script setup lang="ts">
import type { Refund, Paginated } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()
const toast = useToast()
const { hasRole } = useAdminAuth()
const page = ref(1)

const { data, pending, refresh } = await useAsyncData('admin-refunds', () =>
  api.get<Paginated<Refund>>(`/admin/refunds?page=${page.value}&page_size=15`),
  { watch: [page] },
)

const executeModal = ref<Refund | null>(null)
const approvedAmount = ref(0)
const confirmOpen = ref(false)
const actionBusy = ref(false)

function openExecute(rf: Refund) {
  executeModal.value = rf
  approvedAmount.value = rf.requested_amount_cents - rf.fee_deducted_cents
  confirmOpen.value = false
}

async function executeRefund() {
  if (!executeModal.value || actionBusy.value) return
  actionBusy.value = true
  try {
    await api.post(`/admin/refunds/${executeModal.value.id}/execute`, { approved_amount_cents: approvedAmount.value })
    toast.success('Refund executed')
    executeModal.value = null
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to execute refund')
  } finally { actionBusy.value = false }
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    requested: 'bg-[rgba(217,119,6,.12)] text-[var(--status-needs-clarification)]',
    approved: 'bg-[rgba(37,99,235,.1)] text-[var(--status-approved)]',
    rejected: 'bg-[rgba(220,38,38,.1)] text-[var(--status-rejected)]',
    processing: 'bg-[rgba(107,114,128,.12)] text-[var(--status-pending)]',
    succeeded: 'bg-[rgba(4,120,87,.1)] text-[var(--status-completed)]',
    failed: 'bg-[rgba(220,38,38,.1)] text-[var(--status-rejected)]',
  }
  return map[status] ?? ''
}

const REASON_LABELS: Record<string, string> = {
  no_reason_7d: 'No reason (7-day)',
  quality_30d: 'Quality (30-day)',
  delivery_overdue: 'Delivery overdue',
  canceled_before_dev: 'Canceled before dev',
  partial_in_progress: 'Partial (in progress)',
  other: 'Other',
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
        <div class="data-label">CARE MODULE</div>
        <h1 class="glitch-title mt-1" data-text="REFUNDS">REFUNDS</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <div v-if="pending" class="admin-panel p-5"><SkeletonLoader type="table" :lines="5" /></div>

    <template v-else-if="data">
      <div class="admin-panel overflow-x-auto">
        <table class="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-[var(--line)]">
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Request</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Reason</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Original</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Requested</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Fee (2.9% + $0.30)</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Approved</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Status</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rf in data.items" :key="rf.id" class="border-b border-[var(--line)]/60">
              <td class="px-4 py-3">
                <NuxtLink :to="`/admin/requests/${rf.short_id}`" class="font-mono text-xs font-bold hover:text-[var(--green)] hover:underline">{{ rf.short_id }}</NuxtLink>
              </td>
              <td class="px-4 py-3 text-sm">{{ REASON_LABELS[rf.reason_code] ?? rf.reason_code }}</td>
              <td class="px-4 py-3 text-sm font-semibold">{{ formatCents(rf.original_amount_cents) }}</td>
              <td class="px-4 py-3 text-sm font-semibold">{{ formatCents(rf.requested_amount_cents) }}</td>
              <td class="px-4 py-3 text-sm text-[var(--coral)]">-{{ formatCents(rf.fee_deducted_cents) }}</td>
              <td class="px-4 py-3 text-sm font-bold text-[var(--green)]">{{ rf.approved_amount_cents != null ? formatCents(rf.approved_amount_cents) : '—' }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="statusBadge(rf.status)">{{ rf.status }}</span>
              </td>
              <td class="px-4 py-3">
                <button
                  v-if="rf.status === 'requested' && hasRole('admin')"
                  class="btn btn-sm btn-primary"
                  @click="openExecute(rf)"
                >Review & execute</button>
                <span v-else class="text-xs text-[var(--muted)]">
                  {{ rf.reviewed_by ? `by ${rf.reviewed_by}` : '—' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="data.items.length === 0" title="No refunds" description="No refund requests yet." icon="refund" />
      </div>
      <div class="admin-panel mt-4 p-4">
        <Pagination :total="data.total" :page="page" :page-size="data.page_size" @update:page="(p: number) => page = p" />
      </div>
    </template>

    <!-- Execute Modal -->
    <Modal :open="!!executeModal" title="Execute refund" @close="executeModal = null">
      <div v-if="executeModal" class="space-y-4">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-[var(--muted)]">Original:</span> <strong>{{ formatCents(executeModal.original_amount_cents) }}</strong></div>
          <div><span class="text-[var(--muted)]">Requested:</span> <strong>{{ formatCents(executeModal.requested_amount_cents) }}</strong></div>
          <div><span class="text-[var(--muted)]">Processing fee:</span> <strong class="text-[var(--coral)]">{{ formatCents(executeModal.fee_deducted_cents) }}</strong></div>
          <div><span class="text-[var(--muted)]">Reason:</span> <strong>{{ REASON_LABELS[executeModal.reason_code] }}</strong></div>
        </div>
        <div v-if="executeModal.note" class="border-l-2 border-[var(--line)] pl-3 text-sm text-[var(--muted)]">{{ executeModal.note }}</div>
        <div>
          <label for="approved-amount" class="label">Approved amount (cents)</label>
          <input id="approved-amount" v-model.number="approvedAmount" type="number" min="0" class="field mt-1" />
          <p class="help">User receives: {{ formatCents(approvedAmount) }}</p>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-sm btn-secondary" @click="executeModal = null">Cancel</button>
        <button v-if="!confirmOpen" class="btn btn-sm btn-danger" @click="confirmOpen = true">Confirm execution</button>
        <button v-else :disabled="actionBusy" class="btn btn-sm btn-danger" @click="executeRefund">
          <AppIcon v-if="actionBusy" name="spinner" :size="14" class="animate-spin" /> Yes, execute refund
        </button>
      </template>
    </Modal>
  </div>
</template>
