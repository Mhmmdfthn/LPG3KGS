import type { PageResult } from '~/types/models'

export interface InventoryBalance { product_id: string; full_qty: number; empty_qty: number; reserved_qty: number; available_qty: number }
export type MovementType = 'PENERIMAAN_PASOKAN' | 'KOREKSI_STOK' | 'ALOKASI_ORDER' | 'PELEPASAN_ALOKASI' | 'SERAH_TERIMA' | 'PENJUALAN_LANGSUNG'
export interface StockMovement {
  id: string; product_id: string; type: MovementType; full_delta: number; empty_delta: number
  full_before: number; empty_before: number; full_after: number; empty_after: number
  reason: string; actor: string; created_at: string; reference_id?: string
}
export interface ReceiptPayload { product_id: string; full_received: number; empty_sent: number; reason: string; actor?: string }
export interface AdjustmentPayload { product_id: string; full_delta: number; empty_delta: number; reason: string; actor?: string }

const typeMap: Record<string, MovementType> = { RECEIPT: 'PENERIMAAN_PASOKAN', ADJUSTMENT: 'KOREKSI_STOK', RESERVE: 'ALOKASI_ORDER', RELEASE: 'PELEPASAN_ALOKASI', SALE: 'SERAH_TERIMA' }
function mapMovement(row: any): StockMovement {
  return { id: row.id, product_id: row.product_id, type: typeMap[row.type] || 'PENJUALAN_LANGSUNG', full_delta: Number(row.full_delta), empty_delta: Number(row.empty_delta), full_before: Number(row.before_full), empty_before: Number(row.before_empty), full_after: Number(row.after_full), empty_after: Number(row.after_empty), reason: row.reason || '', actor: row.actor_name || '', created_at: row.created_at, reference_id: row.reference_id }
}

export function useInventory() {
  const { api } = useApi()
  const balances = useState<InventoryBalance[]>('api_inventory', () => [])
  const movements = useState<StockMovement[]>('api_stock_movements', () => [])
  async function refresh() {
    const [stock, ledger] = await Promise.all([api<PageResult<any>>('/inventory?limit=100'), api<PageResult<any>>('/stock-movements?limit=100')])
    balances.value = stock.items.map(row => ({ product_id: row.id, full_qty: Number(row.full_qty), empty_qty: Number(row.empty_qty), reserved_qty: Number(row.reserved_qty), available_qty: Number(row.available_qty) }))
    movements.value = ledger.items.map(mapMovement)
    return balances.value
  }
  function getBalance(productId: string) { return balances.value.find(balance => balance.product_id === productId) }
  async function recordReceipt(input: ReceiptPayload) {
    const result = await api<any>('/stock-receipts', { method: 'POST', body: { items: [{ product_id: input.product_id, full_received: input.full_received, empty_sent: input.empty_sent }], reason: input.reason } })
    await refresh()
    return result
  }
  async function recordAdjustment(input: AdjustmentPayload) {
    const result = await api<any>('/stock-adjustments', { method: 'POST', body: { product_id: input.product_id, full_delta: input.full_delta, empty_delta: input.empty_delta, reason: input.reason } })
    await refresh()
    return result
  }
  if (import.meta.client) onMounted(() => { if (!balances.value.length) refresh().catch(() => {}) })
  return { balances, movements, refresh, getBalance, recordReceipt, recordAdjustment }
}
