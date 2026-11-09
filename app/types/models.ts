export type UserRole = 'admin' | 'karyawan' | 'pengecer'
export type UserStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'INACTIVE'

export interface User {
  id: string
  username: string
  name: string
  business_name?: string
  contact: string
  email?: string
  role: UserRole
  status: UserStatus
  rejection_reason?: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  size_kg: number
  price: number
  minimum_stock: number
  active: boolean
  full_qty?: number
  empty_qty?: number
  reserved_qty?: number
  available_qty: number
  low_stock: boolean
}

export interface PageResult<T> {
  items: T[]
  pagination: { page: number; limit: number; total: number }
}
