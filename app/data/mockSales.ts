export interface MockSaleItem {
  product_id: string
  product_name: string
  quantity: number
  empty_returned: number
  unit_price: number
  subtotal: number
}

export interface MockPayment {
  id: string
  number: string
  amount: number
  method: 'TUNAI' | 'TRANSFER' | 'LAINNYA'
  paid_at: string
  note?: string
}

export interface MockSale {
  id: string
  number: string
  order_id?: string
  retailer_id?: string
  retailer_name?: string
  business_name?: string
  source: 'ORDER' | 'DIRECT'
  payment_type: 'TUNAI' | 'BON'
  total: number
  paid: number
  balance: number
  payment_status: 'LUNAS' | 'BELUM_DIBAYAR' | 'DIBAYAR_SEBAGIAN'
  items: MockSaleItem[]
  payments: MockPayment[]
  created_at: string
}

export const MOCK_SALES: MockSale[] = [
  {
    id: 'sal-001',
    number: 'SAL-20261031-0001',
    order_id: 'ord-003',
    retailer_id: 'usr-ret-01',
    retailer_name: 'Ahmad Fauzi',
    business_name: 'Warung Sumber Rejeki',
    source: 'ORDER',
    payment_type: 'BON',
    total: 380000,
    paid: 180000,
    balance: 200000,
    payment_status: 'DIBAYAR_SEBAGIAN',
    items: [
      { product_id: 'prod-001', product_name: 'LPG 3 kg (Subsidi)', quantity: 20, empty_returned: 18, unit_price: 19000, subtotal: 380000 }
    ],
    payments: [
      { id: 'pay-001', number: 'PAY-001', amount: 180000, method: 'TUNAI', paid_at: '2026-10-31T09:30:00+07:00', note: 'Uang muka serah-terima' }
    ],
    created_at: '2026-10-31T09:30:00+07:00'
  },
  {
    id: 'sal-002',
    number: 'SAL-20261101-0002',
    source: 'DIRECT',
    payment_type: 'TUNAI',
    total: 76000,
    paid: 76000,
    balance: 0,
    payment_status: 'LUNAS',
    items: [
      { product_id: 'prod-001', product_name: 'LPG 3 kg (Subsidi)', quantity: 4, empty_returned: 4, unit_price: 19000, subtotal: 76000 }
    ],
    payments: [
      { id: 'pay-002', number: 'PAY-002', amount: 76000, method: 'TUNAI', paid_at: '2026-11-01T10:15:00+07:00', note: 'Penjualan langsung lunas' }
    ],
    created_at: '2026-11-01T10:15:00+07:00'
  }
]

