/**
 * Helper pemformat data berdasarkan PRD dan Design System:
 * - Nominal Rupiah (Rp150.000)
 * - Kuantitas tabung (15 tabung)
 * - Tanggal dalam zona waktu Asia/Jakarta
 */

export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return 'Rp0'
  const numeric = typeof amount === 'string' ? Number(amount) : amount
  if (isNaN(numeric)) return 'Rp0'
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(numeric).replace(/\s+/g, '')
}

export function formatQuantity(qty: number | string | null | undefined, unit = 'tabung'): string {
  if (qty === null || qty === undefined || qty === '') return `0 ${unit}`
  const numeric = typeof qty === 'string' ? Number(qty) : qty
  if (isNaN(numeric)) return `0 ${unit}`

  return `${new Intl.NumberFormat('id-ID').format(numeric)} ${unit}`
}

export function formatDateTime(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '-'
  try {
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal
    if (isNaN(d.getTime())) return '-'

    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d) + ' WIB'
  } catch {
    return String(dateVal)
  }
}

export function formatDate(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '-'
  try {
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal
    if (isNaN(d.getTime())) return '-'

    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return String(dateVal)
  }
}

