import { formatCountdown } from '~/utils/format'

/** Live countdown to an ISO8601 target; ticks every second while mounted (R-306). */
export function useCountdown(targetIso: Ref<string | null | undefined> | (() => string | null | undefined)) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  const target = computed(() => (typeof targetIso === 'function' ? targetIso() : targetIso.value))
  const text = computed(() => (target.value ? formatCountdown(target.value).text : ''))
  const overdue = computed(() => (target.value ? formatCountdown(target.value).overdue : false))

  onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000) })
  onBeforeUnmount(() => { if (timer) clearInterval(timer) })

  return { text, overdue, now }
}
