/**
 * R-105: draft auto-save to localStorage (key rm_draft_v1), saved on blur and
 * every 5s; restore on re-entry with a "Draft restored" hint; cleared on submit.
 */
export function useDraft<T extends Record<string, unknown>>(key = 'rm_draft_v1') {
  const restored = ref(false)
  const target = ref<T | null>(null) as Ref<T | null>

  function bind(form: T) {
    target.value = form
    if (import.meta.client) {
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          Object.assign(form, JSON.parse(saved))
          restored.value = true
        } catch { localStorage.removeItem(key) }
      }
    }
  }

  function persist() {
    if (import.meta.client && target.value) localStorage.setItem(key, JSON.stringify(target.value))
  }

  function clear() {
    if (import.meta.client) localStorage.removeItem(key)
    restored.value = false
  }

  let interval: ReturnType<typeof setInterval> | null = null
  onMounted(() => { interval = setInterval(persist, 5000) })
  onBeforeUnmount(() => { if (interval) clearInterval(interval) })

  function dismissRestoreHint() { restored.value = false }

  return { restored, bind, persist, clear, dismissRestoreHint }
}

// Ref import for generic typing in non-auto-import contexts
import type { Ref } from 'vue'
