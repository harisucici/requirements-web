<script setup lang="ts">
import type { StatusHistoryEntry, NotificationLog } from '~/types/api'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const api = useApi()
const toast = useToast()
const shortId = computed(() => route.params.id as string)

interface HistoryData {
  status_history: StatusHistoryEntry[]
  notification_logs: NotificationLog[]
}

const { data, pending } = await useAsyncData(
  () => `admin-request-history-${shortId.value}`,
  () => api.get<HistoryData>(`/admin/requests/${shortId.value}/history`),
)

async function resend(logId: string) {
  try {
    await api.post(`/admin/notifications/${logId}/resend`, {})
    toast.success('Notification resent')
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to resend')
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center gap-4">
      <NuxtLink :to="`/admin/requests/${shortId}`" class="btn btn-sm btn-ghost text-white/60 hover:text-white">
        <AppIcon name="back" :size="14" /> Back to request
      </NuxtLink>
      <div>
        <span class="font-mono text-xs text-white/40">{{ shortId }}</span>
        <h1 class="display text-2xl font-semibold text-white">History & notifications</h1>
      </div>
    </div>

    <div v-if="pending" class="admin-panel p-6"><SkeletonLoader type="table" :lines="8" /></div>

    <template v-else-if="data">
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Status History -->
        <div class="admin-panel p-6">
          <p class="eyebrow">Status changes ({{ data.status_history.length }})</p>
          <div v-if="data.status_history.length === 0" class="mt-4 py-6 text-center text-sm text-[var(--muted)]">
            No status changes recorded.
          </div>
          <ol v-else class="relative mt-4 space-y-0 border-l-2 border-[var(--line)] pl-6">
            <li v-for="entry in [...data.status_history].reverse()" :key="entry.id" class="relative pb-6">
              <span class="absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full bg-[var(--green)] ring-4 ring-[var(--paper)]" />
              <div class="flex flex-wrap items-center gap-2">
                <span v-if="entry.from_status" class="text-xs">
                  <StatusBadge :status="entry.from_status" size="sm" />
                </span>
                <AppIcon name="arrow" :size="12" class="text-[var(--muted)]" />
                <StatusBadge :status="entry.to_status" size="sm" />
              </div>
              <p class="mt-1 text-sm">
                <span class="font-semibold">{{ entry.actor_name }}</span>
                <span class="text-[var(--muted)]"> ({{ entry.actor_type }})</span>
              </p>
              <p v-if="entry.reason" class="mt-1 text-sm text-[var(--muted)]">{{ entry.reason }}</p>
              <p class="mt-1 text-xs text-[var(--muted)]">
                <ClientOnly>{{ formatDateTime(entry.created_at) }}</ClientOnly>
              </p>
            </li>
          </ol>
        </div>

        <!-- Notification Logs -->
        <div class="admin-panel p-6">
          <p class="eyebrow">Notifications ({{ data.notification_logs.length }})</p>
          <div v-if="data.notification_logs.length === 0" class="mt-4 py-6 text-center text-sm text-[var(--muted)]">
            No notifications sent for this request.
          </div>
          <div v-else class="mt-4 overflow-x-auto">
            <table class="w-full min-w-[500px] border-collapse text-left text-sm">
              <thead>
                <tr class="border-b border-[var(--line)]">
                  <th class="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Template</th>
                  <th class="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Channel</th>
                  <th class="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Recipient</th>
                  <th class="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Status</th>
                  <th class="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in data.notification_logs" :key="log.id" class="border-b border-[var(--line)]/60">
                  <td class="px-3 py-2.5 font-mono text-xs">{{ log.template_code }}</td>
                  <td class="px-3 py-2.5">
                    <span class="inline-flex items-center gap-1 text-xs">
                      <AppIcon :name="log.channel === 'email' ? 'mail' : log.channel === 'slack' ? 'share' : 'bell'" :size="12" />
                      {{ log.channel }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-xs text-[var(--muted)]">{{ log.recipient }}</td>
                  <td class="px-3 py-2.5">
                    <span
                      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                      :class="log.status === 'sent' ? 'bg-[rgba(4,120,87,.1)] text-[var(--status-completed)]' : log.status === 'failed' ? 'bg-[rgba(220,38,38,.1)] text-[var(--status-rejected)]' : 'bg-[rgba(107,114,128,.1)] text-[var(--status-pending)]'"
                    >
                      <AppIcon :name="log.status === 'sent' ? 'check-circle' : log.status === 'failed' ? 'x-circle' : 'clock'" :size="11" />
                      {{ log.status }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5">
                    <button
                      v-if="log.status === 'failed'"
                      class="btn btn-sm btn-ghost text-xs"
                      @click="resend(log.id)"
                    >
                      <AppIcon name="refresh" :size="12" /> Resend
                    </button>
                    <span v-else class="text-xs text-[var(--muted)]">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
