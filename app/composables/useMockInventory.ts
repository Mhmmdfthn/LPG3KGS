// composables/useMockInventory.ts
// Mock composable untuk inventory management — saldo stok & riwayat pergerakan
// Data produk (nama, harga, dsb) di-lookup dari useMockProducts() saat render
// Storage key: lpg3kgs_mock_inventory_v1

import { onMounted } from 'vue'

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface InventoryBalance {
  product_id: string
  full_qty: number      // tabung penuh fisik
  empty_qty: number     // tabung kosong fisik
  reserved_qty: number  // tabung penuh dialokasikan untuk order (tidak diubah oleh receipt/adjustment)
  available_qty: number // computed: max(0, full_qty - reserved_qty)
}

export type MovementType =
  | 'PENERIMAAN_PASOKAN'   // dari agen
  | 'KOREKSI_STOK'         // koreksi manual admin
  | 'ALOKASI_ORDER'        // saat order dikonfirmasi (future)
  | 'PELEPASAN_ALOKASI'    // saat order dibatalkan/ditolak (future)
  | 'SERAH_TERIMA'         // saat order selesai (future)
  | 'PENJUALAN_LANGSUNG'   // penjualan langsung (future)

export interface StockMovement {
  id: string
  product_id: string
  type: MovementType
  full_delta: number       // perubahan stok penuh (positif = bertambah, negatif = berkurang)
  empty_delta: number      // perubahan stok kosong
  full_before: number      // saldo penuh sebelum
  empty_before: number     // saldo kosong sebelum
  full_after: number       // saldo penuh sesudah
  empty_after: number      // saldo kosong sesudah
  reason: string
  actor: string            // username pelaku
  created_at: string       // ISO 8601
  reference_id?: string    // ID order/transaksi terkait jika ada
}

export interface ReceiptPayload {
  product_id: string
  full_received: number    // tabung penuh diterima dari agen
  empty_sent: number       // tabung kosong dikembalikan ke agen
  reason: string
  actor: string
}

export interface AdjustmentPayload {
  product_id: string
  full_delta: number       // bisa positif atau negatif
  empty_delta: number      // bisa positif atau negatif
  reason: string           // WAJIB
  actor: string
}

// ---------------------------------------------------------------------------
// Internal storage interface
// ---------------------------------------------------------------------------

interface StorageData {
  balances: InventoryBalance[]
  movements: StockMovement[]
}

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'lpg3kgs_mock_inventory_v1'

// ---------------------------------------------------------------------------
// Mock data awal — Saldo inventaris
// available_qty = max(0, full_qty - reserved_qty)
// ---------------------------------------------------------------------------

const INITIAL_BALANCES: InventoryBalance[] = [
  {
    product_id: 'prod-001',
    full_qty: 80,
    empty_qty: 35,
    reserved_qty: 15,
    available_qty: 65, // max(0, 80 - 15)
  },
  {
    product_id: 'prod-002',
    full_qty: 12,
    empty_qty: 8,
    reserved_qty: 4,
    available_qty: 8, // max(0, 12 - 4)
  },
  {
    product_id: 'prod-003',
    full_qty: 18,
    empty_qty: 14,
    reserved_qty: 0,
    available_qty: 18, // max(0, 18 - 0)
  },
  {
    product_id: 'prod-004',
    full_qty: 0,
    empty_qty: 0,
    reserved_qty: 0,
    available_qty: 0, // max(0, 0 - 0)
  },
]

// ---------------------------------------------------------------------------
// Mock data awal — Riwayat pergerakan stok (terbaru di atas)
// before + delta = after harus konsisten
// ---------------------------------------------------------------------------

