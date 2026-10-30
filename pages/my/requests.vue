<script setup lang="ts">
import type { Paginated, Request } from '~/types/api'
import { STATUS_ORDER } from '~/utils/status'
import { formatCents, formatDateTime } from '~/utils/format'

useHead({ title: 'My requests - request/room' })
const api = useApi()
const { user, fetchMe } = useUserAuth()

// Check auth
onMounted(async () => {
  const u = await fetchMe()
  if (!u) await navigateTo('/login')
})

const page = ref(1)
const statusFilter = ref('')
const statusTabs = ['', ...STATUS_ORDER]

const { data, refresh } = await useAsyncData('my-requests', () =>
  api.get<Paginated<Request & { token: string | null }>>(`/my/requests?page=${page.value}${statusFilter.value ? `&status=${statusFilter.value}` : ''}`),
)

watch([page, statusFilter], () => refresh())
</script>

<template>
  <main class="mx-auto max-w-5xl px-5 pb-20 pt-10 lg:px-8">
    <div class="section-header mechanical-enter mb-8">
      <div class="corner-bracket tl"></div>
      <div class="corner-bracket tr"></div>
      <div class="corner-bracket bl"></div>
      <div class="corner-bracket br"></div>
      <span class="screw screw-tl"></span>
      <span class="screw screw-tr"></span>
      <div>
        <div class="data-label">YOUR HISTORY MODULE</div>
        <h1 class="glitch-title mt-1" data-text="MY REQUESTS">MY REQUESTS</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <!-- Status filter tabs -->
    <div class="mt-8 flex flex-wrap gap-2">
      <button
        v-for="tab in statusTabs" :key="tab"
        class="btn btn-sm"
        :class="statusFilter === tab ? 'btn-primary' : 'btn-secondary'"
        @click="statusFilter = tab; page = 1"
      >
        {{ tab || 'All' }}
      </button>
    </div>

    <!-- Loading -->
    <SkeletonLoader v-if="!data" type="card" :lines="4" />

    <!-- Empty -->
    <EmptyState
      v-else-if="data.items.length === 0"
      title="No requests yet"
      description="Submit your first request to see it here."
      action-label="Submit a request"
      action-to="/request"
    />

    <!-- List -->
    <div v-else class="mt-6 space-y-4">
      <NuxtLink
        v-for="r in data.items" :key="r.id"
        :to="r.token ? `/request/track/${r.token}` : '#'"
        class="panel block p-5 transition hover:border-[var(--green)]"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <StatusBadge :status="r.status" :substatus="r.substatus" size="sm" />
            <span class="font-mono text-sm font-semibold">#{{ r.short_id }}</span>
          </div>
          <ClientOnly>
            <time class="text-xs text-[var(--muted)]">{{ formatDateTime(r.submitted_at) }}</time>
          </ClientOnly>
        </div>
        <p class="mt-3 text-sm text-[var(--muted)] line-clamp-2">{{ r.description }}</p>
        <p v-if="r.quoted_price_cents" class="mt-2 text-xs text-[var(--muted)]">Quote: {{ formatCents(r.quoted_price_cents) }}</p>
      </NuxtLink>
    </div>

    <!-- Pagination -->
    <div v-if="data && data.total > data.page_size" class="mt-8">
      <Pagination
        :page="page"
        :total="data.total"
        :page-size="data.page_size"
        @update:page="page = $event"
      />
    </div>
  </main>
</template>
