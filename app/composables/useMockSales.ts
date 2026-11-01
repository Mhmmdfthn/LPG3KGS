import { MOCK_SALES, type MockSale, type MockSaleItem, type MockPayment } from '~/data/mockSales'

export interface CreateSaleFromOrderPayload {
  order_id: string
  order_number: string
  retailer_id: string
  retailer_name: string
  business_name?: string
  total: number
  payment_type: 'TUNAI' | 'BON'
  amount_paid: number
  payment_method: 'TUNAI' | 'TRANSFER' | 'LAINNYA'
  note?: string
  items: Array<{
    product_id: string
    product_name: string
    quantity: number
    empty_returned: number
    unit_price: number
    subtotal: number
  }>
  actor: string
}

const SALES_STORAGE_KEY = 'lpg3kgs_mock_sales_v1'

export function useMockSales() {
  const sales = useState<MockSale[]>('mock_sales_store', () =>
    JSON.parse(JSON.stringify(MOCK_SALES))
  )

  if (import.meta.client) {
    onMounted(() => {
      try {
        const cached = localStorage.getItem(SALES_STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            sales.value = parsed
          }
        }
      } catch (e) {
        console.warn('[useMockSales] Gagal memuat cache:', e)
      }
    })
  }

  function saveSales() {
    if (import.meta.client) {
      try {
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales.value))
      } catch (e) {
        console.warn('[useMockSales] Gagal menyimpan sales:', e)
      }
    }
  }

  /**
   * Catat penjualan baru yang bersumber dari Order Serah Terima.
   * Dilarang duplikasi penyelesaian order (idempotent guard).
   */
  async function createSaleFromOrder(payload: CreateSaleFromOrderPayload): Promise<MockSale> {
    const existing = sales.value.find(s => s.order_id === payload.order_id)
    if (existing) {
      throw new Error(`Pesanan "${payload.order_number}" sudah memiliki catatan penjualan (${existing.number}).`)
    }

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randSuffix = Math.floor(1000 + Math.random() * 9000)
    const saleNumber = `SAL-${dateStr}-${randSuffix}`
    const saleId = `sal-${Date.now()}`

    const paid = Math.max(0, payload.amount_paid)
    const total = payload.total
    const balance = Math.max(0, total - paid)

    let paymentStatus: 'LUNAS' | 'BELUM_DIBAYAR' | 'DIBAYAR_SEBAGIAN' = 'BELUM_DIBAYAR'
    if (paid >= total) {
      paymentStatus = 'LUNAS'
    } else if (paid > 0) {
      paymentStatus = 'DIBAYAR_SEBAGIAN'
    }

    const payments: MockPayment[] = []
    if (paid > 0) {
      payments.push({
        id: `pay-${Date.now()}`,
        number: `PAY-${dateStr}-${Math.floor(100 + Math.random() * 900)}`,
        amount: paid,
        method: payload.payment_method,
        paid_at: now.toISOString(),
        note: payload.note || (payload.payment_type === 'TUNAI' ? 'Pembayaran tunai lunas' : 'Pembayaran awal serah terima')
      })
    }

    const saleItems: MockSaleItem[] = payload.items.map(it => ({
      product_id: it.product_id,
      product_name: it.product_name,
      quantity: it.quantity,
      empty_returned: it.empty_returned,
      unit_price: it.unit_price,
      subtotal: it.subtotal
    }))

    const newSale: MockSale = {
      id: saleId,
      number: saleNumber,
      order_id: payload.order_id,
      retailer_id: payload.retailer_id,
      retailer_name: payload.retailer_name,
      business_name: payload.business_name,
      source: 'ORDER',
      payment_type: payload.payment_type,
      total,
      paid,
      balance,
      payment_status: paymentStatus,
      items: saleItems,
      payments,
      created_at: now.toISOString()
    }

    sales.value.unshift(newSale)
    saveSales()
    return newSale
  }

  function getSaleByOrderId(orderId: string): MockSale | undefined {
    return sales.value.find(s => s.order_id === orderId)
  }

  function getSaleById(saleId: string): MockSale | undefined {
    return sales.value.find(s => s.id === saleId || s.number === saleId)
  }

  function resetDefaultSales() {
    sales.value = JSON.parse(JSON.stringify(MOCK_SALES))
    if (import.meta.client) {
      try {
        localStorage.removeItem(SALES_STORAGE_KEY)
      } catch {}
    }
  }

  return {
    sales,
    createSaleFromOrder,
    getSaleByOrderId,
    getSaleById,
    resetDefaultSales
  }
}

