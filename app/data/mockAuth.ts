export interface MockUser {
  id: string
  username: string
  password?: string
  name: string
  business_name?: string
  contact: string
  email?: string
  role: 'admin' | 'karyawan' | 'pengecer'
  status: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'INACTIVE'
  rejection_reason?: string
  created_at: string
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    password: 'password-uji-123',
    name: 'Budi Santoso',
    business_name: 'Pangkalan LPG Berkah Utama',
    contact: '081234567890',
    email: 'admin@pangkalanlpg.id',
    role: 'admin',
    status: 'ACTIVE',
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-staff-01',
    username: 'siti_karyawan',
    password: 'password-uji-123',
    name: 'Siti Rahma',
    contact: '081298765432',
    email: 'siti@pangkalanlpg.id',
    role: 'karyawan',
    status: 'ACTIVE',
    created_at: '2026-02-15T09:30:00Z',
  },
  {
    id: 'usr-ret-01',
    username: 'warung_sumber',
    password: 'password-uji-123',
    name: 'Ahmad Fauzi',
    business_name: 'Warung Sumber Rejeki',
    contact: '085712345678',
    email: 'ahmad@warungsumber.com',
    role: 'pengecer',
    status: 'ACTIVE',
    created_at: '2026-03-10T14:20:00Z',
  },
  {
    id: 'usr-ret-02',
    username: 'toko_makmur',
    password: 'password-uji-123',
    name: 'Dewi Lestari',
    business_name: 'Toko Kelontong Makmur',
    contact: '087811223344',
    email: 'dewi@tokomakmur.com',
    role: 'pengecer',
    status: 'PENDING',
    created_at: '2026-10-31T11:15:00Z',
  },
  {
    id: 'usr-ret-03',
    username: 'kios_bunda',
    password: 'password-uji-123',
    name: 'Hj. Aminah',
    business_name: 'Kios Bunda Mandiri',
    contact: '082155667788',
    role: 'pengecer',
    status: 'INACTIVE',
    created_at: '2026-04-05T10:00:00Z',
  },
  {
    id: 'usr-ret-04',
    username: 'berkah_jaya',
    password: 'password-uji-123',
    name: 'Hendra Pratama',
    business_name: 'Warung Berkah Jaya',
    contact: '081399887766',
    email: 'hendra@berkahjaya.id',
    role: 'pengecer',
    status: 'PENDING',
    created_at: '2026-11-01T09:00:00Z',
  },
  {
    id: 'usr-ret-05',
    username: 'toko_subur',
    password: 'password-uji-123',
    name: 'Bambang Wijaya',
    business_name: 'Toko Sembako Subur',
    contact: '085211335577',
    email: 'bambang@tokosubur.com',
    role: 'pengecer',
    status: 'REJECTED',
    rejection_reason: 'Lokasi warung berada di luar wilayah operasional distribusi pangkalan.',
    created_at: '2026-10-25T16:45:00Z',
  }
]
