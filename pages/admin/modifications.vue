<script setup lang="ts">
import type { ModificationRequest, Paginated } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()
const toast = useToast()
const page = ref(1)

const { data, pending, refresh } = await useAsyncData('admin-modifications', () =>
  api.get<Paginated<ModificationRequest>>(`/admin/modifications?page=${page.value}&page_size=15`),
  { watch: [page] },
)

const rejectModal = ref<ModificationRequest | null>(null)
const rejectReason = ref('')
const actionBusy = ref(false)

async function updateStatus(mod: ModificationRequest, status: string) {
  if (status === 'rejected') {
    rejectModal.value = mod
    rejectReason.value = ''
    return
  }
  actionBusy.value = true
  try {
    await api.post(`/admin/modifications/${mod.id}/status`, { status })
    toast.success(`Modification ${status}`)
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to update')
  } finally { actionBusy.value = false }
}

async function submitReject() {
  if (!rejectModal.value || !rejectReason.value.trim()) return
  actionBusy.value = true
  try {
    await api.post(`/admin/modifications/${rejectModal.value.id}/status`, { status: 'rejected', reject_reason: rejectReason.value })
    toast.success('Modification rejected')
    rejectModal.value = null
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to reject')
  } finally { actionBusy.value = false }
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending_payment: 'bg-[rgba(107,114,128,.12)] text-[var(--status-pending)]',
    accepted: 'bg-[rgba(37,99,235,.1)] text-[var(--status-approved)]',
    in_progress: 'bg-[rgba(234,88,12,.1)] text-[var(--status-in-progress)]',
    redelivered: 'bg-[rgba(4,120,87,.1)] text-[var(--status-completed)]',
    rejected: 'bg-[rgba(220,38,38,.1)] text-[var(--status-rejected)]',
  }
  return map[status] ?? ''
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
        <div class="data-label">DELIVERY MODULE</div>
        <h1 class="glitch-title mt-1" data-text="MODIFICATIONS">MODIFICATIONS</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <div v-if="pending" class="admin-panel p-5"><SkeletonLoader type="table" :lines="6" /></div>

    <template v-else-if="data">
      <div class="admin-panel overflow-x-auto">
        <table class="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-[var(--line)]">
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Request</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">#</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Description</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Type</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Status</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">SLA</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Handled by</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mod in data.items" :key="mod.id" class="border-b border-[var(--line)]/60">
              <td class="px-4 py-3">
                <NuxtLink :to="`/admin/requests/${mod.short_id}`" class="font-mono text-xs font-bold hover:text-[var(--green)] hover:underline">{{ mod.short_id }}</NuxtLink>
              </td>
              <td class="px-4 py-3 text-sm">{{ mod.seq }}</td>
              <td class="px-4 py-3 text-sm max-w-xs truncate">{{ mod.description }}</td>
              <td class="px-4 py-3">
                <span class="rounded px-2 py-0.5 text-xs font-bold" :class="mod.is_free ? 'bg-[rgba(4,120,87,.1)] text-[var(--green)]' : 'bg-[rgba(222,104,72,.12)] text-[var(--coral)]'">
                  {{ mod.is_free ? 'Free' : formatCents(mod.charge_cents) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="statusBadge(mod.status)">{{ mod.status }}</span>
              </td>
              <td class="px-4 py-3">
                <ClientOnly>
                  <span class="text-xs" :class="new Date(mod.sla_due_at) < new Date() && !['redelivered', 'rejected'].includes(mod.status) ? 'font-bold text-[var(--status-rejected)]' : 'text-[var(--muted)]'">
                    {{ formatRelative(mod.sla_due_at) }}
                  </span>
                </ClientOnly>
              </td>
              <td class="px-4 py-3 text-sm text-[var(--muted)]">{{ mod.handled_by ?? '—' }}</td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <button v-if="mod.status === 'pending_payment'" class="btn btn-sm btn-primary" :disabled="actionBusy" @click="updateStatus(mod, 'accepted')">Accept</button>
                  <button v-if="mod.status === 'accepted'" class="btn btn-sm btn-secondary" :disabled="actionBusy" @click="updateStatus(mod, 'in_progress')">Start</button>
                  <button v-if="mod.status === 'in_progress'" class="btn btn-sm btn-primary" :disabled="actionBusy" @click="updateStatus(mod, 'redelivered')">Redeliver</button>
                  <button v-if="['pending_payment', 'accepted', 'in_progress'].includes(mod.status)" class="btn btn-sm btn-danger" :disabled="actionBusy" @click="updateStatus(mod, 'rejected')">Reject</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="data.items.length === 0" title="No modifications" description="No modification requests in the queue." icon="edit" />
      </div>
      <div class="admin-panel mt-4 p-4">
        <Pagination :total="data.total" :page="page" :page-size="data.page_size" @update:page="(p: number) => page = p" />
      </div>
    </template>

    <Modal :open="!!rejectModal" title="Reject modification" @close="rejectModal = null">
      <div>
        <label for="reject-reason" class="label">Rejection reason</label>
        <textarea id="reject-reason" v-model="rejectReason" class="field mt-1" rows="3" placeholder="Explain why..." required />
      </div>
      <template #footer>
        <button class="btn btn-sm btn-secondary" @click="rejectModal = null">Cancel</button>
        <button :disabled="actionBusy || !rejectReason.trim()" class="btn btn-sm btn-danger" @click="submitReject">
          <AppIcon v-if="actionBusy" name="spinner" :size="14" class="animate-spin" /> Reject
        </button>
      </template>
    </Modal>
  </div>
</template>
