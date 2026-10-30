<script setup lang="ts">
import type { Request, Paginated, RequestStatus } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()
const route = useRoute()
const router = useRouter()

const viewTabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In development' },
  { key: 'completed', label: 'Completed' },
  { key: 'by_assignee', label: 'By assignee' },
  { key: 'by_due', label: 'Due date' },
]

const view = ref((route.query.view as string) || 'all')
const searchQuery = ref((route.query.q as string) || '')
const statusFilter = ref((route.query.status as string) || '')
const page = ref(1)

const { data, pending, refresh } = await useAsyncData(
  'admin-requests-list',
  () => {
    const params = new URLSearchParams()
    params.set('view', view.value)
    params.set('page', String(page.value))
    params.set('page_size', '15')
    if (searchQuery.value) params.set('q', searchQuery.value)
    if (statusFilter.value) params.set('status', statusFilter.value)
    return api.get<Paginated<Request>>(`/admin/requests?${params}`)
  },
  { watch: [view, searchQuery, statusFilter, page] },
)

const columns = [
  { key: 'short_id', label: 'ID', sortable: false },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'quoted_price_cents', label: 'Quote' },
  { key: 'assignee_name', label: 'Assignee' },
  { key: 'submitted_at', label: 'Submitted' },
  { key: 'due_at', label: 'Due' },
]

function onRowClick(row: Request) {
  router.push(`/admin/requests/${row.short_id}`)
}

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'needs_clarification', label: 'Needs clarification' },
  { value: 'paid', label: 'Paid' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'canceled', label: 'Canceled' },
]

function truncate(str: string, len = 60) {
  return str.length > len ? str.slice(0, len) + '...' : str
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
        <div class="data-label">REQUESTS MODULE</div>
        <h1 class="glitch-title mt-1" data-text="REQUEST QUEUE">REQUEST QUEUE</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <!-- View Tabs -->
    <div class="mb-4 flex flex-wrap gap-1 border-b border-[var(--admin-line)]">
      <button
        v-for="tab in viewTabs" :key="tab.key"
        class="px-4 py-2.5 text-sm font-semibold transition-colors"
        :class="view === tab.key
          ? 'border-b-2 border-[var(--coral)] text-white'
          : 'text-white/50 hover:text-white/80'"
        @click="view = tab.key; page = 1"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Filters -->
    <div class="admin-panel mb-4 flex flex-wrap items-center gap-3 p-4">
      <div class="relative flex-1 min-w-[200px]">
        <AppIcon name="search" :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          v-model="searchQuery" type="search" placeholder="Search by ID, description or email..."
          class="field pl-9"
        />
      </div>
      <select v-model="statusFilter" class="field w-auto">
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <button class="btn btn-sm btn-secondary" @click="refresh()">
        <AppIcon name="refresh" :size="14" /> Refresh
      </button>
    </div>

    <!-- Table -->
    <div class="admin-panel">
      <div v-if="pending" class="p-5">
        <SkeletonLoader type="table" :lines="8" />
      </div>
      <template v-else-if="data">
        <DataTable
          :columns="columns"
          :rows="data.items"
          :row-key="(r: Request) => r.id"
          empty-title="No requests found"
          empty-description="Try adjusting your filters or submit a new request."
          @row-click="onRowClick"
        >
          <template #cell-short_id="{ row }">
            <span class="font-mono text-xs font-bold">{{ row.short_id }}</span>
          </template>
          <template #cell-description="{ row }">
            <span class="text-sm">{{ truncate(row.description) }}</span>
          </template>
          <template #cell-status="{ row }">
            <StatusBadge :status="row.status" :substatus="row.substatus" size="sm" />
          </template>
          <template #cell-quoted_price_cents="{ row }">
            <span class="text-sm font-semibold">{{ formatCents(row.quoted_price_cents ?? row.budget_cents) }}</span>
          </template>
          <template #cell-assignee_name="{ row }">
            <span class="text-sm text-[var(--muted)]">{{ row.assignee_name ?? '—' }}</span>
          </template>
          <template #cell-submitted_at="{ row }">
            <ClientOnly>
              <span class="text-xs text-[var(--muted)]">{{ formatRelative(row.submitted_at) }}</span>
            </ClientOnly>
          </template>
          <template #cell-due_at="{ row }">
            <ClientOnly>
              <span class="text-xs" :class="row.due_at && new Date(row.due_at) < new Date() ? 'font-bold text-[var(--status-rejected)]' : 'text-[var(--muted)]'">
                {{ row.due_at ? formatDate(row.due_at) : '—' }}
              </span>
            </ClientOnly>
          </template>
        </DataTable>

        <div class="p-4">
          <Pagination
            :total="data.total"
            :page="page"
            :page-size="data.page_size"
            @update:page="(p: number) => page = p"
          />
        </div>
      </template>
    </div>
  </div>
</template>
