<script setup lang="ts">
import { ATTACHMENT_LIMITS } from '~/utils/constants'
import { formatBytes } from '~/utils/format'

const props = defineProps<{
  modelValue: { id: string; name: string; size: number; progress: number }[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: typeof props.modelValue] }>()
const toast = useToast()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const files = Array.from(input.files)
  input.value = ''

  for (const file of files) {
    if (props.modelValue.length >= ATTACHMENT_LIMITS.maxFiles) {
      toast.error(`Maximum ${ATTACHMENT_LIMITS.maxFiles} files allowed.`)
      return
    }
    if (!ATTACHMENT_LIMITS.accept.includes(file.type)) {
      toast.error(`Only JPG, PNG and PDF files are accepted.`)
      return
    }
    if (file.size > ATTACHMENT_LIMITS.maxBytes) {
      toast.error(`${file.name} exceeds the 5 MB limit.`)
      return
    }

    const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const entry = { id, name: file.name, size: file.size, progress: 0 }
    const next = [...props.modelValue, entry]
    emit('update:modelValue', next)

    simulateProgress(id)
  }
}

function simulateProgress(id: string) {
  let p = 0
  const timer = setInterval(() => {
    p += Math.random() * 30 + 10
    if (p >= 100) {
      p = 100
      clearInterval(timer)
    }
    emit('update:modelValue', props.modelValue.map(f => f.id === id ? { ...f, progress: Math.min(p, 100) } : f))
  }, 300)
}

function remove(id: string) {
  emit('update:modelValue', props.modelValue.filter(f => f.id !== id))
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave(e: DragEvent) {
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const dt = e.dataTransfer
  if (dt?.files) {
    const files = Array.from(dt.files)
    for (const file of files) {
      if (props.modelValue.length >= ATTACHMENT_LIMITS.maxFiles) {
        toast.error(`Maximum ${ATTACHMENT_LIMITS.maxFiles} files allowed.`)
        return
      }
      if (!ATTACHMENT_LIMITS.accept.includes(file.type)) {
        toast.error(`Only JPG, PNG and PDF files are accepted.`)
        return
      }
      if (file.size > ATTACHMENT_LIMITS.maxBytes) {
        toast.error(`${file.name} exceeds the 5 MB limit.`)
        return
      }

      const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const entry = { id, name: file.name, size: file.size, progress: 0 }
      const next = [...props.modelValue, entry]
      emit('update:modelValue', next)
      simulateProgress(id)
    }
  }
}
</script>

<template>
  <div>
    <div
      class="cp-panel cp-scanlines border-2 border-dashed p-6 text-center transition-all relative overflow-hidden"
      :class="isDragging ? 'border-[var(--cp-primary)] bg-[rgba(255,140,0,0.1)]' : 'border-[var(--cp-border)] hover:border-[var(--cp-primary)]'"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <!-- Electric arc effect when dragging -->
      <div v-if="isDragging" class="absolute inset-0 pointer-events-none">
        <div class="absolute top-2 left-2 w-3 h-3 bg-[var(--cp-primary)] rounded-full" style="animation: cp-spark 1s ease-in-out infinite;" />
        <div class="absolute top-2 right-2 w-2 h-2 bg-[var(--cp-primary)] rounded-full" style="animation: cp-spark 1.2s ease-in-out infinite 0.2s;" />
        <div class="absolute bottom-2 left-1/3 w-2 h-2 bg-[var(--cp-primary)] rounded-full" style="animation: cp-spark 0.8s ease-in-out infinite 0.4s;" />
        <div class="absolute bottom-2 right-1/4 w-3 h-3 bg-[var(--cp-primary)] rounded-full" style="animation: cp-spark 1.1s ease-in-out infinite 0.1s;" />
      </div>

      <AppIcon name="upload" :size="24" class="mx-auto text-[var(--cp-primary)]" />
      <p class="mt-2 text-sm text-[var(--cp-text-dim)] cp-mono">
        Drag & drop or <button type="button" class="font-semibold text-[var(--cp-primary)] underline" @click="inputRef?.click()">browse files</button>
      </p>
      <p class="mt-1 text-xs text-[var(--cp-text-dim)]">
        Up to {{ ATTACHMENT_LIMITS.maxFiles }} files · max {{ formatBytes(ATTACHMENT_LIMITS.maxBytes) }} each · JPG, PNG, PDF
      </p>
      <input
        ref="inputRef"
        type="file"
        :accept="ATTACHMENT_LIMITS.accept.join(',')"
        :multiple="modelValue.length < ATTACHMENT_LIMITS.maxFiles"
        class="sr-only"
        @change="onFilesSelected"
      />
    </div>
    <ul v-if="modelValue.length" class="mt-3 space-y-2" aria-label="Uploaded files">
      <li v-for="f in modelValue" :key="f.id" class="cp-panel p-3 flex items-center gap-3 text-sm">
        <AppIcon name="paperclip" :size="14" class="text-[var(--cp-text-dim)]" />
        <span class="flex-1 truncate cp-mono">{{ f.name }}</span>
        <span class="text-xs text-[var(--cp-text-dim)]">{{ formatBytes(f.size) }}</span>
        <div v-if="f.progress < 100" class="h-1.5 w-16 overflow-hidden bg-[var(--cp-bg-3)]">
          <div class="h-full bg-[var(--cp-primary)] transition-all" :style="{ width: `${f.progress}%` }" />
        </div>
        <span v-else class="text-[var(--cp-green)]"><AppIcon name="check" :size="14" /></span>
        <button type="button" class="text-[var(--cp-text-dim)] hover:text-[var(--cp-red)]" :aria-label="`Remove ${f.name}`" @click="remove(f.id)">
          <AppIcon name="x" :size="14" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
@import '~/assets/cyberpunk.css';
</style>
