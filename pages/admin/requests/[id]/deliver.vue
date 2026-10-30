<script setup lang="ts">
import type { ChecklistItem } from '~/types/api'
import { LAUNCH_CHECKLIST } from '~/utils/constants'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const api = useApi()
const toast = useToast()
const shortId = computed(() => route.params.id as string)

// Form fields
const toolUrl = ref('')
const title = ref('')
const previewImages = ref<string[]>([''])
const quickStartSteps = ref<string[]>(['', '', ''])
const docUrl = ref('')
const videoUrl = ref('')
const category = ref('')

const checklist = ref<ChecklistItem[]>(
  LAUNCH_CHECKLIST.map(item => ({
    key: item.key,
    label: item.label,
    checked: false,
    checked_by: null,
    checked_at: null,
  })),
)

const busy = ref(false)
const inlineErrors = ref<string[]>([])

function addImage() { previewImages.value.push('') }
function removeImage(i: number) { if (previewImages.value.length > 1) previewImages.value.splice(i, 1) }
function addStep() { if (quickStartSteps.value.length < 5) quickStartSteps.value.push('') }
function removeStep(i: number) { if (quickStartSteps.value.length > 3) quickStartSteps.value.splice(i, 1) }

const allChecked = computed(() => checklist.value.every(c => c.checked))
const fieldsComplete = computed(() =>
  toolUrl.value.trim()
  && title.value.trim()
  && previewImages.value.filter(p => p.trim()).length >= 1
  && quickStartSteps.value.filter(s => s.trim()).length >= 3
)

const canDeliver = computed(() => allChecked.value && fieldsComplete.value)

