<script setup lang="ts">
import type { Deliverable, Feedback, RevisionQuota } from '~/types/api'
import { formatCents } from '~/utils/format'

useHead({ title: 'Your tool is ready - request/room' })
const route = useRoute()
const api = useApi()
const token = String(route.params.token)

interface DeliveryData {
  deliverable: Deliverable | null
  feedback: Feedback | null
  revision_quota: RevisionQuota
}

const { data } = await useAsyncData(`delivery-${token}`, () =>
  api.get<DeliveryData>(`/requests/${token}/delivery`),
)

const shareUrl = computed(() => typeof window !== 'undefined' ? window.location.origin + `/request/track/${token}` : '')
</script>

<template>
  <main class="mx-auto max-w-3xl px-5 pb-20 pt-12 lg:px-8">
    <SkeletonLoader v-if="!data" type="panel" />

    <template v-else-if="data?.deliverable">
      <section class="panel p-7 sm:p-10">
        <div class="section-header mechanical-enter mb-8">
          <div class="corner-bracket tl"></div><div class="corner-bracket tr"></div>
          <div class="corner-bracket bl"></div><div class="corner-bracket br"></div>
          <span class="screw screw-tl"></span><span class="screw screw-tr"></span>
          <div>
            <div class="data-label">DELIVERY COMPLETE</div>
            <h1 class="glitch-title mt-1" :data-text="data.deliverable.title">{{ data.deliverable.title }}</h1>
          </div>
          <span class="ml-auto status-indicator success"></span>
        </div>

        <!-- Preview images -->
        <div class="mt-8 space-y-4">
          <div v-for="(img, i) in data.deliverable.preview_images" :key="i" class="flex h-48 items-center justify-center border border-[var(--line)] bg-[rgba(30,107,82,.04)] text-[var(--muted)]">
            <div class="text-center">
              <AppIcon name="image" :size="32" />
              <p class="mt-2 text-sm">{{ img }}</p>
            </div>
          </div>
        </div>

        <!-- Quick start -->
        <div class="mt-8">
          <h2 class="font-semibold">Quick start</h2>
          <ol class="mt-3 space-y-3">
            <li v-for="(step, i) in data.deliverable.quick_start_steps" :key="i" class="flex gap-3">
              <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--green)] text-xs font-bold text-white">{{ i + 1 }}</span>
              <span class="leading-7 text-[var(--muted)]">{{ step }}</span>
            </li>
          </ol>
        </div>

        <!-- Open tool button -->
        <div class="mt-8">
          <a :href="data.deliverable.tool_url" target="_blank" rel="noopener" class="btn btn-primary w-full sm:w-auto">
            <AppIcon name="external" :size="16" />
            Open Tool
          </a>
        </div>

        <!-- Actions -->
        <div class="mt-10 flex flex-wrap gap-4 border-t border-[var(--line)] pt-6">
          <NuxtLink :to="`/request/track/${token}/feedback`" class="btn btn-secondary">
            <AppIcon name="star" :size="15" />
            {{ data.feedback ? 'Edit Feedback' : 'Leave Feedback' }}
          </NuxtLink>
          <NuxtLink :to="`/request/track/${token}/modify`" class="btn btn-secondary">
            <AppIcon name="refresh" :size="15" />
            Request Modification
          </NuxtLink>
        </div>

        <!-- Revision quota -->
        <div class="mt-6 text-sm text-[var(--muted)]">
          <span v-if="data.revision_quota.remaining > 0">{{ data.revision_quota.remaining }} free revision{{ data.revision_quota.remaining !== 1 ? 's' : '' }} remaining</span>
          <span v-else>No free revisions left — additional revisions are {{ formatCents(data.revision_quota.extra_revision_fee_cents) }} each</span>
        </div>

        <!-- Feedback already left -->
        <div v-if="data.feedback" class="mt-6 border-t border-[var(--line)] pt-6">
          <h3 class="font-semibold">Your feedback</h3>
          <div class="mt-2 flex items-center gap-2">
            <span v-for="star in 5" :key="star" class="text-lg" :class="star <= data.feedback!.rating ? 'text-[var(--yellow)]' : 'text-[var(--line)]'">★</span>
          </div>
          <p v-if="data.feedback.comment" class="mt-2 text-sm text-[var(--muted)]">{{ data.feedback.comment }}</p>
        </div>

        <!-- Share (P2) -->
        <div class="mt-6 border-t border-[var(--line)] pt-6">
          <h3 class="font-semibold">Share and get a $5 coupon</h3>
          <div class="mt-3 flex flex-wrap gap-3">
            <a :href="`https://twitter.com/intent/tweet?text=I just got a custom tool built by request/room!&url=${encodeURIComponent(shareUrl)}`" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Twitter</a>
            <a :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Facebook</a>
            <a :href="`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">LinkedIn</a>
          </div>
          <p class="mt-2 text-xs text-[var(--muted)]">Share your tool and receive a $5 coupon for your next request.</p>
        </div>
      </section>
    </template>

    <!-- No deliverable -->
    <EmptyState v-else title="No tool delivered yet" description="This request has not been delivered yet." icon="inbox" />
  </main>
</template>
