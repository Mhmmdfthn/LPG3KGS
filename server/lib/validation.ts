import { z } from 'zod'

export const uuid = z.uuid()
export const qty = z.number().int().min(0).max(1_000_000)
export const rupiah = z.number().int().min(0).max(2147483647)
export const reason = z.string().trim().min(3).max(500)
export const password = z.string().min(10).max(72).refine(s => Buffer.byteLength(s, 'utf8') <= 72, 'Kata sandi maksimal 72 byte.')
export const username = z.string().trim().toLowerCase().regex(/^[a-z0-9_.-]{3,50}$/)
export const account = z.object({
  username, password,
  name: z.string().trim().min(2).max(120),
  business_name: z.string().trim().min(2).max(120).optional(),
  contact: z.string().trim().regex(/^\+?[0-9 ()-]{6,30}$/),
  email: z.email().max(254).toLowerCase().optional(),
}).strict()
export const registration = account.extend({ password_confirmation: password }).refine(v => v.password === v.password_confirmation, 'Konfirmasi kata sandi tidak sama.')
export const accountPatch = account.omit({ password: true }).partial().extend({ status: z.enum(['ACTIVE','INACTIVE']).optional() }).strict().refine(v => Object.keys(v).length > 0)
const productFields = z.object({ name: z.string().trim().min(2).max(120), size_kg: z.number().positive().max(100).multipleOf(0.01), price: rupiah, minimum_stock: qty, active: z.boolean() }).strict()
export const product = productFields.extend({ minimum_stock: qty.default(0), active: z.boolean().default(true) })
export const productPatch = productFields.partial().strict().refine(v => Object.keys(v).length > 0)
export const orderItem = z.object({ product_id: uuid, quantity: qty.refine(v => v > 0) }).strict()
export const uniqueItems = <T extends { product_id: string }>(items: T[]) => new Set(items.map(i => i.product_id)).size === items.length
export const orderBody = z.object({ items: z.array(orderItem).min(1).max(50).refine(uniqueItems, 'Produk tidak boleh berulang.') }).strict()
export const settlement = z.object({
  payment_type: z.enum(['TUNAI','BON']), amount_paid: rupiah,
  method: z.enum(['TUNAI','TRANSFER','LAINNYA']).default('TUNAI'),
  note: z.string().trim().max(500).optional(),
  returns: z.array(z.object({ product_id: uuid, empty_returned: qty }).strict()).min(1).max(50).refine(uniqueItems),
}).strict()
export const directBody = z.object({
  items: z.array(orderItem.extend({ empty_returned: qty })).min(1).max(50).refine(uniqueItems),
  amount_paid: rupiah,
  method: z.enum(['TUNAI','TRANSFER','LAINNYA']).default('TUNAI'),
  note: z.string().trim().max(500).optional(),
}).strict()
export const payment = z.object({ amount: rupiah.refine(v => v > 0), method: z.enum(['TUNAI','TRANSFER','LAINNYA']).default('TUNAI'), note: z.string().trim().max(500).optional(), paid_at: z.iso.datetime({ offset: true }).refine(v => Date.parse(v) <= Date.now(), 'Tanggal pembayaran tidak boleh di masa depan.').optional() }).strict()
export const receipt = z.object({ items: z.array(z.object({ product_id: uuid, full_received: qty, empty_sent: qty }).strict().refine(v => v.full_received + v.empty_sent > 0)).min(1).max(50).refine(uniqueItems), reason }).strict()
export const adjustment = z.object({ product_id: uuid, full_delta: z.number().int().min(-1_000_000).max(1_000_000), empty_delta: z.number().int().min(-1_000_000).max(1_000_000), reason }).strict().refine(v => v.full_delta !== 0 || v.empty_delta !== 0)
const date = z.iso.date()
export const filters = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  from: date.optional(), to: date.optional(),
  retailer_id: uuid.optional(), product_id: uuid.optional(), actor_id: uuid.optional(),
  status: z.string().max(40).optional(), q: z.string().trim().max(100).optional(),
  type: z.enum(['RECEIPT','ADJUSTMENT','RESERVE','RELEASE','SALE']).optional(),
  source: z.enum(['ORDER','DIRECT']).optional(), payment_type: z.enum(['TUNAI','BON']).optional(),
  payment_status: z.enum(['LUNAS','BELUM_DIBAYAR','DIBAYAR_SEBAGIAN']).optional(),
  action: z.string().max(80).optional(),
}).strict().refine(v => !v.from || !v.to || v.from <= v.to, 'Rentang tanggal tidak valid.')
export type Filters = z.infer<typeof filters>
