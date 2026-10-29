import type { Connection, Row } from '../lib/db'
import { audit, fail, id, money, number, one, own, type Actor } from '../lib/core'
import { lockProducts, move } from './inventory'

type Item = { product_id: string; quantity: number; empty_returned?: number; product_name?: string; unit_price?: number; subtotal?: number }
type Settlement = { payment_type: 'TUNAI' | 'BON'; amount_paid: number; method: string; note?: string; returns: { product_id: string; empty_returned: number }[] }
export async function orderDetail(db: Connection, actor: Actor, orderId: string) {
  const order = await one(db,'SELECT * FROM orders WHERE id=$1',[orderId])
  own(actor,order.retailer_id)
  const items = (await db.query('SELECT * FROM order_items WHERE order_id=$1 ORDER BY product_id',[orderId])).rows
  const history = (await db.query('SELECT * FROM order_history WHERE order_id=$1 ORDER BY created_at,id',[orderId])).rows
  const sale = (await db.query('SELECT id,number FROM sales WHERE order_id=$1',[orderId])).rows[0] ?? null
  return { ...order, items, history, sale }
}
export async function saleDetail(db: Connection, actor: Actor, saleId: string) {
  const sale = await one(db,'SELECT * FROM sale_balances WHERE id=$1',[saleId])
  own(actor,sale.retailer_id)
  const items = (await db.query('SELECT * FROM sale_items WHERE sale_id=$1 ORDER BY product_id',[saleId])).rows
  const payments = (await db.query('SELECT * FROM payments WHERE sale_id=$1 ORDER BY paid_at,created_at,id',[saleId])).rows
  return { ...sale, items, payments }
}
async function history(tx: Connection, actor: Actor, orderId: string, status: string, reason?: string) {
  await tx.query('INSERT INTO order_history (id,order_id,status,reason,actor_id) VALUES ($1,$2,$3,$4,$5)',[id(),orderId,status,reason ?? null,actor.id])
}
export async function submitOrder(tx: Connection, actor: Actor, body: { items: Item[] }) {
  const products = await lockProducts(tx,body.items.map(i => i.product_id))
  const items = body.items.map(item => {
    const p = products.get(item.product_id)!
    if (!p.active) fail(409,'Produk tidak aktif.')
    if (p.full_qty-p.reserved_qty < item.quantity) fail(409,`Jumlah pesanan melebihi stok tersedia. ${p.name}: ${p.full_qty-p.reserved_qty} tabung.`)
    return { ...item, product_name: p.name, unit_price: p.price, subtotal: money(item.quantity * p.price) }
  })
  const orderId = id(), total = money(items.reduce((sum,item) => sum+item.subtotal,0))
  await tx.query('INSERT INTO orders (id,number,retailer_id,total) VALUES ($1,$2,$3,$4)',[orderId,number('ORD'),actor.id,total])
  for (const item of items) await tx.query('INSERT INTO order_items (order_id,product_id,product_name,quantity,unit_price,subtotal) VALUES ($1,$2,$3,$4,$5,$6)',[orderId,item.product_id,item.product_name,item.quantity,item.unit_price,item.subtotal])
  await history(tx,actor,orderId,'MENUNGGU_KONFIRMASI')
  await audit(tx,actor,'ORDER_SUBMITTED','order',orderId,null,{ total, items })
  return orderDetail(tx,actor,orderId)
}
export async function transitionOrder(tx: Connection, actor: Actor, orderId: string, action: 'confirm' | 'reject' | 'cancel', reason?: string) {
  const order = await one(tx,'SELECT * FROM orders WHERE id=$1 FOR UPDATE',[orderId])
  if (action === 'cancel') {
    if (!['MENUNGGU_KONFIRMASI','DIKONFIRMASI'].includes(order.status)) fail(409,'Pesanan tidak dapat dibatalkan pada status ini.')
  } else if (order.status !== 'MENUNGGU_KONFIRMASI') fail(409,'Pesanan sudah diproses.')
  const items = (await tx.query('SELECT * FROM order_items WHERE order_id=$1 ORDER BY product_id',[orderId])).rows
  if (action === 'confirm' || order.status === 'DIKONFIRMASI') {
    const products = await lockProducts(tx,items.map(i => i.product_id))
    if (action === 'confirm') {
      const retailer = await one(tx,'SELECT status FROM users WHERE id=$1',[order.retailer_id])
      if (retailer.status !== 'ACTIVE') fail(409,'Akun pengecer tidak aktif.')
    }
    for (const item of items) {
      const p = products.get(item.product_id)!
      if (action === 'confirm' && !p.active) fail(409,'Produk tidak aktif. Batalkan pesanan dan ajukan ulang.')
      await move(tx,actor,p,action === 'confirm' ? 'RESERVE' : 'RELEASE',0,0,action === 'confirm' ? item.quantity : -item.quantity,orderId,reason)
    }
  }
  const status = { confirm: 'DIKONFIRMASI', reject: 'DITOLAK', cancel: 'DIBATALKAN' }[action]
  await tx.query('UPDATE orders SET status=$2,updated_at=now() WHERE id=$1',[orderId,status])
  await history(tx,actor,orderId,status,reason)
  await audit(tx,actor,'ORDER_'+action.toUpperCase(),'order',orderId,{ status: order.status },{ status, reason })
  return orderDetail(tx,actor,orderId)
}
async function recordPayment(tx: Connection, actor: Actor, saleId: string, amount: number, method: string, note?: string, paidAt?: string) {
  const paymentId = id()
  const payment = await one(tx,'INSERT INTO payments (id,number,sale_id,amount,method,note,paid_at,actor_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [paymentId,number('PAY'),saleId,amount,method,note ?? null,paidAt ?? new Date().toISOString(),actor.id])
  await audit(tx,actor,'PAYMENT_RECORDED','payment',paymentId,null,{ sale_id: saleId, amount, method, paid_at: payment.paid_at })
  return payment
}
async function makeSale(tx: Connection, actor: Actor, items: Row[], total: number, payment: { payment_type: string; amount_paid: number; method: string; note?: string }, order?: Row) {
  if (payment.amount_paid > total) fail(422,'Pembayaran melebihi total penjualan.')
  if (payment.payment_type === 'TUNAI' && payment.amount_paid !== total) fail(422,'Pembayaran tunai harus sama dengan total penjualan.')
  const saleId = id()
  await tx.query('INSERT INTO sales (id,number,order_id,retailer_id,source,payment_type,total,actor_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [saleId,number('SAL'),order?.id ?? null,order?.retailer_id ?? null,order ? 'ORDER' : 'DIRECT',payment.payment_type,total,actor.id])
  for (const item of items) await tx.query('INSERT INTO sale_items (sale_id,product_id,product_name,quantity,empty_returned,unit_price,subtotal) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [saleId,item.product_id,item.product_name,item.quantity,item.empty_returned,item.unit_price,item.subtotal])
  if (payment.amount_paid > 0) await recordPayment(tx,actor,saleId,payment.amount_paid,payment.method,payment.note)
  await audit(tx,actor,'SALE_CREATED','sale',saleId,null,{ order_id: order?.id ?? null, total, payment_type: payment.payment_type })
  return saleId
}
export async function completeOrder(tx: Connection, actor: Actor, orderId: string, body: Settlement) {
  const order = await one(tx,'SELECT * FROM orders WHERE id=$1 FOR UPDATE',[orderId])
  if (order.status !== 'DIKONFIRMASI') fail(409,'Hanya pesanan terkonfirmasi yang dapat diserahterimakan.')
  const items = (await tx.query('SELECT * FROM order_items WHERE order_id=$1 ORDER BY product_id',[orderId])).rows
  if (body.returns.length !== items.length || body.returns.some(r => !items.some(i => i.product_id === r.product_id))) fail(422,'Jumlah kosong aktual wajib diisi untuk setiap produk pesanan, termasuk nol.')
  const products = await lockProducts(tx,items.map(i => i.product_id))
  const saleItems: Row[] = items.map(i => ({ ...i, empty_returned: body.returns.find(r => r.product_id === i.product_id)!.empty_returned }))
  const saleId = await makeSale(tx,actor,saleItems,order.total,body,order)
  for (const item of saleItems) await move(tx,actor,products.get(item.product_id)!,'SALE',-item.quantity,item.empty_returned,-item.quantity,saleId)
  await tx.query("UPDATE orders SET status='SELESAI',updated_at=now() WHERE id=$1",[orderId])
  await history(tx,actor,orderId,'SELESAI')
  await audit(tx,actor,'ORDER_COMPLETED','order',orderId,{ status: order.status },{ status: 'SELESAI', sale_id: saleId })
  return saleDetail(tx,actor,saleId)
}
export async function directSale(tx: Connection, actor: Actor, body: { items: Item[]; amount_paid: number; method: string; note?: string }) {
  const products = await lockProducts(tx,body.items.map(i => i.product_id))
  const items = body.items.map(i => {
    const p = products.get(i.product_id)!
    if (!p.active) fail(409,'Produk tidak aktif.')
    if (p.full_qty-p.reserved_qty < i.quantity) fail(409,'Stok tersedia tidak cukup; stok yang dialokasikan tidak boleh dijual langsung.')
    return { ...i, product_name: p.name, unit_price: p.price, subtotal: money(i.quantity*p.price) }
  })
  const total = money(items.reduce((sum,i) => sum+i.subtotal,0))
  const saleId = await makeSale(tx,actor,items,total,{ ...body, payment_type: 'TUNAI' })
  for (const item of items) await move(tx,actor,products.get(item.product_id)!,'SALE',-item.quantity,item.empty_returned!,0,saleId)
  return saleDetail(tx,actor,saleId)
}
export async function paySale(tx: Connection, actor: Actor, saleId: string, body: { amount: number; method: string; note?: string; paid_at?: string }) {
  // Lock the sale before calculating SUM(payments); concurrent payments serialize here.
  const sale = await one(tx,'SELECT * FROM sales WHERE id=$1 FOR UPDATE',[saleId])
  if (!sale.retailer_id) fail(409,'Penjualan langsung sudah dibayar tunai.')
  const balance = await one(tx,'SELECT * FROM sale_balances WHERE id=$1',[saleId])
  if (body.amount > balance.balance) fail(422,`Nominal pembayaran melebihi sisa tagihan Rp${balance.balance}.`)
  if (body.paid_at && Date.parse(body.paid_at) < new Date(sale.created_at).getTime()) fail(422,'Tanggal pembayaran tidak boleh sebelum penjualan.')
  const payment = await recordPayment(tx,actor,saleId,body.amount,body.method,body.note,body.paid_at)
  return { payment, sale: await saleDetail(tx,actor,saleId) }
}
