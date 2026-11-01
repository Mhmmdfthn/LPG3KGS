export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  title?: string
  duration?: number
}

export function useNotification() {
  const toasts = useState<ToastItem[]>('app_toasts', () => [])

  function addToast(item: Omit<ToastItem, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const toast: ToastItem = { ...item, id }
    toasts.value.push(toast)

    const duration = item.duration ?? 4000
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  function removeToast(id: string) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      toasts.value.splice(idx, 1)
    }
  }

  function showSuccess(message: string, title?: string) {
    addToast({ type: 'success', message, title })
  }

  function showError(message: string, title?: string) {
    addToast({ type: 'error', message, title, duration: 6000 })
  }

  function showWarning(message: string, title?: string) {
    addToast({ type: 'warning', message, title })
  }

  function showInfo(message: string, title?: string) {
    addToast({ type: 'info', message, title })
  }

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}

