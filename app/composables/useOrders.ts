import type { MockOrder, MockOrderItem, OrderStatusHistory } from '~/types/orders'
import type { Product as MockProduct } from '~/types/models'

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

export function useOrders() {
  const { products } = useProducts()
  const { api } = useApi()

// --- Cart State (single reactive store) ---
  const cart = useState<CartItem[]>('mock_cart_store', () => [])

// --- Orders State (single reactive store) ---
  const orders = useState<MockOrder[]>('api_orders', () => [])
  const { currentUser } = useAuth()

// --- LocalStorage synchronization (client-safe) ---
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

      } catch (e) {
        console.warn('[useMockOrders] Gagal memuat cache:', e)
      }
    })
    onMounted(() => { refreshOrders().catch(() => {}) })
  }

  async function refreshOrders() {
    const path = currentUser.value?.role === 'pengecer' ? '/orders/my?limit=100' : '/orders?limit=100'
    const result = await api<{ items: any[] }>(path)
    orders.value = result.items.map((item: any) => ({
      ...item,
      sale_id: item.sale?.id,
      sale_number: item.sale?.number,
      items: (item.items || []).map((line: any) => ({ ...line, size_kg: products.value.find(p => p.id === line.product_id)?.size_kg || 0 })),
      history: (item.history || []).map((event: any) => ({ ...event, timestamp: event.created_at, note: event.reason || event.note, actor: event.actor_name || event.actor }))
    }))
    return orders.value
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

// --- Cart Computations ---
  const cartCount = computed(() =>
    cart.value.reduce((total, item) => total + item.quantity, 0)
  )

  const cartTotal = computed(() =>
    cart.value.reduce((total, item) => total + item.price * item.quantity, 0)
  )

// --- Cart Actions ---
  function getProductAvailableQty(productId: string): number {
    const product = products.value.find(p => p.id === productId)
    if (product) return Number(product.available_qty || 0)
    return 0
  }

  function addToCart(product: Pick<MockProduct, 'id' | 'name' | 'size_kg' | 'price' | 'active'>, qty: number = 1) {
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

// --- Order Actions ---
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

    const order = await api<any>('/orders', {
      method: 'POST',
      body: { items: cart.value.map(item => ({ product_id: item.product_id, quantity: item.quantity })) }
    })
    const newOrder = {
      ...order,
      number: order.number,
      retailer_id: retailerInfo.retailer_id,
      items: order.items.map((item: any) => ({ ...item, size_kg: products.value.find(p => p.id === item.product_id)?.size_kg || 0 }))
    } as MockOrder
    orders.value.unshift(newOrder)
    clearCart()
    return newOrder
  }

  function getMyOrders(retailerId: string): MockOrder[] {
    return orders.value.filter(o => o.retailer_id === retailerId)
  }

  function getOrderById(orderId: string): MockOrder | undefined {
    return orders.value.find(o => o.id === orderId || o.number === orderId)
  }

// --- Operational Actions (Admin & Staff, PG-14/15) ---

  /**
   * Konfirmasi pesanan (MENUNGGU_KONFIRMASI -> DIKONFIRMASI).
   * Melakukan alokasi atomik ke reserved_qty seluruh item.
   */
  async function confirmOrder(orderId: string, actor: string): Promise<MockOrder> { void actor; const result = await api<MockOrder>(`/orders/${orderId}/confirm`, { method: 'POST', body: {} }); await refreshOrders(); return result }

  async function rejectOrder(orderId: string, reason: string, actor: string): Promise<MockOrder> { void actor; const result = await api<MockOrder>(`/orders/${orderId}/reject`, { method: 'POST', body: { reason } }); await refreshOrders(); return result }

  async function cancelOrder(orderId: string, reason: string, actor: string): Promise<MockOrder> { void actor; const result = await api<MockOrder>(`/orders/${orderId}/cancel`, { method: 'POST', body: { reason } }); await refreshOrders(); return result }

  async function completeOrder(orderId: string, data: CompleteOrderPayload, actor: string): Promise<MockOrder> {
    void actor
    const result = await api<MockOrder>(`/orders/${orderId}/complete`, { method: 'POST', body: { returns: data.returns, payment_type: data.payment_type, amount_paid: data.amount_paid, method: data.payment_method, note: data.note } })
    await refreshOrders()
    return result
  }

  function resetDefaultOrders() {
    orders.value = []
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
