<script setup lang="ts">
import type { Feedback, Paginated } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()
const toast = useToast()

const ratingFilter = ref('')
const handleFilter = ref('')
const categoryFilter = ref('')
const sortBy = ref('created')
const page = ref(1)

const { data, pending, refresh } = await useAsyncData('admin-feedback', () => {
  const params = new URLSearchParams()
  params.set('page', String(page.value))
  params.set('page_size', '15')
  params.set('sort', sortBy.value)
  if (ratingFilter.value) params.set('rating', ratingFilter.value)
  if (handleFilter.value) params.set('handle_status', handleFilter.value)
  if (categoryFilter.value) params.set('category', categoryFilter.value)
  return api.get<Paginated<Feedback & { sla_breached?: boolean }>>(`/admin/feedback?${params}`)
}, { watch: [ratingFilter, handleFilter, categoryFilter, sortBy, page] })

// Quick reply
const replyTarget = ref<Feedback | null>(null)
const replyText = ref('')
const replyBusy = ref(false)

async function submitReply() {
  if (!replyTarget.value || !replyText.value.trim() || replyBusy.value) return
  replyBusy.value = true
  try {
    await api.post(`/admin/feedback/${replyTarget.value.id}/reply`, { reply_text: replyText.value })
    toast.success('Reply sent')
    replyTarget.value = null
    replyText.value = ''
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to reply')
  } finally {
    replyBusy.value = false
  }
}

function slaColor(fb: Feedback & { sla_breached?: boolean }) {
  if (fb.handle_status !== 'new') return ''
  if (fb.sla_breached) return 'border-l-4 border-l-[var(--status-rejected)]'
  const hours = (Date.now() - new Date(fb.created_at).getTime()) / 3600000
  if (hours > 8) return 'border-l-4 border-l-[var(--yellow)]'
  return ''
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => i < rating)
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
        <h1 class="glitch-title mt-1" data-text="FEEDBACK">FEEDBACK</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <!-- Filters -->
    <div class="admin-panel mb-4 flex flex-wrap items-center gap-3 p-4">
      <select v-model="ratingFilter" class="field w-auto">
        <option value="">All ratings</option>
        <option v-for="n in 5" :key="n" :value="String(n)">{{ n }} star{{ n > 1 ? 's' : '' }}</option>
      </select>
      <select v-model="handleFilter" class="field w-auto">
        <option value="">All statuses</option>
        <option value="new">New</option>
        <option value="replied">Replied</option>
        <option value="resolved">Resolved</option>
      </select>
      <select v-model="categoryFilter" class="field w-auto">
        <option value="">All categories</option>
        <option value="bug">Bug</option>
        <option value="feature_request">Feature request</option>
        <option value="ux">UX</option>
        <option value="other">Other</option>
      </select>
      <select v-model="sortBy" class="field w-auto">
        <option value="created">Newest first</option>
        <option value="sla">SLA breach first</option>
      </select>
    </div>

    <div v-if="pending" class="admin-panel p-5"><SkeletonLoader type="table" :lines="6" /></div>

    <template v-else-if="data">
      <div class="space-y-3">
        <div
          v-for="fb in data.items" :key="fb.id"
          class="admin-panel p-5 transition-colors" :class="slaColor(fb)"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <NuxtLink :to="`/admin/requests/${fb.short_id}`" class="font-mono text-xs font-bold hover:text-[var(--green)] hover:underline">
                  {{ fb.short_id }}
                </NuxtLink>
                <div class="flex gap-0.5">
                  <AppIcon
                    v-for="(filled, i) in renderStars(fb.rating)" :key="i"
                    name="star" :size="14"
                    :class="filled ? 'text-[var(--yellow)]' : 'text-[var(--line)]'"
                  />
                </div>
                <span
                  v-if="fb.sla_breached"
                  class="rounded bg-[rgba(220,38,38,.1)] px-2 py-0.5 text-xs font-bold text-[var(--status-rejected)]"
                >SLA breached</span>
              </div>
              <p class="mt-2 text-sm leading-6">{{ fb.comment }}</p>
              <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                <span>{{ fb.user_email }}</span>
                <ClientOnly><span>{{ formatRelative(fb.created_at) }}</span></ClientOnly>
                <span v-if="fb.category" class="rounded bg-[rgba(30,107,82,.08)] px-2 py-0.5 font-semibold capitalize text-[var(--green)]">{{ fb.category }}</span>
                <span v-if="fb.nps_score != null">NPS: {{ fb.nps_score }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-bold"
                :class="fb.handle_status === 'new' ? 'bg-[rgba(107,114,128,.12)] text-[var(--status-pending)]' : fb.handle_status === 'replied' ? 'bg-[rgba(37,99,235,.1)] text-[var(--status-approved)]' : 'bg-[rgba(4,120,87,.1)] text-[var(--status-completed)]'"
              >{{ fb.handle_status }}</span>
              <button
                v-if="fb.handle_status === 'new'"
                class="btn btn-sm btn-secondary"
                @click="replyTarget = fb; replyText = ''"
              >Reply</button>
            </div>
          </div>
          <div v-if="fb.reply" class="mt-3 border-t border-[var(--line)] pt-3">
            <p class="text-xs font-bold text-[var(--muted)]">Reply from {{ fb.replied_by }}</p>
            <p class="mt-1 text-sm">{{ fb.reply }}</p>
          </div>
        </div>
      </div>

      <div class="admin-panel mt-4 p-4">
        <Pagination :total="data.total" :page="page" :page-size="data.page_size" @update:page="(p: number) => page = p" />
      </div>
    </template>

    <!-- Reply modal -->
    <Modal :open="!!replyTarget" title="Reply to feedback" @close="replyTarget = null">
      <div v-if="replyTarget" class="space-y-4">
        <div class="border-l-2 border-[var(--green)] pl-4">
          <p class="text-sm text-[var(--muted)]">{{ replyTarget.user_email }} — {{ replyTarget.rating }} stars</p>
          <p class="mt-1 text-sm">{{ replyTarget.comment }}</p>
        </div>
        <div>
          <label for="reply-text" class="label">Your reply</label>
          <textarea id="reply-text" v-model="replyText" class="field mt-1" rows="4" placeholder="Write your reply..." />
        </div>
      </div>
      <template #footer>
        <button class="btn btn-sm btn-secondary" @click="replyTarget = null">Cancel</button>
        <button :disabled="replyBusy || !replyText.trim()" class="btn btn-sm btn-primary" @click="submitReply">
          <AppIcon v-if="replyBusy" name="spinner" :size="14" class="animate-spin" /> Send reply
        </button>
      </template>
    </Modal>
  </div>
</template>