const INITIAL_MOVEMENTS: StockMovement[] = [
  // KOREKSI_STOK prod-002 — Tabung rusak (-2 penuh)
  {
    id: 'mov-init-006',
    product_id: 'prod-002',
    type: 'KOREKSI_STOK',
    full_delta: -2,
    empty_delta: 0,
    full_before: 14,
    empty_before: 8,
    full_after: 12,
    empty_after: 8,
    reason: 'Tabung rusak disisihkan',
    actor: 'admin',
    created_at: '2026-11-01T08:00:00.000Z',
  },
  // KOREKSI_STOK prod-001 — Selisih stock opname (+5 penuh)
  {
    id: 'mov-init-005',
    product_id: 'prod-001',
    type: 'KOREKSI_STOK',
    full_delta: 5,
    empty_delta: 0,
    full_before: 75,
    empty_before: 35,
    full_after: 80,
    empty_after: 35,
    reason: 'Selisih fisik setelah stock opname',
    actor: 'admin',
    created_at: '2026-10-31T10:30:00.000Z',
  },
  // PENERIMAAN_PASOKAN prod-003 (+25 penuh, -20 kosong)
  {
    id: 'mov-init-004',
    product_id: 'prod-003',
    type: 'PENERIMAAN_PASOKAN',
    full_delta: 25,
    empty_delta: -20,
    full_before: 0,
    empty_before: 34,
    full_after: 25,
    empty_after: 14,
    reason: 'Penerimaan pasokan dari agen',
    actor: 'admin',
    created_at: '2026-10-28T09:00:00.000Z',
  },
  // PENERIMAAN_PASOKAN prod-002 (+20 penuh, -15 kosong)
  {
    id: 'mov-init-003',
    product_id: 'prod-002',
    type: 'PENERIMAAN_PASOKAN',
    full_delta: 20,
    empty_delta: -15,
    full_before: 0,
    empty_before: 23,
    full_after: 20,
    empty_after: 8,
    reason: 'Penerimaan pasokan dari agen',
    actor: 'admin',
    created_at: '2026-10-25T08:30:00.000Z',
  },
  // PENERIMAAN_PASOKAN prod-001 — gelombang kedua (+30 penuh, -20 kosong)
  {
    id: 'mov-init-002',
    product_id: 'prod-001',
    type: 'PENERIMAAN_PASOKAN',
    full_delta: 30,
    empty_delta: -20,
    full_before: 45,
    empty_before: 55,
    full_after: 75,
    empty_after: 35,
    reason: 'Penerimaan pasokan dari agen',
    actor: 'admin',
    created_at: '2026-10-20T07:45:00.000Z',
  },
  // PENERIMAAN_PASOKAN prod-001 — gelombang pertama (+50 penuh, -30 kosong)
  {
    id: 'mov-init-001',
    product_id: 'prod-001',
    type: 'PENERIMAAN_PASOKAN',
    full_delta: 50,
    empty_delta: -30,
    full_before: 0,
    empty_before: 65,
    full_after: 50,
    empty_after: 35,
    reason: 'Penerimaan pasokan perdana dari agen',
    actor: 'admin',
    created_at: '2026-10-10T08:00:00.000Z',
  },
]

// ---------------------------------------------------------------------------
// Deep-clone helpers to avoid mutating initial constants
// ---------------------------------------------------------------------------

function cloneBalances(): InventoryBalance[] {
  return INITIAL_BALANCES.map((b) => ({ ...b }))
}

