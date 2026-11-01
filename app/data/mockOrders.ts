export interface OrderStatusHistory {
  status: 'MENUNGGU_KONFIRMASI' | 'DIKONFIRMASI' | 'SELESAI' | 'DITOLAK' | 'DIBATALKAN'
  timestamp: string
  note?: string
  actor?: string
}

export interface MockOrderItem {
  product_id: string
  product_name: string
  size_kg: number
  quantity: number
  unit_price: number
  subtotal: number
}

export interface MockOrder {
  id: string
  number: string
  retailer_id: string
  retailer_name: string
  retailer_contact?: string
  business_name?: string
  status: 'MENUNGGU_KONFIRMASI' | 'DIKONFIRMASI' | 'SELESAI' | 'DITOLAK' | 'DIBATALKAN'
  total: number
  items: MockOrderItem[]
  created_at: string
  rejection_reason?: string
  cancellation_reason?: string
  history?: OrderStatusHistory[]
  sale_id?: string
  sale_number?: string
}

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'ord-001',
    number: 'ORD-20261101-0001',
    retailer_id: 'usr-ret-01',
    retailer_name: 'Ahmad Fauzi',
    retailer_contact: '085712345678',
    business_name: 'Warung Sumber Rejeki',
    status: 'MENUNGGU_KONFIRMASI',
    total: 285000,
    items: [
      { product_id: 'prod-001', product_name: 'LPG 3 kg (Subsidi)', size_kg: 3, quantity: 15, unit_price: 19000, subtotal: 285000 }
    ],
    created_at: '2026-11-01T14:10:00+07:00',
    history: [
      { status: 'MENUNGGU_KONFIRMASI', timestamp: '2026-11-01T14:10:00+07:00', note: 'Pesanan diajukan oleh pengecer' }
    ]
  },
  {
    id: 'ord-002',
    number: 'ORD-20261101-0002',
    retailer_id: 'usr-ret-01',
    retailer_name: 'Ahmad Fauzi',
    retailer_contact: '085712345678',
    business_name: 'Warung Sumber Rejeki',
    status: 'DIKONFIRMASI',
    total: 368000,
    items: [
      { product_id: 'prod-002', product_name: 'Bright Gas 5,5 kg', size_kg: 5.5, quantity: 4, unit_price: 92000, subtotal: 368000 }
    ],
    created_at: '2026-11-01T11:30:00+07:00',
    history: [
      { status: 'MENUNGGU_KONFIRMASI', timestamp: '2026-11-01T11:30:00+07:00', note: 'Pesanan diajukan oleh pengecer' },
      { status: 'DIKONFIRMASI', timestamp: '2026-11-01T11:45:00+07:00', note: 'Pesanan dikonfirmasi oleh Admin (stok dialokasikan)', actor: 'admin' }
    ]
  },
  {
    id: 'ord-003',
    number: 'ORD-20261031-0003',
    retailer_id: 'usr-ret-01',
    retailer_name: 'Ahmad Fauzi',
    retailer_contact: '085712345678',
    business_name: 'Warung Sumber Rejeki',
    status: 'SELESAI',
    total: 380000,
    items: [
      { product_id: 'prod-001', product_name: 'LPG 3 kg (Subsidi)', size_kg: 3, quantity: 20, unit_price: 19000, subtotal: 380000 }
    ],
    sale_id: 'sal-001',
    sale_number: 'SAL-20261031-0001',
    created_at: '2026-10-31T09:15:00+07:00',
    history: [
      { status: 'MENUNGGU_KONFIRMASI', timestamp: '2026-10-31T09:15:00+07:00', note: 'Pesanan diajukan oleh pengecer' },
      { status: 'DIKONFIRMASI', timestamp: '2026-10-31T09:25:00+07:00', note: 'Pesanan dikonfirmasi oleh Petugas', actor: 'budi_ops' },
      { status: 'SELESAI', timestamp: '2026-10-31T10:10:00+07:00', note: 'Serah terima selesai (20 tabung kosong diterima)', actor: 'budi_ops' }
    ]
  },
  {
    id: 'ord-004',
    number: 'ORD-20261030-0004',
    retailer_id: 'usr-ret-01',
    retailer_name: 'Ahmad Fauzi',
    retailer_contact: '085712345678',
    business_name: 'Warung Sumber Rejeki',
    status: 'DITOLAK',
    total: 585000,
    items: [
      { product_id: 'prod-003', product_name: 'Bright Gas 12 kg', size_kg: 12, quantity: 3, unit_price: 195000, subtotal: 585000 }
    ],
    rejection_reason: 'Stok fisik tabung 12 kg sedang habis menunggu pasokan agen hari Sabtu.',
    created_at: '2026-10-30T16:00:00+07:00',
    history: [
      { status: 'MENUNGGU_KONFIRMASI', timestamp: '2026-10-30T16:00:00+07:00', note: 'Pesanan diajukan oleh pengecer' },
      { status: 'DITOLAK', timestamp: '2026-10-30T16:15:00+07:00', note: 'Ditolak: Stok fisik tabung 12 kg sedang habis menunggu pasokan agen hari Sabtu.', actor: 'admin' }
    ]
  },
  // Pesanan milik Pengecer Lain (usr-ret-04: Hendra Pratama / Warung Berkah Jaya)
  // Untuk memvalidasi hak akses: Pengecer hanya melihat pesanannya sendiri!
  {
    id: 'ord-005',
    number: 'ORD-20261101-0005',
    retailer_id: 'usr-ret-04',
    retailer_name: 'Hendra Pratama',
    retailer_contact: '081399887766',
    business_name: 'Warung Berkah Jaya',
    status: 'MENUNGGU_KONFIRMASI',
    total: 190000,
    items: [
      { product_id: 'prod-001', product_name: 'LPG 3 kg (Subsidi)', size_kg: 3, quantity: 10, unit_price: 19000, subtotal: 190000 }
    ],
    created_at: '2026-11-01T15:00:00+07:00',
    history: [
      { status: 'MENUNGGU_KONFIRMASI', timestamp: '2026-11-01T15:00:00+07:00', note: 'Pesanan diajukan oleh pengecer' }
    ]
  }
]
