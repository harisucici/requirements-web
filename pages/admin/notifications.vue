<script setup lang="ts">
import type { NotificationLog, Paginated } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()
const toast = useToast()

const channelFilter = ref('')
const statusFilter = ref('')
const unreadOnly = ref(false)
const page = ref(1)

const { data, pending, refresh } = await useAsyncData('admin-notifications', () => {
  const params = new URLSearchParams()
  params.set('page', String(page.value))
  params.set('page_size', '20')
  if (channelFilter.value) params.set('channel', channelFilter.value)
  if (statusFilter.value) params.set('status', statusFilter.value)
  if (unreadOnly.value) params.set('unread_only', '1')
  return api.get<Paginated<NotificationLog> & { unread_count: number }>(`/admin/notifications?${params}`)
}, { watch: [channelFilter, statusFilter, unreadOnly, page] })

// Sync unread count to sidebar
watch(() => data.value?.unread_count, (count) => {
  if (count != null) useState('admin-unread-count', () => 0).value = count
}, { immediate: true })

async function markRead(ids: string[]) {
  try {
    await api.post('/admin/notifications/read', { ids })
    await refresh()
  } catch { /* ignore */ }
}

async function resend(logId: string) {
  try {
    await api.post(`/admin/notifications/${logId}/resend`, {})
    toast.success('Notification resent successfully')
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to resend')
  }
}

function channelIcon(ch: string) {
  const map: Record<string, string> = { email: 'mail', inapp: 'bell', slack: 'share', browser: 'eye' }
  return map[ch] ?? 'info'
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    sent: 'bg-[rgba(4,120,87,.1)] text-[var(--status-completed)]',
    failed: 'bg-[rgba(220,38,38,.1)] text-[var(--status-rejected)]',
    queued: 'bg-[rgba(107,114,128,.12)] text-[var(--status-pending)]',
    suppressed: 'bg-[rgba(156,163,175,.15)] text-[var(--status-canceled)]',
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
        <div class="data-label">CARE MODULE</div>
        <h1 class="glitch-title mt-1" data-text="NOTIFICATIONS">NOTIFICATIONS</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <!-- Filters -->
    <div class="admin-panel mb-4 flex flex-wrap items-center gap-3 p-4">
      <select v-model="channelFilter" class="field w-auto">
        <option value="">All channels</option>
        <option value="email">Email</option>
        <option value="inapp">In-app</option>
        <option value="slack">Slack</option>
        <option value="browser">Browser</option>
      </select>
      <select v-model="statusFilter" class="field w-auto">
        <option value="">All statuses</option>
        <option value="sent">Sent</option>
        <option value="failed">Failed</option>
        <option value="queued">Queued</option>
      </select>
      <label class="flex items-center gap-2 text-sm">
        <input v-model="unreadOnly" type="checkbox" class="h-4 w-4" />
        Unread only
      </label>
    </div>

    <div v-if="pending" class="admin-panel p-5"><SkeletonLoader type="table" :lines="8" /></div>

    <template v-else-if="data">
      <div class="space-y-2">
        <div
          v-for="ntf in data.items" :key="ntf.id"
          class="admin-panel flex items-start gap-4 p-4 transition-colors cursor-pointer"
          :class="!ntf.is_read ? 'border-l-4 border-l-[var(--coral)]' : ''"
          @click="!ntf.is_read && markRead([ntf.id])"
        >
          <span class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full" :class="ntf.status === 'failed' ? 'bg-[rgba(220,38,38,.1)] text-[var(--status-rejected)]' : 'bg-[rgba(30,107,82,.08)] text-[var(--green)]'">
            <AppIcon :name="channelIcon(ntf.channel)" :size="16" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold" :class="!ntf.is_read ? 'text-[var(--ink)]' : 'text-[var(--muted)]'">{{ ntf.title }}</p>
              <span class="rounded-full px-2 py-0.5 text-[.65rem] font-bold" :class="statusBadge(ntf.status)">{{ ntf.status }}</span>
            </div>
            <p class="mt-1 text-sm text-[var(--muted)] line-clamp-2">{{ ntf.body }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
              <ClientOnly><span>{{ formatRelative(ntf.created_at) }}</span></ClientOnly>
              <span class="font-mono">{{ ntf.template_code }}</span>
              <span v-if="ntf.short_id">
                <NuxtLink :to="`/admin/requests/${ntf.short_id}`" class="font-bold text-[var(--green)] hover:underline">{{ ntf.short_id }}</NuxtLink>
              </span>
              <span v-if="ntf.error_message" class="text-[var(--status-rejected)]">{{ ntf.error_message }}</span>
              <span v-if="ntf.retry_count > 0">Retries: {{ ntf.retry_count }}</span>
            </div>
          </div>
          <div class="shrink-0">
            <button
              v-if="ntf.status === 'failed'"
              class="btn btn-sm btn-secondary"
              @click.stop="resend(ntf.id)"
            >
              <AppIcon name="refresh" :size="13" /> Resend
            </button>
          </div>
        </div>
      </div>

      <EmptyState v-if="data.items.length === 0" title="No notifications" description="Nothing to show with current filters." icon="bell" />

      <div class="admin-panel mt-4 p-4">
        <Pagination :total="data.total" :page="page" :page-size="data.page_size" @update:page="(p: number) => page = p" />
      </div>
    </template>
  </div>
</template>
