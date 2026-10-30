<script setup lang="ts">
import type { AutomationRule } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()
const toast = useToast()

const { data: rules, pending, refresh } = await useAsyncData('admin-automation', () =>
  api.get<AutomationRule[]>('/admin/settings/automation'),
)

const editableRules = ref<AutomationRule[]>([])
const pauseAll = ref(false)
const saveBusy = ref(false)

watch(() => rules.value, (r) => {
  if (r) editableRules.value = JSON.parse(JSON.stringify(r))
}, { immediate: true })

async function save() {
  if (saveBusy.value) return
  saveBusy.value = true
  try {
    await api.patch('/admin/settings/automation', { rules: editableRules.value, pause_all: pauseAll.value })
    toast.success('Automation rules saved')
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to save')
  } finally { saveBusy.value = false }
}

function priorityBadge(p: string) {
  const map: Record<string, string> = {
    P0: 'bg-[rgba(220,38,38,.1)] text-[var(--status-rejected)]',
    P1: 'bg-[rgba(240,189,89,.15)] text-[var(--yellow)]',
    P2: 'bg-[rgba(107,114,128,.12)] text-[var(--status-pending)]',
  }
  return map[p] ?? ''
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
        <h1 class="glitch-title mt-1" data-text="AUTOMATION RULES">AUTOMATION RULES</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <div v-if="pending" class="admin-panel p-5"><SkeletonLoader type="table" :lines="10" /></div>

    <template v-else>
      <div class="space-y-2">
        <div
          v-for="(rule, i) in editableRules" :key="rule.id"
          class="admin-panel flex items-center gap-4 p-4 transition-colors"
          :class="{ 'opacity-50': pauseAll || !rule.is_enabled }"
        >
          <!-- Code badge -->
          <span class="shrink-0 font-mono text-xs font-bold text-[var(--green)]">{{ rule.code }}</span>

          <!-- Description -->
          <p class="min-w-0 flex-1 text-sm">{{ rule.description }}</p>

          <!-- Threshold -->
          <div class="flex shrink-0 items-center gap-2">
            <template v-if="rule.threshold_days != null">
              <input v-model.number="editableRules[i]!.threshold_days" type="number" min="0" class="field w-16 py-1 text-center text-sm" />
              <span class="text-xs text-[var(--muted)]">days</span>
            </template>
            <template v-else-if="rule.threshold_hours != null">
              <input v-model.number="editableRules[i]!.threshold_hours" type="number" min="0" class="field w-16 py-1 text-center text-sm" />
              <span class="text-xs text-[var(--muted)]">hours</span>
            </template>
            <span v-else class="text-xs text-[var(--muted)]">—</span>
          </div>

          <!-- Priority -->
          <span class="shrink-0 rounded-full px-2 py-0.5 text-[.65rem] font-bold" :class="priorityBadge(rule.priority)">{{ rule.priority }}</span>

          <!-- Toggle -->
          <label class="relative inline-flex cursor-pointer items-center">
            <input v-model="editableRules[i]!.is_enabled" type="checkbox" class="peer sr-only" />
            <div class="h-6 w-11 rounded-full bg-[var(--line)] peer-checked:bg-[var(--green)] transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-full" />
          </label>
        </div>
      </div>

      <button :disabled="saveBusy" class="btn btn-primary mt-6" @click="save">
        <AppIcon v-if="saveBusy" name="spinner" :size="14" class="animate-spin" /> Save rules
      </button>
    </template>
  </div>
</template>
