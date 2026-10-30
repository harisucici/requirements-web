export interface ToastItem {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration: number
}

let seq = 0

export function useToast() {
  const toasts = useState<ToastItem[]>('toasts', () => [])

  function show(type: ToastItem['type'], message: string, duration = 4500) {
    const id = ++seq
    toasts.value.push({ id, type, message, duration })
    if (duration > 0) setTimeout(() => dismiss(id), duration)
    return id
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    show,
    dismiss,
    success: (m: string) => show('success', m),
    error: (m: string) => show('error', m, 6000),
    warning: (m: string) => show('warning', m),
    info: (m: string) => show('info', m),
  }
}
