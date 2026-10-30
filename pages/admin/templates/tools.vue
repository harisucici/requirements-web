<script setup lang="ts">
import type { ToolTemplate } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()

const { data: tools, pending } = await useAsyncData('admin-tools', () =>
  api.get<ToolTemplate[]>('/admin/templates/tools'),
)

function renderStars(score: number | null) {
  if (score == null) return []
  return Array.from({ length: 5 }, (_, i) => i < score)
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
        <h1 class="glitch-title mt-1" data-text="TOOL LIBRARY">TOOL LIBRARY</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <div v-if="pending" class="admin-panel p-5"><SkeletonLoader type="card" :lines="3" /></div>

    <template v-else-if="tools">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="tool in tools" :key="tool.id" class="admin-panel p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="eyebrow">{{ tool.category }}</p>
              <h2 class="display mt-1 text-lg font-semibold">{{ tool.name }}</h2>
            </div>
            <span class="grid h-10 w-10 place-items-center rounded-full bg-[rgba(30,107,82,.08)] text-[var(--green)]">
              <AppIcon name="library" :size="18" />
            </span>
          </div>

          <div class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="kw in tool.keywords" :key="kw"
              class="rounded bg-[rgba(30,107,82,.06)] px-2 py-0.5 text-xs font-semibold text-[var(--green)]"
            >{{ kw }}</span>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p class="text-[.65rem] font-bold uppercase text-[var(--muted)]">Avg hours</p>
              <p class="mt-0.5 text-lg font-bold">{{ tool.avg_build_hours ?? '—' }}</p>
            </div>
            <div>
              <p class="text-[.65rem] font-bold uppercase text-[var(--muted)]">Reuses</p>
              <p class="mt-0.5 text-lg font-bold">{{ tool.reuse_count }}</p>
            </div>
            <div>
              <p class="text-[.65rem] font-bold uppercase text-[var(--muted)]">Score</p>
              <div class="mt-1 flex justify-center gap-0.5">
                <AppIcon
                  v-for="(filled, i) in renderStars(tool.reusability_score)" :key="i"
                  name="star" :size="13"
                  :class="filled ? 'text-[var(--yellow)]' : 'text-[var(--line)]'"
                />
              </div>
            </div>
          </div>

          <p v-if="tool.repo_url" class="mt-3 text-xs text-[var(--muted)]">
            <AppIcon name="external" :size="11" class="inline" /> {{ tool.repo_url }}
          </p>
        </div>
      </div>

      <EmptyState v-if="tools.length === 0" title="No tool templates" description="Reusable tool templates will appear here." icon="library" />
    </template>
  </div>
</template>
