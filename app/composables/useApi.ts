type Envelope<T> = { data: T; request_id: string }

export interface ApiError extends Error {
  status?: number
}

export function useApi() {
  const request = import.meta.server ? useRequestFetch() : $fetch

  async function api<T>(path: string, options: Record<string, any> = {}): Promise<T> {
    const method = String(options.method || 'GET').toUpperCase()
    const headers = new Headers(options.headers || {})
    if (method !== 'GET' && method !== 'HEAD') {
      headers.set('Content-Type', 'application/json')
      if (['POST', 'PATCH'].includes(method) && !path.includes('/auth/') && !path.includes('/retailer-registrations')) {
        headers.set('Idempotency-Key', crypto.randomUUID())
      }
    }
    try {
      const response = await request<Envelope<T>>(`/api${path}`, { ...options, headers } as any)
      return response.data
    } catch (error: any) {
      const status: number | undefined = error?.statusCode ?? error?.status ?? error?.response?.status
      const message = error?.data?.error?.message || error?.data?.message || error?.message || 'Permintaan gagal.'
      const wrapped: ApiError = new Error(message)
      wrapped.status = status
      if (status === 401 && import.meta.client && !path.startsWith('/auth/')) {
        // Sesi berakhir atau dicabut: bersihkan state dan kembali ke halaman masuk.
        const { currentUser } = useAuth()
        currentUser.value = null
        if (useRoute().path !== '/login') await navigateTo('/login')
      }
      throw wrapped
    }
  }

  return { api }
}
