<script setup lang="ts">
// Base modal: focus trap, ESC close, aria-modal (NF-A4).
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), { size: 'md' })
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const WIDTHS = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { emit('close'); return }
  if (e.key !== 'Tab' || !panel.value) return
  const focusables = panel.value.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  if (focusables.length === 0) return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

let previouslyFocused: HTMLElement | null = null
watch(() => props.open, open => {
  if (import.meta.client) {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement
      document.addEventListener('keydown', onKeydown)
      nextTick(() => panel.value?.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus())
    } else {
      document.removeEventListener('keydown', onKeydown)
      previouslyFocused?.focus?.()
    }
  }
})
onBeforeUnmount(() => { if (import.meta.client) document.removeEventListener('keydown', onKeydown) })
</script>

<template>
  <Teleport to="body">
    <Transition name="cp-modal-glitch">
      <div v-if="open" class="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/80 p-4" @click.self="emit('close')">
        <div
          ref="panel" role="dialog" aria-modal="true" :aria-label="title"
          class="cp-panel cp-hud cp-scanlines w-full p-6 sm:p-8" :class="WIDTHS[size]"
        >
          <div class="flex items-start justify-between gap-4">
            <h2 class="cp-eyebrow text-2xl font-semibold">{{ title }}</h2>
            <button class="shrink-0 text-[var(--cp-text-dim)] transition hover:text-[var(--cp-primary)]" aria-label="Close dialog" @click="emit('close')">
              <AppIcon name="x" :size="18" />
            </button>
          </div>
          <div class="mt-5">
            <slot />
          </div>
          <div v-if="$slots.footer" class="mt-7 flex flex-wrap justify-end gap-3">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@import '~/assets/cyberpunk.css';

.cp-modal-glitch-enter-active {
  animation: cp-glitch-in 400ms ease-out;
}
.cp-modal-glitch-leave-active {
  animation: cp-glitch-in 300ms ease-in reverse;
}
</style>