async function deliver() {
  inlineErrors.value = []
  if (!canDeliver.value) {
    const missing: string[] = []
    if (!toolUrl.value.trim()) missing.push('Tool URL')
    if (!title.value.trim()) missing.push('Title')
    if (previewImages.value.filter(p => p.trim()).length < 1) missing.push('At least 1 preview image')
    if (quickStartSteps.value.filter(s => s.trim()).length < 3) missing.push('At least 3 quick-start steps')
    const uncheckedItems = checklist.value.filter(c => !c.checked).map(c => c.label)
    if (uncheckedItems.length > 0) missing.push(`Checklist: ${uncheckedItems.join(', ')}`)
    inlineErrors.value = missing
    return
  }

  busy.value = true
  try {
    await api.post(`/admin/requests/${shortId.value}/deliver`, {
      tool_url: toolUrl.value.trim(),
      title: title.value.trim(),
      preview_images: previewImages.value.filter(p => p.trim()),
      quick_start_steps: quickStartSteps.value.filter(s => s.trim()),
      doc_url: docUrl.value.trim() || null,
      video_url: videoUrl.value.trim() || null,
      category: category.value || null,
      checklist: checklist.value,
    })
    toast.success('Request delivered successfully!')
    await navigateTo(`/admin/requests/${shortId.value}`)
  } catch (err: any) {
    if (err?.code === 'CHECKLIST_INCOMPLETE') {
      inlineErrors.value = [`Checklist incomplete: ${err.payload?.missing_keys?.join(', ') ?? 'check all items'}`]
    } else if (err?.code === 'DELIVERY_FIELDS_MISSING') {
      inlineErrors.value = [`Missing required fields: ${err.payload?.missing_fields?.join(', ') ?? 'fill all required fields'}`]
    } else if (err?.code === 'INVALID_TRANSITION') {
      toast.error('This request has moved on')
    } else {
      toast.error(err?.message ?? 'Failed to deliver')
    }
  } finally {
    busy.value = false
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
        <h1 class="display text-2xl font-semibold text-white">Deliver tool</h1>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <!-- Delivery form -->
      <div class="space-y-6">
        <div class="admin-panel p-6">
          <p class="eyebrow">Tool details</p>

          <div class="mt-4 space-y-4">
            <div>
              <label for="deliver-url" class="label">Tool URL *</label>
              <input id="deliver-url" v-model="toolUrl" type="url" class="field mt-1" placeholder="https://tools.requestroom.dev/..." required />
            </div>

            <div>
              <label for="deliver-title" class="label">Title *</label>
              <input id="deliver-title" v-model="title" class="field mt-1" placeholder="Your Tool Name" required />
            </div>

            <div>
              <label class="label">Preview images * (at least 1 URL)</label>
              <div class="mt-1 space-y-2">
                <div v-for="(img, i) in previewImages" :key="i" class="flex gap-2">
                  <input v-model="previewImages[i]" class="field flex-1" placeholder="https://...screenshot.png" />
                  <button v-if="previewImages.length > 1" class="btn btn-sm btn-ghost" @click="removeImage(i)">
                    <AppIcon name="trash" :size="14" />
                  </button>
                </div>
              </div>
              <button class="btn btn-sm btn-ghost mt-2" @click="addImage">
                <AppIcon name="plus" :size="13" /> Add image
              </button>
            </div>

            <div>
              <label class="label">Quick-start steps * (3-5 steps)</label>
              <div class="mt-1 space-y-2">
                <div v-for="(step, i) in quickStartSteps" :key="i" class="flex items-start gap-2">
                  <span class="mt-2.5 text-sm font-bold text-[var(--muted)]">{{ i + 1 }}.</span>
                  <input v-model="quickStartSteps[i]" class="field flex-1" :placeholder="`Step ${i + 1}`" />
                  <button v-if="quickStartSteps.length > 3" class="mt-1 btn btn-sm btn-ghost" @click="removeStep(i)">
                    <AppIcon name="trash" :size="14" />
                  </button>
                </div>
              </div>
              <button v-if="quickStartSteps.length < 5" class="btn btn-sm btn-ghost mt-2" @click="addStep">
                <AppIcon name="plus" :size="13" /> Add step
              </button>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="deliver-doc" class="label">Documentation URL</label>
                <input id="deliver-doc" v-model="docUrl" type="url" class="field mt-1" placeholder="https://docs..." />
              </div>
              <div>
                <label for="deliver-video" class="label">Video URL</label>
                <input id="deliver-video" v-model="videoUrl" type="url" class="field mt-1" placeholder="https://youtube..." />
              </div>
            </div>

            <div>
              <label for="deliver-category" class="label">Category</label>
              <select id="deliver-category" v-model="category" class="field mt-1">
                <option value="">Select a category</option>
                <option value="Data conversion">Data conversion</option>
                <option value="Text processing">Text processing</option>
                <option value="Creative tool">Creative tool</option>
                <option value="Calculator">Calculator</option>
                <option value="Developer tool">Developer tool</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Inline errors -->
        <div v-if="inlineErrors.length > 0" class="admin-panel border-[var(--status-rejected)] p-5">
          <p class="error-text font-bold" role="alert">Cannot deliver yet:</p>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--status-rejected)]">
            <li v-for="err in inlineErrors" :key="err">{{ err }}</li>
          </ul>
        </div>
      </div>

      <!-- Checklist sidebar -->
      <div class="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <div class="admin-panel p-6">
          <p class="eyebrow">Launch checklist</p>
          <p class="mt-1 text-sm text-[var(--muted)]">All items must be checked before delivery.</p>

          <div class="mt-4 space-y-3">
            <label
              v-for="item in checklist" :key="item.key"
              class="flex cursor-pointer items-start gap-3"
              :class="!item.checked ? 'opacity-80' : ''"
            >
              <input
                v-model="item.checked"
                type="checkbox"
                class="mt-0.5 h-5 w-5 shrink-0"
              />
              <div>
                <span class="text-sm font-semibold" :class="item.checked ? 'line-through text-[var(--muted)]' : ''">{{ item.label }}</span>
                <p v-if="item.checked_by" class="text-xs text-[var(--muted)]">
                  {{ item.checked_by }} at <ClientOnly>{{ formatDateTime(item.checked_at ?? undefined) }}</ClientOnly>
                </p>
              </div>
            </label>
          </div>

          <div class="mt-6 border-t border-[var(--line)] pt-4">
            <p class="text-sm">
              <span :class="allChecked ? 'text-[var(--green)] font-bold' : 'text-[var(--status-rejected)] font-bold'">
                {{ checklist.filter(c => c.checked).length }} / {{ checklist.length }}
              </span>
              items completed
            </p>
          </div>
        </div>

        <button
          :disabled="busy || !canDeliver"
          class="btn btn-primary w-full"
          @click="deliver"
        >
          <AppIcon v-if="busy" name="spinner" :size="16" class="animate-spin" />
          <template v-else>
            <AppIcon name="flag" :size="16" /> Deliver tool
          </template>
        </button>
      </div>
    </div>
  </div>
</template>
