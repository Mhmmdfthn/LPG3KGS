import type { Connection } from '../lib/db'
import type { Filters } from '../lib/validation'
import { safeUser, type Actor } from '../lib/core'

export class Where {
  values: any[] = []
  parts: string[] = []
  add(sql: string, value?: any) {
    if (value !== undefined) { this.values.push(value); sql = sql.replaceAll('?', '$'+this.values.length) }
    this.parts.push(sql)
    return this
  }
  get sql() { return this.parts.length ? ' WHERE '+this.parts.join(' AND ') : '' }
}
export function dates(w: Where, f: Filters, column: string) {
  if (f.from) w.add(`${column} >= (?::date::timestamp AT TIME ZONE 'Asia/Jakarta')`,f.from)
  if (f.to) w.add(`${column} < ((?::date + 1)::timestamp AT TIME ZONE 'Asia/Jakarta')`,f.to)
  return w
}
export async function page(db: Connection, select: string, from: string, w: Where, order: string, f: Filters) {
  const count = (await db.query('SELECT count(*)::integer AS total '+from+w.sql,w.values)).rows[0]!.total
  const values = [...w.values,f.limit,(f.page-1)*f.limit]
  const rows = (await db.query(`SELECT ${select} ${from}${w.sql} ORDER BY ${order} LIMIT $${values.length-1} OFFSET $${values.length}`,values)).rows
  return { items: rows, pagination: { page: f.page, limit: f.limit, total: count } }
}
export async function accounts(db: Connection, role: string, f: Filters, pending = false) {
  const w = new Where().add('u.role=?',role)
  if (pending) w.add("u.status='PENDING'")
  else if (f.status) w.add('u.status=?',f.status)
  if (f.q) w.add("(u.username ILIKE ? OR u.name ILIKE ? OR u.business_name ILIKE ?)",'%'+f.q+'%')
  const result = await page(db,'u.*','FROM users u',w,'u.created_at DESC,u.id',f)
  return { ...result, items: result.items.map(safeUser) }
}
export async function catalog(db: Connection, actor: Actor, f: Filters, inventory = false) {
  const w = new Where()
  if (actor.role === 'pengecer') w.add('p.active=true')
  if (f.q) w.add('p.name ILIKE ?', '%'+f.q+'%')
  if (f.product_id) w.add('p.id=?',f.product_id)
  const stock = inventory ? ',i.full_qty,i.empty_qty,i.reserved_qty' : ''
  return page(db,`p.*,i.full_qty-i.reserved_qty AS available_qty,(i.full_qty-i.reserved_qty < p.minimum_stock) AS low_stock${stock}`,'FROM products p JOIN inventory i ON i.product_id=p.id',w,'p.created_at,p.id',f)
}
export async function orders(db: Connection, actor: Actor, f: Filters) {
  const w = dates(new Where(),f,'o.created_at')
  if (actor.role === 'pengecer') w.add('o.retailer_id=?',actor.id)
  else if (f.retailer_id) w.add('o.retailer_id=?',f.retailer_id)
  if (f.status) w.add('o.status=?',f.status)
  if (f.q) w.add('o.number ILIKE ?', '%'+f.q+'%')
  return page(db,'o.*','FROM orders o',w,'o.created_at DESC,o.id',f)
}
export function salesWhere(actor: Actor, f: Filters, receivables = false) {
  const w = dates(new Where(),f,'s.created_at')
  if (actor.role === 'pengecer') w.add('s.retailer_id=?',actor.id)
  else if (f.retailer_id) w.add('s.retailer_id=?',f.retailer_id)
  if (f.source) w.add('s.source=?',f.source)
  if (f.payment_type) w.add('s.payment_type=?',f.payment_type)
  if (f.payment_status) w.add('s.payment_status=?',f.payment_status)
  if (f.q) w.add('s.number ILIKE ?', '%'+f.q+'%')
  if (f.product_id) w.add('EXISTS (SELECT 1 FROM sale_items si WHERE si.sale_id=s.id AND si.product_id=?)',f.product_id)
  if (receivables) { w.add('s.retailer_id IS NOT NULL'); if (!f.payment_status) w.add('s.balance>0') }
  return w
}
export async function sales(db: Connection, actor: Actor, f: Filters, receivables = false) {
  const columns = actor.role === 'karyawan' && !receivables
    ? 's.id,s.number,s.order_id,s.retailer_id,s.source,s.payment_type,s.total,s.actor_id,s.created_at'
    : 's.*'
  return page(db,columns,'FROM sale_balances s',salesWhere(actor,f,receivables),'s.created_at DESC,s.id',f)
}
export function stockWhere(f: Filters) {
  const w = dates(new Where(),f,'m.created_at')
  if (f.product_id) w.add('m.product_id=?',f.product_id)
  if (f.type) w.add('m.type=?',f.type)
  return w
}
export async function movements(db: Connection, f: Filters) {
  return page(db,'m.*','FROM stock_movements m',stockWhere(f),'m.created_at DESC,m.id',f)
}
export async function audits(db: Connection, f: Filters) {
  const w = dates(new Where(),f,'a.created_at')
  if (f.actor_id) w.add('a.actor_id=?',f.actor_id)
  if (f.action) w.add('a.action=?',f.action)
  return page(db,'a.*','FROM audit_logs a',w,'a.created_at DESC,a.id',f)
}
export async function payments(db: Connection, actor: Actor, f: Filters) {
  const w = dates(new Where(),f,'p.paid_at')
  if (actor.role === 'pengecer') w.add('s.retailer_id=?',actor.id)
  else if (f.retailer_id) w.add('s.retailer_id=?',f.retailer_id)
  if (f.q) w.add('(p.number ILIKE ? OR s.number ILIKE ?)', '%'+f.q+'%')
  if (f.payment_status) w.add('s.payment_status=?',f.payment_status)
  return page(db,'p.*,s.number AS sale_number,s.retailer_id,s.payment_status','FROM payments p JOIN sale_balances s ON s.id=p.sale_id',w,'p.paid_at DESC,p.id',f)
}
export async function dashboard(db: Connection) {
  const inventory = (await db.query(`SELECT p.id,p.name,i.full_qty,i.empty_qty,i.reserved_qty,i.full_qty-i.reserved_qty AS available_qty,
    p.minimum_stock,(i.full_qty-i.reserved_qty<p.minimum_stock) AS low_stock FROM products p JOIN inventory i ON i.product_id=p.id ORDER BY p.name`)).rows
  const summary = (await db.query(`SELECT
    (SELECT count(*)::integer FROM orders WHERE status='MENUNGGU_KONFIRMASI') AS pending_orders,
    (SELECT COALESCE(sum(total),0)::bigint::text FROM sales WHERE (created_at AT TIME ZONE 'Asia/Jakarta')::date=(now() AT TIME ZONE 'Asia/Jakarta')::date) AS sales_today,
    (SELECT COALESCE(sum(amount),0)::bigint::text FROM payments WHERE (paid_at AT TIME ZONE 'Asia/Jakarta')::date=(now() AT TIME ZONE 'Asia/Jakarta')::date) AS cash_received_today,
    (SELECT COALESCE(sum(balance),0)::bigint::text FROM sale_balances WHERE retailer_id IS NOT NULL) AS total_receivables`)).rows[0]
  return { ...summary, inventory, timezone: 'Asia/Jakarta', updated_at: new Date().toISOString() }
}
export async function salesReport(db: Connection, actor: Actor, f: Filters) {
  const w = salesWhere(actor,f)
  const summary = (await db.query(`SELECT count(*)::integer AS sale_count,COALESCE(sum(s.total),0)::text AS total_sales,
    COALESCE(sum(s.paid),0)::text AS cumulative_payments,COALESCE(sum(s.balance),0)::text AS remaining_balance FROM sale_balances s${w.sql}`,w.values)).rows[0]
  // Receipt dates are filtered independently: revenue and cash are different measures.
  const pw = dates(new Where(),f,'p.paid_at')
  if (f.retailer_id) pw.add('s.retailer_id=?',f.retailer_id)
  if (f.source) pw.add('s.source=?',f.source)
  if (f.payment_type) pw.add('s.payment_type=?',f.payment_type)
  if (f.q) pw.add('s.number ILIKE ?', '%'+f.q+'%')
  if (f.payment_status) pw.add('s.payment_status=?',f.payment_status)
  if (f.product_id) pw.add('EXISTS (SELECT 1 FROM sale_items si WHERE si.sale_id=s.id AND si.product_id=?)',f.product_id)
  const cash = (await db.query(`SELECT COALESCE(sum(p.amount),0)::text AS cash_received_in_period FROM payments p JOIN sale_balances s ON s.id=p.sale_id${pw.sql}`,pw.values)).rows[0]
  return { summary: { ...summary, ...cash }, ...await sales(db,actor,f), timezone: 'Asia/Jakarta' }
}
export async function stockReport(db: Connection, f: Filters) {
  const w = stockWhere(f)
  const summary = (await db.query(`SELECT m.product_id,p.name,count(*)::integer AS movement_count,
    sum(m.full_delta)::text AS full_change,sum(m.empty_delta)::text AS empty_change,sum(m.reserved_delta)::text AS reserved_change
    FROM stock_movements m JOIN products p ON p.id=m.product_id${w.sql} GROUP BY m.product_id,p.name ORDER BY p.name`,w.values)).rows
  return { summary, ...await movements(db,f), timezone: 'Asia/Jakarta' }
}
export async function receivablesReport(db: Connection, actor: Actor, f: Filters) {
  const w = salesWhere(actor,f)
  w.add('s.retailer_id IS NOT NULL')
  const grouped = `FROM sale_balances s JOIN users u ON u.id=s.retailer_id${w.sql} GROUP BY s.retailer_id,u.name,u.business_name`
  const count = (await db.query(`SELECT count(*)::integer AS total FROM (SELECT s.retailer_id ${grouped}) r`,w.values)).rows[0]!.total
  const summary = (await db.query(`SELECT COALESCE(sum(s.total),0)::text AS principal,COALESCE(sum(s.paid),0)::text AS paid,COALESCE(sum(s.balance),0)::text AS balance FROM sale_balances s${w.sql}`,w.values)).rows[0]
  const values = [...w.values,f.limit,(f.page-1)*f.limit]
  const items = (await db.query(`SELECT s.retailer_id,u.name,u.business_name,count(*)::integer AS transaction_count,
    sum(s.total)::text AS principal,sum(s.paid)::text AS paid,sum(s.balance)::text AS balance ${grouped}
    ORDER BY u.name,s.retailer_id LIMIT $${values.length-1} OFFSET $${values.length}`,values)).rows
  return { summary, items, pagination: { page: f.page, limit: f.limit, total: count }, timezone: 'Asia/Jakarta' }
}
