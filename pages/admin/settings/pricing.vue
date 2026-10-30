<script setup lang="ts">
import type { PricingRule } from '~/types/api'
import { RUSH_SURCHARGE_RATE, FREE_REVISION_TIERS, EXTRA_REVISION_FEE_CENTS } from '~/utils/constants'

definePageMeta({ layout: 'admin' })

const api = useApi()
const toast = useToast()

const { data: rules, pending, refresh } = await useAsyncData('admin-pricing', () =>
  api.get<PricingRule[]>('/admin/settings/pricing'),
)

const editableRules = ref<PricingRule[]>([])
const saveBusy = ref(false)

watch(() => rules.value, (r) => {
  if (r) editableRules.value = JSON.parse(JSON.stringify(r))
}, { immediate: true })

async function save() {
  if (saveBusy.value) return
  saveBusy.value = true
  try {
    await api.patch('/admin/settings/pricing', { rules: editableRules.value })
    toast.success('Pricing rules saved')
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to save')
  } finally { saveBusy.value = false }
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
        <div class="data-label">CONFIGURATION MODULE</div>
        <h1 class="glitch-title mt-1" data-text="PRICING RULES">PRICING RULES</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <div v-if="pending" class="admin-panel p-5"><SkeletonLoader type="table" :lines="5" /></div>

    <template v-else>
      <div class="admin-panel overflow-x-auto">
        <table class="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-[var(--line)]">
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Min hours</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Max hours</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Price (cents)</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Price range</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Delivery days</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Decision</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rule, i) in editableRules" :key="rule.id" class="border-b border-[var(--line)]/60">
              <td class="px-4 py-3">
                <input v-model.number="rule.min_hours" type="number" min="0" step="0.5" class="field w-20 py-1 text-sm" />
              </td>
              <td class="px-4 py-3">
                <input v-model.number="rule.max_hours" type="number" min="0" step="0.5" class="field w-20 py-1 text-sm" />
              </td>
              <td class="px-4 py-3">
                <input v-model.number="rule.suggested_price_cents" type="number" min="0" class="field w-24 py-1 text-sm" />
              </td>
              <td class="px-4 py-3 text-sm text-[var(--muted)]">
                {{ rule.price_range_cents ? `${formatCents(rule.price_range_cents[0])} – ${formatCents(rule.price_range_cents[1])}` : '—' }}
              </td>
              <td class="px-4 py-3">
                <input v-model.number="rule.standard_delivery_days" type="number" min="0" class="field w-16 py-1 text-sm" />
              </td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  :class="rule.decision === 'accept' ? 'bg-[rgba(4,120,87,.1)] text-[var(--green)]' : rule.decision.includes('reject') ? 'bg-[rgba(220,38,38,.1)] text-[var(--status-rejected)]' : 'bg-[rgba(240,189,89,.15)] text-[var(--yellow)]'"
                >{{ rule.decision }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Rush surcharge & free revision tiers (display) -->
      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <div class="admin-panel p-5">
          <p class="eyebrow">Rush surcharge</p>
          <p class="display mt-2 text-2xl font-bold">{{ (RUSH_SURCHARGE_RATE * 100).toFixed(0) }}%</p>
          <p class="text-sm text-[var(--muted)]">Applied on top of standard price for rush delivery.</p>
        </div>
        <div class="admin-panel p-5">
          <p class="eyebrow">Free revision tiers</p>
          <ul class="mt-2 space-y-1 text-sm">
            <li v-for="tier in FREE_REVISION_TIERS" :key="tier.max_cents">
              <span class="font-bold">{{ tier.max_cents === Infinity ? '$50+' : `< ${formatCents(tier.max_cents)}` }}</span>
              → {{ tier.revisions }} free revision(s)
            </li>
          </ul>
          <p class="mt-2 text-xs text-[var(--muted)]">Extra revision fee: {{ formatCents(EXTRA_REVISION_FEE_CENTS) }}</p>
        </div>
      </div>

      <button :disabled="saveBusy" class="btn btn-primary mt-6" @click="save">
        <AppIcon v-if="saveBusy" name="spinner" :size="14" class="animate-spin" /> Save pricing rules
      </button>
    </template>
  </div>
</template>