function cloneMovements(): StockMovement[] {
  return INITIAL_MOVEMENTS.map((m) => ({ ...m }))
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useMockInventory() {
  // Shared reactive state via useState (lintas halaman, SSR-safe)
  const balances = useState<InventoryBalance[]>('lpg3kgs_inventory_balances', cloneBalances)
  const movements = useState<StockMovement[]>('lpg3kgs_inventory_movements', cloneMovements)

  // -------------------------------------------------------------------------
  // Storage helpers (client-only guard)
  // -------------------------------------------------------------------------

  function saveToStorage(): void {
    if (import.meta.client) {
      const data: StorageData = {
        balances: balances.value,
        movements: movements.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }

  function loadFromStorage(): void {
    if (!import.meta.client) return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as StorageData
      if (Array.isArray(parsed.balances) && parsed.balances.length > 0) {
        balances.value = parsed.balances
      }
      if (Array.isArray(parsed.movements)) {
        movements.value = parsed.movements
      }
    } catch {
      // Data korup — biarkan state default tetap digunakan
    }
  }

  // Sinkronisasi localStorage setelah hydration selesai
  onMounted(() => {
    loadFromStorage()
  })

  // -------------------------------------------------------------------------
  // Helper: ambil saldo satu produk
  // -------------------------------------------------------------------------

  function getBalance(productId: string): InventoryBalance | undefined {
    return balances.value.find((b) => b.product_id === productId)
  }

  // -------------------------------------------------------------------------
  // PG-11: Catat penerimaan pasokan
  // -------------------------------------------------------------------------

  async function recordReceipt(payload: ReceiptPayload): Promise<StockMovement> {
    if (payload.full_received < 0) {
      throw new Error('Jumlah tabung penuh diterima tidak boleh negatif.')
    }
    if (payload.empty_sent < 0) {
      throw new Error('Jumlah tabung kosong dikirim tidak boleh negatif.')
    }
    if (!payload.full_received && !payload.empty_sent) {
      throw new Error('Minimal satu nilai (tabung penuh diterima atau tabung kosong dikirim) harus diisi.')
    }

    const balance = balances.value.find((b) => b.product_id === payload.product_id)
    if (!balance) {
      throw new Error('Produk tidak ditemukan di inventaris.')
    }

    if (payload.empty_sent > balance.empty_qty) {
      throw new Error(
        `Tabung kosong tidak mencukupi. Tersedia: ${balance.empty_qty} tabung kosong.`,
      )
    }

    const fullBefore = balance.full_qty
    const emptyBefore = balance.empty_qty

    balance.full_qty += payload.full_received
    balance.empty_qty -= payload.empty_sent
    // reserved_qty TIDAK berubah
    balance.available_qty = Math.max(0, balance.full_qty - balance.reserved_qty)

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      product_id: payload.product_id,
      type: 'PENERIMAAN_PASOKAN',
      full_delta: payload.full_received,
      empty_delta: -payload.empty_sent,
      full_before: fullBefore,
      empty_before: emptyBefore,
      full_after: balance.full_qty,
      empty_after: balance.empty_qty,
      reason: payload.reason || 'Penerimaan pasokan dari agen',
      actor: payload.actor,
      created_at: new Date().toISOString(),
    }

    movements.value.unshift(movement) // terbaru di atas
    saveToStorage()
    return movement
  }

  // -------------------------------------------------------------------------
  // Order Stock Coordination (PG-14/15 & PRD Rule)
  // -------------------------------------------------------------------------

  /**
   * Alokasikan stok untuk order saat dikonfirmasi.
   * Cek atomik: semua item harus memiliki available_qty >= quantity.
   */
  async function allocateOrderStock(
    orderId: string,
    items: Array<{ product_id: string; product_name?: string; quantity: number }>,
    actor: string
  ): Promise<void> {
    // 1. Cek ketersediaan SEMUA item terlebih dahulu (mencegah reservasi parsial)
    for (const item of items) {
      const balance = balances.value.find((b) => b.product_id === item.product_id)
      if (!balance) {
        throw new Error(`Produk "${item.product_name || item.product_id}" tidak ditemukan di inventaris.`)
      }
      const available = Math.max(0, balance.full_qty - balance.reserved_qty)
      if (item.quantity > available) {
        throw new Error(
          `Stok produk "${item.product_name || item.product_id}" tidak mencukupi. Tersedia: ${available} tabung, dibutuhkan: ${item.quantity} tabung.`
        )
      }
    }

    // 2. Lakukan alokasi untuk seluruh item
    for (const item of items) {
      const balance = balances.value.find((b) => b.product_id === item.product_id)!
      const fullBefore = balance.full_qty
      const emptyBefore = balance.empty_qty

      balance.reserved_qty += item.quantity
      balance.available_qty = Math.max(0, balance.full_qty - balance.reserved_qty)

      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        product_id: item.product_id,
        type: 'ALOKASI_ORDER',
        full_delta: 0,
        empty_delta: 0,
        full_before: fullBefore,
        empty_before: emptyBefore,
        full_after: balance.full_qty,
        empty_after: balance.empty_qty,
        reason: `Alokasi stok ${item.quantity} tabung untuk pesanan ${orderId}`,
        actor,
        reference_id: orderId,
        created_at: new Date().toISOString(),
      }
      movements.value.unshift(movement)
    }

    saveToStorage()
  }

  /**
   * Lepaskan alokasi stok saat order dibatalkan setelah dikonfirmasi.
   */
  async function releaseOrderStock(
    orderId: string,
    items: Array<{ product_id: string; quantity: number }>,
    actor: string,
    reason: string
  ): Promise<void> {
    for (const item of items) {
      const balance = balances.value.find((b) => b.product_id === item.product_id)
      if (balance) {
        const fullBefore = balance.full_qty
        const emptyBefore = balance.empty_qty

        balance.reserved_qty = Math.max(0, balance.reserved_qty - item.quantity)
        balance.available_qty = Math.max(0, balance.full_qty - balance.reserved_qty)

        const movement: StockMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          product_id: item.product_id,
          type: 'PELEPASAN_ALOKASI',
          full_delta: 0,
          empty_delta: 0,
          full_before: fullBefore,
          empty_before: emptyBefore,
          full_after: balance.full_qty,
          empty_after: balance.empty_qty,
          reason: `Pelepasan reservasi ${item.quantity} tabung (Pesanan ${orderId}): ${reason}`,
          actor,
          reference_id: orderId,
          created_at: new Date().toISOString(),
        }
        movements.value.unshift(movement)
      }
    }

    saveToStorage()
  }

  /**
   * Selesaikan serah-terima pesanan:
   * - Kurangi stok penuh fisik sesuai kuantitas tabung
   * - Lepaskan reserved_qty sesuai kuantitas tabung
   * - Tambah stok kosong fisik sesuai tabung kosong aktual yang diterima
   */
  async function completeOrderHandoverStock(
    orderId: string,
    returns: Array<{ product_id: string; quantity: number; empty_returned: number }>,
    actor: string
  ): Promise<void> {
    for (const ret of returns) {
      const balance = balances.value.find((b) => b.product_id === ret.product_id)
      if (balance) {
        const fullBefore = balance.full_qty
        const emptyBefore = balance.empty_qty

        balance.full_qty = Math.max(0, balance.full_qty - ret.quantity)
        balance.reserved_qty = Math.max(0, balance.reserved_qty - ret.quantity)
        balance.empty_qty += ret.empty_returned
        balance.available_qty = Math.max(0, balance.full_qty - balance.reserved_qty)

        const movement: StockMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          product_id: ret.product_id,
          type: 'SERAH_TERIMA',
          full_delta: -ret.quantity,
          empty_delta: ret.empty_returned,
          full_before: fullBefore,
          empty_before: emptyBefore,
          full_after: balance.full_qty,
          empty_after: balance.empty_qty,
          reason: `Serah terima pesanan ${orderId} (-${ret.quantity} penuh, +${ret.empty_returned} kosong)`,
          actor,
          reference_id: orderId,
          created_at: new Date().toISOString(),
        }
        movements.value.unshift(movement)
      }
    }

    saveToStorage()
  }

  // -------------------------------------------------------------------------
  // PG-13: Koreksi stok (Admin only — enforcement di UI, bukan di sini)
  // -------------------------------------------------------------------------

  async function recordAdjustment(payload: AdjustmentPayload): Promise<StockMovement> {
    if (!payload.reason || payload.reason.trim() === '') {
      throw new Error('Alasan koreksi stok wajib diisi.')
    }
    if (payload.full_delta === 0 && payload.empty_delta === 0) {
      throw new Error('Delta stok penuh dan delta stok kosong tidak boleh keduanya nol.')
    }

    const balance = balances.value.find((b) => b.product_id === payload.product_id)
    if (!balance) {
      throw new Error('Produk tidak ditemukan di inventaris.')
    }

    const newFull = balance.full_qty + payload.full_delta
    const newEmpty = balance.empty_qty + payload.empty_delta

    if (newFull < 0) {
      throw new Error(
        `Saldo tabung penuh tidak boleh negatif. Saldo saat ini: ${balance.full_qty}, delta: ${payload.full_delta}.`,
      )
    }
    if (newEmpty < 0) {
      throw new Error(
        `Saldo tabung kosong tidak boleh negatif. Saldo saat ini: ${balance.empty_qty}, delta: ${payload.empty_delta}.`,
      )
    }

    const fullBefore = balance.full_qty
    const emptyBefore = balance.empty_qty

    balance.full_qty = newFull
    balance.empty_qty = newEmpty
    // reserved_qty TIDAK berubah akibat koreksi
    balance.available_qty = Math.max(0, balance.full_qty - balance.reserved_qty)

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      product_id: payload.product_id,
      type: 'KOREKSI_STOK',
      full_delta: payload.full_delta,
      empty_delta: payload.empty_delta,
      full_before: fullBefore,
      empty_before: emptyBefore,
      full_after: balance.full_qty,
      empty_after: balance.empty_qty,
      reason: payload.reason.trim(),
      actor: payload.actor,
      created_at: new Date().toISOString(),
    }

    movements.value.unshift(movement) // terbaru di atas
    saveToStorage()
    return movement
  }

  // -------------------------------------------------------------------------
  // Reset ke data awal
  // -------------------------------------------------------------------------

  function resetDefault(): void {
    balances.value = cloneBalances()
    movements.value = cloneMovements()
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    balances,
    movements,
    recordReceipt,
    recordAdjustment,
    allocateOrderStock,
    releaseOrderStock,
    completeOrderHandoverStock,
    getBalance,
    resetDefault,
  }
}
