<script setup lang="ts">
import type { AnalyticsData } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()
const days = ref(30)

const { data, pending, refresh } = await useAsyncData('admin-analytics', () =>
  api.get<AnalyticsData>(`/admin/analytics?days=${days.value}`),
  { watch: [days] },
)

const RANGE_OPTIONS = [7, 30, 90]

function exportCsv() {
  if (!data.value) return
  const d = data.value
  const rows = [
    ['Metric', 'Value'],
    ['Submissions', d.submissions_total],
    ['Growth %', d.submissions_growth_pct.toFixed(1)],
    ['Acceptance %', d.acceptance_rate_pct.toFixed(1)],
    ['Payment conversion %', d.payment_conversion_pct.toFixed(1)],
    ['On-time delivery %', d.on_time_delivery_pct.toFixed(1)],
    ['Avg rating', d.avg_rating.toFixed(2)],
    ['Avg price', `$${(d.avg_price_cents / 100).toFixed(2)}`],
    ['Refund rate %', d.refund_rate_pct.toFixed(1)],
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `analytics-${days.value}d.csv`; a.click()
  URL.revokeObjectURL(url)
}

const kpis = computed(() => {
  if (!data.value) return []
  const d = data.value
  return [
    { label: 'Submissions', value: d.submissions_total, trend: d.submissions_growth_pct, icon: 'inbox' },
    { label: 'Acceptance', value: `${d.acceptance_rate_pct.toFixed(0)}%`, icon: 'check-circle' },
    { label: 'Payment conv.', value: `${d.payment_conversion_pct.toFixed(0)}%`, icon: 'card' },
    { label: 'On-time delivery', value: `${d.on_time_delivery_pct.toFixed(0)}%`, icon: 'flag' },
    { label: 'Avg rating', value: d.avg_rating.toFixed(1), icon: 'star' },
    { label: 'Avg price', value: formatCents(d.avg_price_cents), icon: 'tag' },
    { label: 'Refund rate', value: `${d.refund_rate_pct.toFixed(1)}%`, icon: 'refund' },
  ]
})
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
          <h1 class="glitch-title mt-1" data-text="ANALYTICS">ANALYTICS</h1>
        </div>
        <span class="ml-auto status-indicator success"></span>
      <div class="flex items-center gap-3">
        <div class="flex overflow-hidden border border-white/20">
          <button
            v-for="r in RANGE_OPTIONS" :key="r"
            class="px-3 py-1.5 text-sm font-semibold transition-colors"
            :class="days === r ? 'bg-white text-[var(--admin-bg)]' : 'text-white/60 hover:text-white'"
            @click="days = r"
          >{{ r }}d</button>
        </div>
        <button class="btn btn-sm border border-white/20 text-white/70 hover:text-white" @click="exportCsv">
          <AppIcon name="download" :size="14" /> CSV
        </button>
      </div>
    </div>

    <div v-if="pending" class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-4 lg:grid-cols-7"><div v-for="i in 7" :key="i" class="admin-panel p-4"><SkeletonLoader :lines="2" /></div></div>
      <div class="admin-panel p-6"><SkeletonLoader type="panel" /></div>
    </div>

    <template v-else-if="data">
      <!-- KPI strip -->
      <div class="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <div v-for="kpi in kpis" :key="kpi.label" class="admin-panel p-4">
          <div class="flex items-center justify-between">
            <span class="text-[.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">{{ kpi.label }}</span>
            <AppIcon :name="kpi.icon" :size="13" class="text-[var(--green)]" />
          </div>
          <p class="display mt-1 text-xl font-bold">{{ kpi.value }}</p>
          <p v-if="'trend' in kpi && kpi.trend !== undefined" class="mt-0.5 text-xs font-semibold" :class="(kpi.trend as number) >= 0 ? 'text-[var(--green)]' : 'text-[var(--status-rejected)]'">
            {{ (kpi.trend as number) >= 0 ? '↑' : '↓' }} {{ Math.abs(kpi.trend as number).toFixed(1) }}%
          </p>
        </div>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <!-- Funnel -->
        <div class="admin-panel p-6">
          <p class="eyebrow">Conversion funnel</p>
          <div class="mt-4">
            <FunnelChart :stages="data.funnel" />
          </div>
        </div>

        <!-- Trend -->
        <div class="admin-panel p-6">
          <p class="eyebrow">Weekly submissions</p>
          <div class="mt-4">
            <TrendChart :data="data.weekly_submissions" label="Submissions" />
          </div>
        </div>

        <!-- Rating distribution -->
        <div class="admin-panel p-6">
          <p class="eyebrow">Rating distribution</p>
          <div class="mt-4 space-y-2">
            <div v-for="item in data.rating_distribution" :key="item.rating" class="flex items-center gap-3">
              <span class="w-12 text-right text-sm font-bold">{{ item.rating }} <AppIcon name="star" :size="12" class="inline text-[var(--yellow)]" /></span>
              <div class="flex-1">
                <div class="h-5 bg-[var(--line)]">
                  <div
                    class="h-full bg-[var(--yellow)] transition-all"
                    :style="{ width: `${data.rating_distribution.length > 0 ? (item.value / Math.max(...data.rating_distribution.map(d => d.value), 1)) * 100 : 0}%` }"
                  />
                </div>
              </div>
              <span class="w-8 text-right text-sm text-[var(--muted)]">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- Category & source -->
        <div class="admin-panel p-6">
          <p class="eyebrow">By category & source</p>
          <div class="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Categories</p>
              <ul class="mt-2 space-y-1">
                <li v-for="item in data.category_distribution" :key="item.category" class="flex justify-between text-sm">
                  <span>{{ item.category || 'Uncategorized' }}</span>
                  <span class="font-bold">{{ item.value }}</span>
                </li>
              </ul>
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Sources</p>
              <ul class="mt-2 space-y-1">
                <li v-for="item in data.source_distribution" :key="item.source" class="flex justify-between text-sm">
                  <span>{{ item.source || 'Direct' }}</span>
                  <span class="font-bold">{{ item.value }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
