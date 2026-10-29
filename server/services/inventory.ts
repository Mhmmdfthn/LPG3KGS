import type { Connection, Database, Row } from '../lib/db'
import { audit, fail, id, one, type Actor } from '../lib/core'

// Every multi-product operation locks products in UUID order, then their inventory.
export async function lockProducts(tx: Connection, productIds: string[]) {
  const products = (await tx.query('SELECT * FROM products WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE', [productIds])).rows
  if (products.length !== productIds.length) fail(404, 'Produk tidak ditemukan.')
  const stock = (await tx.query('SELECT * FROM inventory WHERE product_id=ANY($1::uuid[]) ORDER BY product_id FOR UPDATE', [productIds])).rows
  return new Map(products.map(p => [p.id as string, { ...p, ...stock.find(s => s.product_id === p.id) }]))
}
export async function move(tx: Connection, actor: Actor, stock: Row, type: string, fullDelta: number, emptyDelta: number, reservedDelta: number, referenceId: string, reason?: string) {
  const full = stock.full_qty + fullDelta, empty = stock.empty_qty + emptyDelta, reserved = stock.reserved_qty + reservedDelta
  if (full < 0 || empty < 0 || reserved < 0 || reserved > full) fail(409, 'Stok berubah atau tidak mencukupi. Periksa stok tersedia dan alokasi.')
  await tx.query('UPDATE inventory SET full_qty=$2,empty_qty=$3,reserved_qty=$4 WHERE product_id=$1', [stock.id, full, empty, reserved])
  await tx.query(`INSERT INTO stock_movements (id,product_id,type,full_delta,empty_delta,reserved_delta,before_full,before_empty,before_reserved,after_full,after_empty,after_reserved,reference_id,reason,actor_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
  [id(),stock.id,type,fullDelta,emptyDelta,reservedDelta,stock.full_qty,stock.empty_qty,stock.reserved_qty,full,empty,reserved,referenceId,reason ?? null,actor.id])
  Object.assign(stock, { full_qty: full, empty_qty: empty, reserved_qty: reserved })
}
export async function createProduct(db: Database, actor: Actor, body: Record<string, any>) {
  return db.transaction(async tx => {
    const productId = id()
    const product = await one(tx, 'INSERT INTO products (id,name,size_kg,price,minimum_stock,active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [productId,body.name,body.size_kg,body.price,body.minimum_stock,body.active])
    await tx.query('INSERT INTO inventory (product_id) VALUES ($1)', [productId])
    await audit(tx, actor, 'PRODUCT_CREATED', 'product', productId, null, product)
    return product
  })
}
export async function updateProduct(db: Database, actor: Actor, productId: string, patch: Record<string, any>) {
  return db.transaction(async tx => {
    const before = await one(tx, 'SELECT * FROM products WHERE id=$1 FOR UPDATE', [productId])
    const values: any[] = [productId]
    const assignments = Object.entries(patch).map(([key,value]) => { values.push(value); return `${key}=$${values.length}` })
    const after = await one(tx, `UPDATE products SET ${assignments.join(',')},updated_at=now() WHERE id=$1 RETURNING *`, values)
    await audit(tx, actor, 'PRODUCT_UPDATED', 'product', productId, before, after)
    return after
  })
}
export async function receiveStock(tx: Connection, actor: Actor, body: { items: { product_id: string; full_received: number; empty_sent: number }[]; reason: string }) {
  const referenceId = id()
  const products = await lockProducts(tx, body.items.map(i => i.product_id))
  for (const item of body.items) {
    const p = products.get(item.product_id)!
    if (!p.active) fail(409, 'Pasokan hanya untuk produk aktif.')
    await move(tx,actor,p,'RECEIPT',item.full_received,-item.empty_sent,0,referenceId,body.reason)
  }
  await audit(tx,actor,'STOCK_RECEIVED','stock_receipt',referenceId,null,body)
  return { id: referenceId, items: [...products.values()] }
}
export async function adjustStock(tx: Connection, actor: Actor, body: { product_id: string; full_delta: number; empty_delta: number; reason: string }) {
  const referenceId = id()
  const products = await lockProducts(tx,[body.product_id])
  const p = products.get(body.product_id)!
  await move(tx,actor,p,'ADJUSTMENT',body.full_delta,body.empty_delta,0,referenceId,body.reason)
  await audit(tx,actor,'STOCK_ADJUSTED','stock_adjustment',referenceId,null,body)
  return { id: referenceId, inventory: p }
}
