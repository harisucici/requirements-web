<script setup lang="ts">
import type { EmailTemplate } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()
const toast = useToast()

const { data: templates, pending, refresh } = await useAsyncData('admin-templates', () =>
  api.get<EmailTemplate[]>('/admin/templates'),
)

const selected = ref<EmailTemplate | null>(null)
const editSubject = ref('')
const editBody = ref('')
const saveBusy = ref(false)

function selectTemplate(tpl: EmailTemplate) {
  selected.value = tpl
  editSubject.value = tpl.subject
  editBody.value = tpl.body_markdown
}

watch(() => templates.value, (list) => {
  if (list && list.length > 0 && !selected.value) selectTemplate(list[0]!)
}, { immediate: true })

const SAMPLE_VARS: Record<string, string> = {
  user_name: 'Mia', request_id: 'REQ-2026-0001', price: '$15.00',
  delivery_date: 'Oct 15, 2026', payment_link: 'https://pay.example.com/...',
  reason: 'Requires backend infrastructure', suggested_search: 'csv to excel converter',
  questions: '1. Which input formats?\n2. Which output formats?',
  tool_title: 'CSV Converter', tool_url: 'https://tools.requestroom.dev/req-001',
  quick_start: '1. Upload your file\n2. Select columns\n3. Download result',
  free_revisions: '2',
}

const preview = computed(() => {
  let text = editBody.value
  for (const [k, v] of Object.entries(SAMPLE_VARS)) {
    text = text.replaceAll(`{${k}}`, v)
  }
  return text
})

const unreplacedVars = computed(() => {
  const matches = editBody.value.match(/\{(\w+)\}/g)
  if (!matches) return []
  return [...new Set(matches.filter(m => !SAMPLE_VARS[m.slice(1, -1)]))]
})

async function saveTemplate() {
  if (!selected.value || saveBusy.value) return
  saveBusy.value = true
  try {
    await api.patch(`/admin/templates/${selected.value.id}`, {
      subject: editSubject.value,
      body_markdown: editBody.value,
    })
    toast.success('Template saved (version +1)')
    await refresh()
    // Re-select after refresh
    const updated = templates.value?.find(t => t.id === selected.value?.id)
    if (updated) selectTemplate(updated)
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to save')
  } finally { saveBusy.value = false }
}

function insertVariable(varName: string) {
  editBody.value += `{${varName}}`
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
        <h1 class="glitch-title mt-1" data-text="EMAIL TEMPLATES">EMAIL TEMPLATES</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <div v-if="pending" class="admin-panel p-5"><SkeletonLoader type="table" :lines="4" /></div>

    <div v-else-if="templates" class="grid gap-6 lg:grid-cols-[280px_1fr]">
      <!-- Template list -->
      <div class="space-y-2">
        <button
          v-for="tpl in templates" :key="tpl.id"
          class="admin-panel w-full p-4 text-left transition-colors"
          :class="selected?.id === tpl.id ? 'border-[var(--green)]' : 'hover:border-[var(--green)]/40'"
          @click="selectTemplate(tpl)"
        >
          <p class="font-mono text-xs font-bold">{{ tpl.code }}</p>
          <p class="mt-1 text-sm font-semibold line-clamp-1">{{ tpl.subject }}</p>
          <div class="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
            <span>{{ tpl.channel }}</span>
            <span>v{{ tpl.version }}</span>
            <span v-if="tpl.updated_by">{{ tpl.updated_by }}</span>
          </div>
        </button>
      </div>

      <!-- Editor -->
      <div v-if="selected" class="space-y-6">
        <div class="admin-panel p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="eyebrow">{{ selected.code }}</p>
              <h2 class="display mt-1 text-xl font-semibold">{{ selected.subject }}</h2>
            </div>
            <span class="text-xs text-[var(--muted)]">v{{ selected.version }}</span>
          </div>

          <div class="mt-5 space-y-4">
            <div>
              <label for="tpl-subject" class="label">Subject</label>
              <input id="tpl-subject" v-model="editSubject" class="field mt-1 font-mono text-sm" />
            </div>
            <div>
              <label for="tpl-body" class="label">Body (Markdown)</label>
              <textarea id="tpl-body" v-model="editBody" class="field mt-1 font-mono text-sm" rows="12" />
            </div>
          </div>
        </div>

        <!-- Variable docs -->
        <div class="admin-panel p-6">
          <p class="eyebrow">Variables</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="v in selected.variables" :key="v"
              class="inline-flex items-center gap-1 rounded border border-[var(--line)] bg-[rgba(30,107,82,.05)] px-2.5 py-1 text-xs font-mono font-bold hover:border-[var(--green)]"
              @click="insertVariable(v)"
            >
              <AppIcon name="plus" :size="10" /> {{ '{' + v + '}' }}
            </button>
          </div>
          <p v-if="unreplacedVars.length > 0" class="error-text mt-2" role="alert">
            Unreplaced variables in preview: {{ unreplacedVars.join(', ') }}
          </p>
        </div>

        <!-- Preview -->
        <div class="admin-panel p-6">
          <p class="eyebrow">Preview</p>
          <div class="mt-3 border border-[var(--line)] bg-white p-5">
            <p class="text-sm font-bold">{{ editSubject }}</p>
            <pre class="mt-3 whitespace-pre-wrap text-sm leading-6">{{ preview }}</pre>
          </div>
        </div>

        <button :disabled="saveBusy" class="btn btn-primary" @click="saveTemplate">
          <AppIcon v-if="saveBusy" name="spinner" :size="14" class="animate-spin" /> Save template
        </button>
      </div>
    </div>
  </div>
</template>
