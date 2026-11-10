import type { User, UserRole } from '~/types/models'

export interface CreateUserPayload {
  role: 'pengecer' | 'karyawan'
  username: string
  password: string
  name: string
  business_name?: string
  contact: string
  email?: string
}

export function useAuth() {
  const { api } = useApi()
  const currentUser = useState<User | null>('auth_user', () => null)
  const lastRegisteredUser = useState<User | null>('auth_registered_user', () => null)
  const users = useState<User[]>('auth_users', () => [])
  const isLoggedIn = computed(() => !!currentUser.value)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isStaff = computed(() => currentUser.value?.role === 'karyawan')
  const isRetailer = computed(() => currentUser.value?.role === 'pengecer')

  /** Buang field kosong agar schema server yang strict tidak menolak request. */
  function cleanPayload(data: Record<string, any>, omit: string[] = []) {
    const payload: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      if (omit.includes(key) || value === undefined || value === null) continue
      if (typeof value === 'string') {
        const normalized = key === 'password' ? value : value.trim()
        if (!normalized && key !== 'password') continue
        payload[key] = normalized
      } else {
        payload[key] = value
      }
    }
    return payload
  }

  /** Sinkronkan satu akun ke cache lokal supaya tabel langsung ikut berubah. */
  function upsertUser(user: User) {
    const index = users.value.findIndex(item => item.id === user.id)
    if (index >= 0) users.value[index] = user
    else users.value.push(user)
    return user
  }

  function resolveRole(id: string, role?: UserRole) {
    return role ?? users.value.find(item => item.id === id)?.role
  }

  async function refresh() {
    try { currentUser.value = await api<User>('/auth/me') }
    catch { currentUser.value = null }
    return currentUser.value
  }
  function switchRole(_role: UserRole) {
    // Role switching is intentionally unavailable; the API session determines access.
  }
  async function login(identity: string, password: string) {
    const result = await api<{ user: User }>('/auth/login', { method: 'POST', body: { identity, password } })
    currentUser.value = result.user
    return result.user
  }
  async function register(payload: Record<string, any>) {
    const result = await api<{ user: User }>('/retailer-registrations', { method: 'POST', body: { ...payload, password_confirmation: payload.password_confirmation || payload.password } })
    lastRegisteredUser.value = result.user
    return result.user
  }
  async function logout() {
    try { await api('/auth/logout', { method: 'POST', body: {} }) }
    finally { currentUser.value = null; await navigateTo('/login') }
  }
  async function updateProfile(data: Record<string, any>) { currentUser.value = await api<User>('/auth/me', { method: 'PATCH', body: data }) }
  async function changePassword(current_password: string, new_password: string) {
    await api('/auth/change-password', { method: 'POST', body: { current_password, new_password } })
    currentUser.value = null
  }
  async function loadAccounts(path: string) {
    const result = await api<{ items: User[] }>(path)
    const retained = users.value.filter(user => !result.items.some(item => item.id === user.id))
    users.value = [...retained, ...result.items]
    return users.value
  }
  async function approveRetailer(id: string) { return api<User>(`/retailers/${id}/approval`, { method: 'PATCH', body: { approved: true } }) }
  async function rejectRetailer(id: string, reason: string) { return api<User>(`/retailers/${id}/approval`, { method: 'PATCH', body: { approved: false, reason } }) }
  async function addUser(data: Record<string, any>) {
    const resource = data.role === 'pengecer' ? 'retailers' : 'staff'
    const created = await api<User>(`/${resource}`, { method: 'POST', body: cleanPayload(data, ['role']) })
    return upsertUser(created)
  }
  async function updateUser(id: string, data: Record<string, any>, role?: UserRole) {
    const resource = resolveRole(id, role) === 'pengecer' ? 'retailers' : 'staff'
    const updated = await api<User>(`/${resource}/${id}`, { method: 'PATCH', body: cleanPayload(data) })
    return upsertUser(updated)
  }
  async function toggleUserStatus(id: string, role?: UserRole) {
    const user = users.value.find(item => item.id === id)
    if (!user) throw new Error('Pengguna tidak ditemukan.')
    return updateUser(id, { status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }, role ?? user.role)
  }
  async function resetUserPassword(id: string, password: string, role?: UserRole) {
    const resource = resolveRole(id, role) === 'pengecer' ? 'retailers' : 'staff'
    await api(`/${resource}/${id}/reset-password`, { method: 'POST', body: { password } })
  }

  return { currentUser, users, lastRegisteredUser, isLoggedIn, isAdmin, isStaff, isRetailer, switchRole, refresh, login, register, logout, updateProfile, changePassword, loadAccounts, approveRetailer, rejectRetailer, addUser, updateUser, toggleUserStatus, resetUserPassword }
}
