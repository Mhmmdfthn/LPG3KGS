import { MOCK_ORDERS, type MockOrder, type MockOrderItem, type OrderStatusHistory } from '~/data/mockOrders'
import type { MockProduct } from '~/data/mockProducts'

export interface CartItem {
  product_id: string
  product_name: string
  size_kg: number
  price: number
  quantity: number
}

export interface CompleteOrderPayload {
  returns: Array<{
    product_id: string
    empty_returned: number
  }>
  payment_type: 'TUNAI' | 'BON'
  amount_paid: number
  payment_method: 'TUNAI' | 'TRANSFER' | 'LAINNYA'
  note?: string
}

const CART_STORAGE_KEY = 'lpg3kgs_mock_cart_v1'
const ORDERS_STORAGE_KEY = 'lpg3kgs_mock_orders_v1'

export function useMockOrders() {
  const { products } = useMockProducts()
  const {
    getBalance,
    allocateOrderStock,
    releaseOrderStock,
    completeOrderHandoverStock
  } = useMockInventory()
  const { createSaleFromOrder, getSaleByOrderId } = useMockSales()

  // ─── Cart State (Single Reactive Store) ───────────────────────────
  const cart = useState<CartItem[]>('mock_cart_store', () => [])

  // ─── Orders State (Single Reactive Store) ─────────────────────────
  const orders = useState<MockOrder[]>('mock_orders_store', () =>
    JSON.parse(JSON.stringify(MOCK_ORDERS))
  )

  // ─── LocalStorage Synchronization (Client-Safe) ───────────────────
  if (import.meta.client) {
    onMounted(() => {
      try {
        const cachedCart = localStorage.getItem(CART_STORAGE_KEY)
        if (cachedCart) {
          const parsed = JSON.parse(cachedCart)
          if (Array.isArray(parsed)) {
            cart.value = parsed
          }
        }

        const cachedOrders = localStorage.getItem(ORDERS_STORAGE_KEY)
        if (cachedOrders) {
          const parsed = JSON.parse(cachedOrders)
          if (Array.isArray(parsed) && parsed.length > 0) {
            orders.value = parsed
          }
        }
      } catch (e) {
        console.warn('[useMockOrders] Gagal memuat cache:', e)
      }
    })
  }

  function saveCart() {
    if (import.meta.client) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.value))
      } catch (e) {
        console.warn('[useMockOrders] Gagal menyimpan cart:', e)
      }
    }
  }

  function saveOrders() {
    if (import.meta.client) {
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders.value))
      } catch (e) {
        console.warn('[useMockOrders] Gagal menyimpan orders:', e)
      }
    }
  }

  // ─── Cart Computations ───────────────────────────────────────────
  const cartCount = computed(() =>
    cart.value.reduce((total, item) => total + item.quantity, 0)
  )

  const cartTotal = computed(() =>
    cart.value.reduce((total, item) => total + item.price * item.quantity, 0)
  )

  // ─── Cart Actions ────────────────────────────────────────────────
  function getProductAvailableQty(productId: string): number {
    const bal = getBalance(productId)
    if (bal) {
      return Math.max(0, bal.full_qty - bal.reserved_qty)
    }
    const prod = products.value.find(p => p.id === productId)
    return prod ? Math.max(0, prod.full_qty - prod.reserved_qty) : 0
  }

  function addToCart(product: MockProduct, qty: number = 1) {
    if (!product.active) {
      throw new Error(`Produk "${product.name}" sedang nonaktif dan tidak dapat dipesan.`)
    }

    const available = getProductAvailableQty(product.id)
    if (available <= 0) {
      throw new Error(`Stok produk "${product.name}" sedang habis.`)
    }

    const existingIndex = cart.value.findIndex(item => item.product_id === product.id)
    const existingItem = existingIndex >= 0 ? cart.value[existingIndex] : undefined
    const currentQtyInCart = existingItem ? existingItem.quantity : 0
    const desiredTotalQty = currentQtyInCart + qty

    if (desiredTotalQty > available) {
      throw new Error(
        `Jumlah pesanan melebihi stok tersedia (${available} tabung). Di keranjang sudah ada ${currentQtyInCart} tabung.`
      )
    }

    if (existingItem) {
      existingItem.quantity = desiredTotalQty
    } else {
      cart.value.push({
        product_id: product.id,
        product_name: product.name,
        size_kg: product.size_kg,
        price: product.price,
        quantity: qty
      })
    }

    saveCart()
  }

  function updateCartQty(productId: string, newQty: number) {
    const existingIndex = cart.value.findIndex(item => item.product_id === productId)
    if (existingIndex < 0) return

    if (newQty <= 0) {
      removeFromCart(productId)
      return
    }

    const available = getProductAvailableQty(productId)
    if (newQty > available) {
      throw new Error(`Kuantitas melebihi stok tersedia (${available} tabung).`)
    }

    const item = cart.value[existingIndex]
    if (item) {
      item.quantity = newQty
      saveCart()
    }
  }

  function removeFromCart(productId: string) {
    cart.value = cart.value.filter(item => item.product_id !== productId)
    saveCart()
  }

  function clearCart() {
    cart.value = []
    saveCart()
  }

  // ─── Order Actions ───────────────────────────────────────────────
  interface CreateOrderRetailerInfo {
    retailer_id: string
    retailer_name: string
    retailer_contact?: string
    business_name?: string
  }

  async function createOrder(retailerInfo: CreateOrderRetailerInfo): Promise<MockOrder> {
    if (cart.value.length === 0) {
      throw new Error('Keranjang belanja kosong. Silakan pilih produk terlebih dahulu.')
    }

    // Validasi stok ulang sebelum submit
    for (const item of cart.value) {
      const prod = products.value.find(p => p.id === item.product_id)
      if (!prod || !prod.active) {
        throw new Error(`Produk "${item.product_name}" sedang tidak aktif dan tidak dapat dipesan.`)
      }

      const available = getProductAvailableQty(item.product_id)
      if (item.quantity > available) {
        throw new Error(
          `Stok produk "${item.product_name}" berubah. Tersedia: ${available} tabung, dalam keranjang: ${item.quantity} tabung.`
        )
      }
    }

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randSuffix = Math.floor(1000 + Math.random() * 9000)
    const orderNumber = `ORD-${dateStr}-${randSuffix}`
    const orderId = `ord-${Date.now()}`

    const orderItems: MockOrderItem[] = cart.value.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      size_kg: item.size_kg,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity
    }))

    const orderTotal = orderItems.reduce((acc, curr) => acc + curr.subtotal, 0)

    const initialHistory: OrderStatusHistory[] = [
      {
        status: 'MENUNGGU_KONFIRMASI',
        timestamp: now.toISOString(),
        note: 'Pesanan diajukan oleh pengecer'
      }
    ]

    /**
     * ATURAN BISNIS PRD V1 YANG SANGAT KRUSIAL:
     * Pengajuan order menghasilkan status MENUNGGU_KONFIRMASI.
     * Order BELUM mengurangi stok fisik dan BELUM menambah reserved_qty.
     * Reservasi stok baru terjadi ketika Admin / Petugas mengonfirmasi order.
     */
    const newOrder: MockOrder = {
      id: orderId,
      number: orderNumber,
      retailer_id: retailerInfo.retailer_id,
      retailer_name: retailerInfo.retailer_name,
      retailer_contact: retailerInfo.retailer_contact,
      business_name: retailerInfo.business_name,
      status: 'MENUNGGU_KONFIRMASI',
      total: orderTotal,
      items: orderItems,
      created_at: now.toISOString(),
      history: initialHistory
    }

    orders.value.unshift(newOrder)
    saveOrders()

    // Kosongkan keranjang setelah order berhasil diajukan
    clearCart()

    return newOrder
  }

  function getMyOrders(retailerId: string): MockOrder[] {
    return orders.value.filter(o => o.retailer_id === retailerId)
  }

  function getOrderById(orderId: string): MockOrder | undefined {
    return orders.value.find(o => o.id === orderId || o.number === orderId)
  }

  // ─── Operational Actions (Admin & Staff - PG-14/15) ───────────────

  /**
   * Konfirmasi pesanan (MENUNGGU_KONFIRMASI -> DIKONFIRMASI).
   * Melakukan alokasi atomik ke reserved_qty seluruh item.
   */
  async function confirmOrder(orderId: string, actor: string): Promise<MockOrder> {
    const target = getOrderById(orderId)
    if (!target) throw new Error('Pesanan tidak ditemukan.')
    if (target.status !== 'MENUNGGU_KONFIRMASI') {
      throw new Error(`Pesanan berstatus ${target.status} dan tidak dapat dikonfirmasi.`)
    }

    // Alokasikan stok melalui inventory composable
    await allocateOrderStock(target.number, target.items, actor)

    target.status = 'DIKONFIRMASI'
    if (!target.history) target.history = []
    target.history.push({
      status: 'DIKONFIRMASI',
      timestamp: new Date().toISOString(),
      note: 'Pesanan dikonfirmasi oleh petugas (stok berhasil dialokasikan)',
      actor
    })

    saveOrders()
    return target
  }

  /**
   * Tolak pesanan (MENUNGGU_KONFIRMASI -> DITOLAK).
   * Alasan penolakan wajib diisi dan disimpan untuk transparansi pengecer.
   */
  async function rejectOrder(orderId: string, reason: string, actor: string): Promise<MockOrder> {
    const target = getOrderById(orderId)
    if (!target) throw new Error('Pesanan tidak ditemukan.')
    if (target.status !== 'MENUNGGU_KONFIRMASI') {
      throw new Error(`Pesanan berstatus ${target.status} dan tidak dapat ditolak.`)
    }
    const cleanReason = reason.trim()
    if (!cleanReason) throw new Error('Alasan penolakan pesanan wajib diisi.')

    target.status = 'DITOLAK'
    target.rejection_reason = cleanReason
    if (!target.history) target.history = []
    target.history.push({
      status: 'DITOLAK',
      timestamp: new Date().toISOString(),
      note: `Ditolak: ${cleanReason}`,
      actor
    })

    saveOrders()
    return target
  }

  /**
   * Batalkan pesanan (MENUNGGU_KONFIRMASI / DIKONFIRMASI -> DIBATALKAN).
   * Jika sebelumnya sudah DIKONFIRMASI, lepaskan alokasi reserved_qty.
   */
  async function cancelOrder(orderId: string, reason: string, actor: string): Promise<MockOrder> {
    const target = getOrderById(orderId)
    if (!target) throw new Error('Pesanan tidak ditemukan.')
    if (target.status !== 'MENUNGGU_KONFIRMASI' && target.status !== 'DIKONFIRMASI') {
      throw new Error(`Pesanan berstatus ${target.status} dan tidak dapat dibatalkan.`)
    }
    const cleanReason = reason.trim()
    if (!cleanReason) throw new Error('Alasan pembatalan pesanan wajib diisi.')

    // Jika sudah dikonfirmasi, lepaskan reservasi stok
    if (target.status === 'DIKONFIRMASI') {
      await releaseOrderStock(target.number, target.items, actor, cleanReason)
    }

    target.status = 'DIBATALKAN'
    target.cancellation_reason = cleanReason
    if (!target.history) target.history = []
    target.history.push({
      status: 'DIBATALKAN',
      timestamp: new Date().toISOString(),
      note: `Dibatalkan: ${cleanReason}`,
      actor
    })

    saveOrders()
    return target
  }

  /**
   * Selesaikan serah-terima pesanan (DIKONFIRMASI -> SELESAI).
   * - Kurangi stok penuh fisik
   * - Lepaskan alokasi stok
   * - Tambahkan stok kosong fisik yang dikembalikan
   * - Buat catatan penjualan (MockSale) tepat satu kali
   */
  async function completeOrder(
    orderId: string,
    handoverData: CompleteOrderPayload,
    actor: string
  ): Promise<MockOrder> {
    const target = getOrderById(orderId)
    if (!target) throw new Error('Pesanan tidak ditemukan.')
    if (target.status !== 'DIKONFIRMASI') {
      throw new Error(`Hanya pesanan berstatus DIKONFIRMASI yang dapat diselesaikan. Status saat ini: ${target.status}.`)
    }

    // Idempotency guard: cegah penyelesaian ganda
    const existingSale = getSaleByOrderId(target.id)
    if (existingSale) {
      throw new Error(`Pesanan ini sudah pernah diselesaikan dengan nomor penjualan ${existingSale.number}.`)
    }

    // Validasi pembayaran
    if (handoverData.payment_type === 'TUNAI') {
      if (handoverData.amount_paid !== target.total) {
        throw new Error(
          `Pembayaran tunai harus lunas sesuai total transaksi (dibutuhkan: Rp${target.total.toLocaleString('id-ID')}).`
        )
      }
    } else {
      if (handoverData.amount_paid < 0 || handoverData.amount_paid > target.total) {
        throw new Error(
          `Pembayaran awal bon harus antara Rp0 s.d. total transaksi (Rp${target.total.toLocaleString('id-ID')}).`
        )
      }
    }

    // Siapkan data pengembalian tabung kosong untuk stok inventaris
    const handoverStockReturns = target.items.map(item => {
      const returnEntry = handoverData.returns.find(r => r.product_id === item.product_id)
      const emptyReturned = returnEntry ? Math.max(0, returnEntry.empty_returned) : 0
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        empty_returned: emptyReturned
      }
    })

    // 1. Mutasi stok inventaris
    await completeOrderHandoverStock(target.number, handoverStockReturns, actor)

    // 2. Buat data penjualan resmi di sales store
    const saleItems = target.items.map(item => {
      const returnEntry = handoverData.returns.find(r => r.product_id === item.product_id)
      const emptyReturned = returnEntry ? Math.max(0, returnEntry.empty_returned) : 0
      return {
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        empty_returned: emptyReturned,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      }
    })

    const newSale = await createSaleFromOrder({
      order_id: target.id,
      order_number: target.number,
      retailer_id: target.retailer_id,
      retailer_name: target.retailer_name,
      business_name: target.business_name,
      total: target.total,
      payment_type: handoverData.payment_type,
      amount_paid: handoverData.amount_paid,
      payment_method: handoverData.payment_method,
      note: handoverData.note,
      items: saleItems,
      actor
    })

    // 3. Update status order menjadi SELESAI dan simpan referensi penjualan
    target.status = 'SELESAI'
    target.sale_id = newSale.id
    target.sale_number = newSale.number
    if (!target.history) target.history = []
    target.history.push({
      status: 'SELESAI',
      timestamp: new Date().toISOString(),
      note: `Serah-terima selesai. Penjualan resmi ${newSale.number} dibuat. Pembayaran: ${handoverData.payment_type} (Dibayar: Rp${handoverData.amount_paid.toLocaleString('id-ID')}).`,
      actor
    })

    saveOrders()
    return target
  }

  function resetDefaultOrders() {
    orders.value = JSON.parse(JSON.stringify(MOCK_ORDERS))
    cart.value = []
    if (import.meta.client) {
      try {
        localStorage.removeItem(ORDERS_STORAGE_KEY)
        localStorage.removeItem(CART_STORAGE_KEY)
      } catch {}
    }
  }

  return {
    cart,
    cartCount,
    cartTotal,
    orders,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    createOrder,
    confirmOrder,
    rejectOrder,
    cancelOrder,
    completeOrder,
    getMyOrders,
    getOrderById,
    getProductAvailableQty,
    resetDefaultOrders
  }
}
