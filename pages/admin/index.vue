<script setup lang="ts">
import type { DashboardData } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()

const { data, pending, error, refresh } = await useAsyncData('admin-dashboard', () =>
  api.get<DashboardData>('/admin/dashboard'),
)

const kpiCards = computed(() => {
  if (!data.value) return []
  const k = data.value.kpis
  return [
    { label: 'PENDING REVIEW', value: k.pending_review, icon: 'clock', tone: k.pending_review > 5 ? 'warning' as const : 'default' as const },
    { label: 'DUE TODAY', value: k.due_today, icon: 'calendar', tone: k.due_today > 0 ? 'warning' as const : 'default' as const },
    { label: 'OVERDUE', value: k.overdue, icon: 'alert', tone: k.overdue > 0 ? 'danger' as const : 'default' as const },
    { label: 'NEW FEEDBACK', value: k.new_feedback, icon: 'star', tone: k.new_feedback > 0 ? 'warning' as const : 'default' as const },
    { label: 'UNREAD NOTIFICATIONS', value: k.unread_notifications, icon: 'bell', tone: 'default' as const },
  ]
})
</script>

<template>
  <div class="page-container">
    <div class="mechanical-bg"></div>
    <div class="scanline"></div>
    
    <main class="page-content">
      <div class="section-header mechanical-enter">
        <div class="corner-bracket tl"></div>
        <div class="corner-bracket tr"></div>
        <div>
          <div class="data-label">ADMIN CONSOLE</div>
          <h1 class="glitch-title mt-2" data-text="TEAM WORKSPACE">TEAM WORKSPACE</h1>
        </div>
        <button class="btn-mechanical ml-auto" @click="refresh()">
          ⟳ REFRESH
        </button>
      </div>

      <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mt-6">
        <div v-for="i in 5" :key="i" class="hud-panel p-5">
          <span class="screw screw-tl"></span>
          <span class="screw screw-tr"></span>
          <span class="screw screw-bl"></span>
          <span class="screw screw-br"></span>
          <SkeletonLoader :lines="2" />
        </div>
      </div>

      <div v-else-if="error" class="hud-panel p-8 mt-6">
        <span class="screw screw-tl"></span>
        <span class="screw screw-tr"></span>
        <span class="screw screw-bl"></span>
        <span class="screw screw-br"></span>
        <EmptyState title="SYSTEM ERROR" description="数据加载失败，请检查连接" icon="alert" :dark="false" />
      </div>

      <template v-else-if="data">
        <!-- KPI Cards -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mt-6">
          <div v-for="card in kpiCards" :key="card.label" class="hud-panel p-5 mechanical-fade-in">
            <span class="screw screw-tl"></span>
            <span class="screw screw-tr"></span>
            <span class="screw screw-bl"></span>
            <span class="screw screw-br"></span>
            
            <div class="flex items-start justify-between">
              <div class="data-label">{{ card.label }}</div>
              <span
                class="grid h-8 w-8 place-items-center rounded-full"
                :class="card.tone === 'danger' ? 'status-indicator danger' : card.tone === 'warning' ? 'status-indicator warning' : 'status-indicator success'"
              >
                <AppIcon :name="card.icon" :size="15" />
              </span>
            </div>
            <p class="data-value mt-3">{{ card.value }}</p>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2 mt-8">
          <!-- Action Items -->
          <div class="hud-panel p-6">
            <span class="screw screw-tl"></span>
            <span class="screw screw-tr"></span>
            <span class="screw screw-bl"></span>
            <span class="screw screw-br"></span>
            
            <div class="data-label">ACTION ITEMS</div>
            <h2 class="mt-1 text-xl font-semibold" style="color: var(--color-text)">NEEDS ATTENTION</h2>
            
            <div v-if="data.todos.length === 0" class="mt-4 py-6 text-center text-sm" style="color: var(--color-text-muted)">
              所有任务已完成
            </div>
            
            <ul v-else class="mt-4 divide-y" style="border-color: var(--color-border)">
              <li v-for="todo in data.todos" :key="todo.id" class="flex items-center gap-3 py-3">
                <span class="status-indicator warning"></span>
                <div class="min-w-0 flex-1">
                  <NuxtLink
                    :to="`/admin/requests/${todo.short_id}`"
                    class="link-mechanical"
                  >
                    {{ todo.label }}
                  </NuxtLink>
                  <p v-if="todo.due_at" class="text-xs mt-1" style="color: var(--color-text-muted)">
                    截止 <ClientOnly>{{ formatRelative(todo.due_at) }}</ClientOnly>
                  </p>
                </div>
                <span class="text-xs font-bold uppercase" style="color: var(--color-accent)">{{ todo.kind }}</span>
              </li>
            </ul>
          </div>

          <!-- Alerts -->
          <div class="hud-panel p-6">
            <span class="screw screw-tl"></span>
            <span class="screw screw-tr"></span>
            <span class="screw screw-bl"></span>
            <span class="screw screw-br"></span>
            
            <div class="data-label">SYSTEM ALERTS</div>
            <h2 class="mt-1 text-xl font-semibold" style="color: var(--color-text)">NOTICES</h2>
            
            <div v-if="data.alerts.length === 0" class="mt-4 py-6 text-center text-sm" style="color: var(--color-text-muted)">
              无活动警报
            </div>
            
            <ul v-else class="mt-4 space-y-3">
              <li
                v-for="alert in data.alerts" :key="alert.id"
                class="alert-mechanical p-3 text-sm"
                :class="alert.level"
              >
                <div class="flex items-start gap-2">
                  <span :class="alert.level === 'danger' ? 'status-indicator danger' : alert.level === 'warning' ? 'status-indicator warning' : 'status-indicator success'"></span>
                  <div class="min-w-0 flex-1">
                    <p style="color: var(--color-text)">{{ alert.message }}</p>
                    <NuxtLink
                      v-if="alert.short_id"
                      :to="`/admin/requests/${alert.short_id}`"
                      class="link-mechanical mt-1 inline-block text-xs"
                    >
                      查看 {{ alert.short_id }} →
                    </NuxtLink>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
