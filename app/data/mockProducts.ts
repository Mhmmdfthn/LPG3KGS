export interface MockProduct {
  id: string
  name: string
  size_kg: number
  price: number
  minimum_stock: number
  active: boolean
  full_qty: number
  empty_qty: number
  reserved_qty: number
  available_qty: number
  low_stock: boolean
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'prod-001',
    name: 'LPG 3 kg (Subsidi)',
    size_kg: 3,
    price: 19000,
    minimum_stock: 25,
    active: true,
    full_qty: 80,
    empty_qty: 35,
    reserved_qty: 15,
    available_qty: 65, // 80 - 15
    low_stock: false,
  },
  {
    id: 'prod-002',
    name: 'Bright Gas 5,5 kg',
    size_kg: 5.5,
    price: 92000,
    minimum_stock: 10,
    active: true,
    full_qty: 12,
    empty_qty: 8,
    reserved_qty: 4,
    available_qty: 8, // 12 - 4 < 10 (low stock!)
    low_stock: true,
  },
  {
    id: 'prod-003',
    name: 'Bright Gas 12 kg',
    size_kg: 12,
    price: 195000,
    minimum_stock: 8,
    active: true,
    full_qty: 18,
    empty_qty: 14,
    reserved_qty: 0,
    available_qty: 18,
    low_stock: false,
  },
  {
    id: 'prod-004',
    name: 'LPG 50 kg (Industri)',
    size_kg: 50,
    price: 850000,
    minimum_stock: 2,
    active: false,
    full_qty: 0,
    empty_qty: 0,
    reserved_qty: 0,
    available_qty: 0,
    low_stock: true,
  }
]

