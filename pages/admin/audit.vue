<script setup lang="ts">
import type { AuditLogEntry, Paginated } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()
const page = ref(1)

const { data, pending } = await useAsyncData('admin-audit', () =>
  api.get<Paginated<AuditLogEntry>>(`/admin/audit?page=${page.value}&page_size=20`),
  { watch: [page] },
)

const columns = [
  { key: 'created_at', label: 'Time' },
  { key: 'actor_name', label: 'Actor' },
  { key: 'action', label: 'Action' },
  { key: 'target_type', label: 'Target' },
  { key: 'detail', label: 'Detail' },
  { key: 'ip', label: 'IP' },
]
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
        <div class="data-label">INSIGHTS MODULE</div>
        <h1 class="glitch-title mt-1" data-text="AUDIT LOG">AUDIT LOG</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <div v-if="pending" class="admin-panel p-5"><SkeletonLoader type="table" :lines="8" /></div>

    <template v-else-if="data">
      <div class="admin-panel">
        <DataTable
          :columns="columns"
          :rows="data.items"
          :row-key="(r: AuditLogEntry) => r.id"
          empty-title="No audit entries"
          :clickable="false"
        >
          <template #cell-created_at="{ row }">
            <ClientOnly>
              <span class="text-xs text-[var(--muted)]">{{ formatDateTime(row.created_at) }}</span>
            </ClientOnly>
          </template>
          <template #cell-actor_name="{ row }">
            <span class="text-sm font-semibold">{{ row.actor_name }}</span>
          </template>
          <template #cell-action="{ row }">
            <span class="font-mono text-xs font-bold">{{ row.action }}</span>
          </template>
          <template #cell-target_type="{ row }">
            <span class="text-xs">
              <span class="rounded bg-[rgba(30,107,82,.08)] px-2 py-0.5 font-mono text-[var(--green)]">{{ row.target_type }}</span>
              <span class="ml-1 text-[var(--muted)]">{{ row.target_id }}</span>
            </span>
          </template>
          <template #cell-detail="{ row }">
            <span class="text-sm text-[var(--muted)]">{{ row.detail }}</span>
          </template>
          <template #cell-ip="{ row }">
            <span class="font-mono text-xs text-[var(--muted)]">{{ row.ip ?? '—' }}</span>
          </template>
        </DataTable>
        <div class="p-4">
          <Pagination :total="data.total" :page="page" :page-size="data.page_size" @update:page="(p: number) => page = p" />
        </div>
      </div>
    </template>
  </div>
</template>
