import { MOCK_USERS, type MockUser } from '~/data/mockAuth'

export interface RegisterPayload {
  username: string
  password: string
  name: string
  business_name?: string
  contact: string
  email?: string
}

export interface CreateUserPayload {
  role: 'pengecer' | 'karyawan'
  username: string
  password: string
  name: string
  business_name?: string
  contact: string
  email?: string
}

const STORAGE_KEY = 'lpg3kgs_mock_users_v1'

export function useMockAuth() {
  // Store pengguna reaktif global
  const users = useState<MockUser[]>('mock_users_store', () => JSON.parse(JSON.stringify(MOCK_USERS)))
  
  // Pengguna yang sedang aktif login
  const currentUser = useState<MockUser | null>('current_mock_user', () => users.value[0] || null)

  // Pengguna terakhir yang baru saja mendaftar (untuk ditampilkan di halaman PG-03)
  const lastRegisteredUser = useState<MockUser | null>('last_registered_user', () => null)

  function saveToStorage() {
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users.value))
      } catch (e) {
        console.warn('Failed to persist users to localStorage', e)
      }
    }
  }

  // Sinkronisasi data dari localStorage secara aman di client setelah mount (bebas hydration error)
  if (import.meta.client) {
    onMounted(() => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            users.value = parsed
          }
        }
      } catch (e) {
        console.warn('Failed to load cached users', e)
      }
    })
  }

  // Ganti peran pengguna aktif secara cepat
  function switchRole(role: 'admin' | 'karyawan' | 'pengecer') {
    const target = users.value.find(u => u.role === role && u.status === 'ACTIVE')
    if (target) {
      currentUser.value = target
    }
  }

  function setCustomUser(user: MockUser | null) {
    currentUser.value = user
  }

  // Simulasi Login
  async function login(identity: string, passwordInput: string): Promise<MockUser> {
    const cleanId = identity.trim().toLowerCase()
    const target = users.value.find(u => 
      u.username.toLowerCase() === cleanId || 
      (u.email && u.email.toLowerCase() === cleanId)
    )

    if (!target) {
      throw new Error('Identitas akun tidak ditemukan. Periksa kembali username atau email Anda.')
    }

    // Verifikasi kata sandi
    const validPassword = target.password || 'password-uji-123'
    if (passwordInput !== validPassword) {
      throw new Error('Kata sandi salah. Silakan coba kembali.')
    }

    // Periksa status akun secara spesifik
    if (target.status === 'PENDING') {
      throw new Error('Pendaftaran akun Anda masih berstatus MENUNGGU PERSETUJUAN admin. Anda belum dapat masuk.')
    }

    if (target.status === 'REJECTED') {
      const reason = target.rejection_reason ? ` Alasan penolakan: "${target.rejection_reason}".` : ''
      throw new Error(`Pendaftaran akun Anda telah ditolak oleh Admin.${reason} Silakan hubungi admin pangkalan.`)
    }

    if (target.status === 'INACTIVE') {
      throw new Error('Akun Anda telah dinonaktifkan oleh Admin. Akses masuk ditangguhkan.')
    }

    currentUser.value = target
    return target
  }

  // Simulasi Registrasi Pengecer Mandiri
  async function register(payload: RegisterPayload): Promise<MockUser> {
    const cleanUsername = payload.username.trim().toLowerCase()
    
    // Cek duplikasi username
    const exists = users.value.some(u => u.username.toLowerCase() === cleanUsername)
    if (exists) {
      throw new Error(`Username "${cleanUsername}" sudah digunakan. Silakan gunakan username lain.`)
    }

    // Cek duplikasi email jika diisi
    if (payload.email && payload.email.trim()) {
      const cleanEmail = payload.email.trim().toLowerCase()
      const emailExists = users.value.some(u => u.email && u.email.toLowerCase() === cleanEmail)
      if (emailExists) {
        throw new Error(`Email "${cleanEmail}" sudah terdaftar pada akun lain.`)
      }
    }

    const newUser: MockUser = {
      id: `usr-ret-${Date.now()}`,
      username: cleanUsername,
      password: payload.password,
      name: payload.name.trim(),
      business_name: payload.business_name?.trim() || undefined,
      contact: payload.contact.trim(),
      email: payload.email?.trim() || undefined,
      role: 'pengecer',
      status: 'PENDING',
      created_at: new Date().toISOString()
    }

    users.value.push(newUser)
    lastRegisteredUser.value = newUser
    saveToStorage()
    return newUser
  }

  // Persetujuan Pengecer (PG-07)
  async function approveRetailer(userId: string): Promise<MockUser> {
    const target = users.value.find(u => u.id === userId)
    if (!target) {
      throw new Error('Data pengguna tidak ditemukan.')
    }
    if (target.status !== 'PENDING') {
      throw new Error('Hanya akun berstatus Menunggu Persetujuan yang dapat disetujui.')
    }

    target.status = 'ACTIVE'
    target.rejection_reason = undefined
    saveToStorage()
    return target
  }

  // Penolakan Pengecer (PG-07)
  async function rejectRetailer(userId: string, reason: string): Promise<MockUser> {
    const cleanReason = reason.trim()
    if (!cleanReason) {
      throw new Error('Alasan penolakan wajib diisi.')
    }
    const target = users.value.find(u => u.id === userId)
    if (!target) {
      throw new Error('Data pengguna tidak ditemukan.')
    }
    if (target.status !== 'PENDING') {
      throw new Error('Hanya akun berstatus Menunggu Persetujuan yang dapat ditolak.')
    }

    target.status = 'REJECTED'
    target.rejection_reason = cleanReason
    saveToStorage()
    return target
  }

  // Tambah Pengguna Baru oleh Admin (PG-06)
  async function addUser(payload: CreateUserPayload): Promise<MockUser> {
    const cleanUsername = payload.username.trim().toLowerCase()
    if (!cleanUsername) {
      throw new Error('Username wajib diisi.')
    }
    if (cleanUsername.length < 3) {
      throw new Error('Username minimal 3 karakter.')
    }

    const exists = users.value.some(u => u.username.toLowerCase() === cleanUsername)
    if (exists) {
      throw new Error(`Username "${cleanUsername}" sudah digunakan. Silakan gunakan username lain.`)
    }

    if (payload.email && payload.email.trim()) {
      const cleanEmail = payload.email.trim().toLowerCase()
      const emailExists = users.value.some(u => u.email && u.email.toLowerCase() === cleanEmail)
      if (emailExists) {
        throw new Error(`Email "${cleanEmail}" sudah terdaftar pada akun lain.`)
      }
    }

    if (!payload.password || payload.password.length < 10) {
      throw new Error('Kata sandi minimal 10 karakter sesuai standar keamanan.')
    }

    if (!payload.name.trim()) {
      throw new Error('Nama penanggung jawab / nama lengkap wajib diisi.')
    }

    if (!payload.contact.trim()) {
      throw new Error('Nomor kontak WhatsApp / HP wajib diisi.')
    }

    const prefix = payload.role === 'pengecer' ? 'usr-ret' : 'usr-staff'
    const newUser: MockUser = {
      id: `${prefix}-${Date.now()}`,
      username: cleanUsername,
      password: payload.password,
      name: payload.name.trim(),
      business_name: payload.business_name?.trim() || undefined,
      contact: payload.contact.trim(),
      email: payload.email?.trim() || undefined,
      role: payload.role,
      status: 'ACTIVE', // Akun yang dibuat oleh Admin langsung aktif
      created_at: new Date().toISOString()
    }

    users.value.push(newUser)
    saveToStorage()
    return newUser
  }

  // Edit Informasi Pengguna (PG-06)
  async function updateUser(userId: string, data: { name: string; business_name?: string; contact: string; email?: string }): Promise<MockUser> {
    const target = users.value.find(u => u.id === userId)
    if (!target) {
      throw new Error('Pengguna tidak ditemukan.')
    }

    if (!data.name.trim()) {
      throw new Error('Nama tidak boleh kosong.')
    }

    if (!data.contact.trim()) {
      throw new Error('Nomor kontak tidak boleh kosong.')
    }

    if (data.email && data.email.trim()) {
      const cleanEmail = data.email.trim().toLowerCase()
      const emailConflict = users.value.some(u => u.id !== userId && u.email && u.email.toLowerCase() === cleanEmail)
      if (emailConflict) {
        throw new Error(`Email "${cleanEmail}" sudah digunakan oleh akun lain.`)
      }
    }

    target.name = data.name.trim()
    target.business_name = data.business_name?.trim() || undefined
    target.contact = data.contact.trim()
    target.email = data.email?.trim() || undefined

    if (currentUser.value?.id === userId) {
      currentUser.value.name = target.name
      currentUser.value.business_name = target.business_name
      currentUser.value.contact = target.contact
      currentUser.value.email = target.email
    }

    saveToStorage()
    return target
  }

  // Aktifkan / Nonaktifkan Akun (PG-06)
  async function toggleUserStatus(userId: string): Promise<MockUser> {
    const target = users.value.find(u => u.id === userId)
    if (!target) {
      throw new Error('Pengguna tidak ditemukan.')
    }
    if (target.role === 'admin') {
      throw new Error('Akun Admin utama tidak dapat dinonaktifkan demi integritas sistem.')
    }
    if (target.status === 'PENDING' || target.status === 'REJECTED') {
      throw new Error('Status akun yang masih menunggu atau ditolak dikelola melalui menu Persetujuan Pengecer.')
    }

    target.status = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    if (currentUser.value?.id === userId) {
      currentUser.value.status = target.status
    }

    saveToStorage()
    return target
  }

  // Reset Kata Sandi Pengguna oleh Admin (PG-06)
  async function resetUserPassword(userId: string, newPass: string): Promise<void> {
    if (!newPass || newPass.length < 10) {
      throw new Error('Kata sandi baru minimal 10 karakter.')
    }
    const target = users.value.find(u => u.id === userId)
    if (!target) {
      throw new Error('Pengguna tidak ditemukan.')
    }
    target.password = newPass
    if (currentUser.value?.id === userId) {
      currentUser.value.password = newPass
    }
    saveToStorage()
  }

  // Simulasi Ubah Kata Sandi Pengguna Sendiri (PG-28)
  async function changePassword(currentPass: string, newPass: string): Promise<void> {
    if (!currentUser.value) {
      throw new Error('Sesi tidak ditemukan. Silakan masuk terlebih dahulu.')
    }

    const userInStore = users.value.find(u => u.id === currentUser.value!.id)
    const activePass = userInStore?.password || currentUser.value.password || 'password-uji-123'

    if (currentPass !== activePass) {
      throw new Error('Kata sandi saat ini tidak sesuai.')
    }

    if (newPass === currentPass) {
      throw new Error('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.')
    }

    if (newPass.length < 10) {
      throw new Error('Kata sandi baru minimal 10 karakter.')
    }

    // Update password
    if (userInStore) {
      userInStore.password = newPass
    }
    currentUser.value.password = newPass
    saveToStorage()
  }

  // Simulasi Ubah Data Profil Sendiri (PG-28)
  async function updateProfile(data: { name: string; business_name?: string; contact: string; email?: string }): Promise<void> {
    if (!currentUser.value) {
      throw new Error('Sesi tidak ditemukan.')
    }

    const userInStore = users.value.find(u => u.id === currentUser.value!.id)
    if (userInStore) {
      userInStore.name = data.name.trim()
      userInStore.business_name = data.business_name?.trim() || undefined
      userInStore.contact = data.contact.trim()
      userInStore.email = data.email?.trim() || undefined
    }

    currentUser.value.name = data.name.trim()
    currentUser.value.business_name = data.business_name?.trim() || undefined
    currentUser.value.contact = data.contact.trim()
    currentUser.value.email = data.email?.trim() || undefined
    saveToStorage()
  }

  // Reset Mock Data ke Kondisi Awal
  function resetDefaultUsers() {
    users.value = JSON.parse(JSON.stringify(MOCK_USERS))
    if (import.meta.client) {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (e) {
        console.warn('Failed to clear storage', e)
      }
    }
  }

  // Simulasi Logout
  function logout() {
    currentUser.value = null
  }

  const isLoggedIn = computed(() => currentUser.value !== null)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isStaff = computed(() => currentUser.value?.role === 'karyawan')
  const isRetailer = computed(() => currentUser.value?.role === 'pengecer')

  return {
    users,
    currentUser,
    lastRegisteredUser,
    isLoggedIn,
    isAdmin,
    isStaff,
    isRetailer,
    switchRole,
    setCustomUser,
    login,
    register,
    approveRetailer,
    rejectRetailer,
    addUser,
    updateUser,
    toggleUserStatus,
    resetUserPassword,
    resetDefaultUsers,
    changePassword,
    updateProfile,
    logout,
    availableUsers: users
  }
}
