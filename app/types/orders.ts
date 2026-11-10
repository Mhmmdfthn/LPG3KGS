export interface OrderStatusHistory {
  status: 'MENUNGGU_KONFIRMASI' | 'DIKONFIRMASI' | 'SELESAI' | 'DITOLAK' | 'DIBATALKAN'
  timestamp?: string
  created_at?: string
  note?: string
  reason?: string
  actor?: string
  actor_name?: string
}

export interface OrderItem {
  product_id: string
  product_name: string
  size_kg: number
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Order {
  id: string
  number: string
  retailer_id: string
  retailer_name: string
  retailer_contact?: string
  business_name?: string
  status: 'MENUNGGU_KONFIRMASI' | 'DIKONFIRMASI' | 'SELESAI' | 'DITOLAK' | 'DIBATALKAN'
  total: number
  items: OrderItem[]
  created_at: string
  rejection_reason?: string
  cancellation_reason?: string
  history?: OrderStatusHistory[]
  sale_id?: string
  sale_number?: string
}
