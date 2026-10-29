import { before, after, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { createApp, toNodeListener } from 'h3'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { testDatabase } from './helpers'
import { createBackend } from '../server/lib/api'
import { hash } from '../server/lib/core'
import type { Database } from '../server/lib/db'

let db: Database, server: Server, base: string
let admin: string, staff: string, retailer: string, other: string, product: string
const token = { admin:'a'.repeat(43), staff:'s'.repeat(43), retailer:'r'.repeat(43), other:'o'.repeat(43) }
type Role = keyof typeof token
async function api(method: string, path: string, role?: Role, body?: any, key = randomUUID(), extra: Record<string,string> = {}) {
  const response = await fetch(base+'/api'+path,{ method, headers:{ ...(role ? { Authorization:'Bearer '+token[role] } : {}), ...(body !== undefined ? { 'Content-Type':'application/json' } : {}), 'Idempotency-Key':key,...extra }, ...(body !== undefined ? { body:JSON.stringify(body) } : {}) })
  return { status:response.status, body:await response.json() as any, headers:response.headers }
}
async function ok(method: string, path: string, role?: Role, body?: any, key?: string) {
  const r = await api(method,path,role,body,key)
  assert.equal(r.status,200,JSON.stringify(r.body))
  assert.ok(r.body.request_id)
  return r.body.data
}
async function order(quantity = 4) { return ok('POST','/orders','retailer',{ items:[{ product_id:product,quantity }] }) }
async function confirm(orderId: string) { return ok('POST',`/orders/${orderId}/confirm`,'staff',{}) }
async function complete(orderId: string, paid = 0, empty = 3, key?: string) { return ok('POST',`/orders/${orderId}/complete`,'staff',{ payment_type:'BON',amount_paid:paid,returns:[{ product_id:product,empty_returned:empty }] },key) }
async function stock() { return (await ok('GET','/inventory','admin')).items[0] }

before(async () => {
  db = await testDatabase()
  const app = createApp().use(createBackend(db,{ appOrigin:'http://localhost:3000',sessionHours:12,secureCookies:false }))
  server = createServer(toNodeListener(app))
  await new Promise<void>(resolve => server.listen(0,'127.0.0.1',resolve))
  base = 'http://127.0.0.1:'+(server.address() as { port:number }).port
})
after(async () => {
  if (server) { server.closeAllConnections(); await new Promise<void>((resolve,reject) => server.close(e => e ? reject(e) : resolve())) }
  await db?.close()
})
beforeEach(async () => {
  await db.query('TRUNCATE users,products,auth_limits CASCADE')
  const passwordHash = await bcrypt.hash('password-uji-123',4)
  const ids: string[] = []
  for (const [name,role] of [['admin','admin'],['staff','karyawan'],['retailer','pengecer'],['other','pengecer']] as const) {
    const userId = randomUUID(); ids.push(userId)
    await db.query("INSERT INTO users (id,username,password_hash,name,contact,role,status) VALUES ($1,$2,$3,$2,'0812345678',$4,'ACTIVE')",[userId,name,passwordHash,role])
    await db.query("INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '1 day')",[hash(token[name]),userId])
  }
  ;[admin,staff,retailer,other] = ids as [string,string,string,string]
  product = (await ok('POST','/products','admin',{ name:'LPG 3 kg',size_kg:3,price:50000,minimum_stock:5 })).id
  await ok('POST','/stock-adjustments','admin',{ product_id:product,full_delta:12,empty_delta:15,reason:'Saldo pembukaan terverifikasi' })
})

test('login, kredensial salah, logout, kedaluwarsa dan pembatasan akses',async () => {
  assert.equal((await api('GET','/inventory')).status,401)
  assert.equal((await api('GET','/inventory','retailer')).status,403)
  assert.equal((await api('POST','/auth/login',undefined,{ identity:'admin',password:'salah' })).status,401)
  const login = await ok('POST','/auth/login',undefined,{ identity:'admin',password:'password-uji-123' })
  const headers = { Authorization:'Bearer '+login.token }
  assert.equal((await api('GET','/auth/me',undefined,undefined,undefined,headers)).status,200)
  await api('POST','/auth/logout',undefined,{},undefined,headers)
  assert.equal((await api('GET','/auth/me',undefined,undefined,undefined,headers)).status,401)
  await db.query("UPDATE sessions SET expires_at=now()-interval '1 minute' WHERE user_id=$1",[retailer])
  assert.equal((await api('GET','/auth/me','retailer')).status,401)
})
test('registrasi pending, approval dan penolakan beralasan; payload identitas ekstra ditolak',async () => {
  const payload = { username:'warung_baru',password:'aman-password-123',password_confirmation:'aman-password-123',name:'Warung Baru',contact:'08123456789' }
  const registered = await ok('POST','/retailer-registrations',undefined,payload)
  assert.equal(registered.user.status,'PENDING')
  assert.equal((await api('POST','/auth/login',undefined,{ identity:payload.username,password:payload.password })).status,401)
  assert.equal((await ok('GET','/retailers/pending','admin')).items.length,1)
  await ok('PATCH',`/retailers/${registered.user.id}/approval`,'admin',{ approved:true })
  assert.ok((await ok('POST','/auth/login',undefined,{ identity:payload.username,password:payload.password })).token)
  assert.equal((await api('POST','/retailer-registrations',undefined,{ ...payload,username:'extra_identity',nik:'123' })).status,422)
  const next = await ok('POST','/retailer-registrations',undefined,{ ...payload,username:'ditolak' })
  assert.equal((await api('PATCH',`/retailers/${next.user.id}/approval`,'admin',{ approved:false })).status,422)
  assert.equal((await ok('PATCH',`/retailers/${next.user.id}/approval`,'admin',{ approved:false,reason:'Kontak usaha belum terverifikasi' })).status,'REJECTED')
})
test('pasokan penuh/kosong terpisah dan rollback seluruh item jika salah satu gagal',async () => {
  await ok('POST','/stock-receipts','staff',{ items:[{ product_id:product,full_received:20,empty_sent:10 }],reason:'Pasokan agen' })
  assert.equal((await stock()).full_qty,32)
  assert.equal((await stock()).empty_qty,5)
  const failed = await api('POST','/stock-receipts','staff',{ items:[{ product_id:product,full_received:20,empty_sent:6 }],reason:'Pasokan gagal' })
  assert.equal(failed.status,409)
  assert.equal((await stock()).full_qty,32)
  const second = (await ok('POST','/products','admin',{ name:'Bright Gas',size_kg:12,price:100000 })).id
  assert.equal((await api('POST','/stock-receipts','staff',{ items:[{ product_id:product,full_received:10,empty_sent:0 },{ product_id:second,full_received:10,empty_sent:1 }],reason:'Harus batal seluruhnya' })).status,409)
  assert.equal((await db.query('SELECT full_qty FROM inventory WHERE product_id=$1',[product])).rows[0]!.full_qty,32)
})
test('admin membuat akun aktif; patch produk mempertahankan field yang tidak dikirim',async () => {
  const created = await ok('POST','/retailers','admin',{ username:'warung_admin',name:'Warung Admin',contact:'081222334455',password:'password-baru-123' })
  assert.equal(created.status,'ACTIVE')
  assert.equal(created.role,'pengecer')
  assert.ok(!('password_hash' in created))
  assert.ok((await ok('POST','/auth/login',undefined,{ identity:'warung_admin',password:'password-baru-123' })).token)
  const employee = await ok('POST','/staff','admin',{ username:'petugas_baru',name:'Petugas Baru',contact:'081222334456',password:'password-baru-123' })
  assert.equal(employee.role,'karyawan')
  await ok('PATCH','/products/'+product,'admin',{ active:false,minimum_stock:9 })
  const updated = await ok('PATCH','/products/'+product,'admin',{ price:60000 })
  assert.equal(updated.active,false)
  assert.equal(updated.minimum_stock,9)
  assert.equal((await ok('GET','/products','retailer')).items.length,0)
  assert.equal((await api('POST','/orders','retailer',{ items:[{ product_id:product,quantity:1 }] })).status,409)
  assert.equal((await api('POST','/retailers','admin',{ username:'salah_role',name:'Salah Role',contact:'081222334456',password:'password-baru-123',role:'admin' })).status,422)
})
test('multi-produk: kegagalan konfirmasi tidak menyisakan reservasi parsial',async () => {
  const second = (await ok('POST','/products','admin',{ name:'Bright Gas 12 kg',size_kg:12,price:150000 })).id
  await ok('POST','/stock-adjustments','admin',{ product_id:second,full_delta:2,empty_delta:0,reason:'Pembukaan stok kedua' })
  const a = await ok('POST','/orders','retailer',{ items:[{ product_id:product,quantity:4 },{ product_id:second,quantity:2 }] })
  await ok('POST','/sales/direct','staff',{ items:[{ product_id:second,quantity:1,empty_returned:0 }],amount_paid:150000 })
  assert.equal((await api('POST',`/orders/${a.id}/confirm`,'staff',{})).status,409)
  const stock = (await db.query('SELECT reserved_qty FROM inventory')).rows
  assert.ok(stock.every(s => s.reserved_qty === 0))
  assert.equal((await ok('GET','/orders/'+a.id,'admin')).status,'MENUNGGU_KONFIRMASI')
})
test('validasi stok/kuantitas, order belum mereservasi, idempotensi order',async () => {
  for (const quantity of [0,-1,1.5,13]) assert.ok((await api('POST','/orders','retailer',{ items:[{ product_id:product,quantity }] })).status >= 400)
  const key = randomUUID(), body = { items:[{ product_id:product,quantity:4 }] }
  const a = await ok('POST','/orders','retailer',body,key)
  const b = await ok('POST','/orders','retailer',body,key)
  assert.equal(a.id,b.id)
  assert.equal(a.status,'MENUNGGU_KONFIRMASI')
  assert.equal((await stock()).reserved_qty,0)
  assert.equal((await api('POST','/orders','retailer',{ items:[{ product_id:product,quantity:3 }] },key)).status,409)
  const noKey = await api('POST','/orders','retailer',body,undefined,{ 'Idempotency-Key':'' })
  assert.equal(noKey.status,422)
})
test('reservasi, pembatalan, penolakan dan batas status terminal',async () => {
  const a = await order(); await confirm(a.id)
  assert.equal((await stock()).full_qty,12)
  assert.equal((await stock()).reserved_qty,4)
  assert.equal((await api('POST',`/orders/${a.id}/reject`,'staff',{ reason:'Tidak sah' })).status,409)
  await ok('POST',`/orders/${a.id}/cancel`,'staff',{ reason:'Pengecer membatalkan' })
  assert.equal((await stock()).reserved_qty,0)
  assert.equal((await api('POST',`/orders/${a.id}/confirm`,'staff',{})).status,409)
  const b = await order()
  await ok('POST',`/orders/${b.id}/reject`,'staff',{ reason:'Tidak dapat dipenuhi' })
  assert.equal((await stock()).reserved_qty,0)
  assert.equal((await db.query('SELECT count(*)::int AS n FROM sales')).rows[0]!.n,0)
})
test('serah-terima sekali, kosong aktual, snapshot harga, bon dan cicilan hingga lunas',async () => {
  const a = await order(); await confirm(a.id)
  await ok('PATCH','/products/'+product,'admin',{ price:90000,name:'Nama baru' })
  const key = randomUUID()
  const sale = await complete(a.id,50000,3,key)
  assert.equal(sale.total,200000)
  assert.equal(sale.items[0].product_name,'LPG 3 kg')
  assert.equal(sale.balance,150000)
  assert.equal(sale.payment_status,'DIBAYAR_SEBAGIAN')
  assert.equal(sale.payments.length,1)
  assert.equal((await stock()).full_qty,8)
  assert.equal((await stock()).empty_qty,18)
  assert.equal((await stock()).reserved_qty,0)
  assert.equal((await complete(a.id,50000,3,key)).id,sale.id)
  assert.equal((await api('POST',`/orders/${a.id}/complete`,'staff',{ payment_type:'BON',amount_paid:0,returns:[{ product_id:product,empty_returned:3 }] })).status,409)
  const payKey = randomUUID()
  const paid = await ok('POST',`/sales/${sale.id}/payments`,'staff',{ amount:150000 },payKey)
  assert.equal(paid.sale.balance,0)
  assert.equal(paid.sale.payment_status,'LUNAS')
  assert.equal(paid.sale.payments.length,2)
  assert.equal((await ok('POST',`/sales/${sale.id}/payments`,'staff',{ amount:150000 },payKey)).payment.id,paid.payment.id)
})
test('bayar negatif, berlebih, tunai tidak penuh dan return tidak lengkap dibatalkan',async () => {
  const a = await order(); await confirm(a.id)
  assert.equal((await api('POST',`/orders/${a.id}/complete`,'staff',{ payment_type:'TUNAI',amount_paid:10,returns:[{ product_id:product,empty_returned:0 }] })).status,422)
  assert.equal((await api('POST',`/orders/${a.id}/complete`,'staff',{ payment_type:'BON',amount_paid:0,returns:[] })).status,422)
  assert.equal((await stock()).reserved_qty,4)
  assert.equal((await db.query('SELECT count(*)::int AS n FROM sales')).rows[0]!.n,0)
  const sale = await complete(a.id)
  for (const amount of [-1,0,200001]) assert.equal((await api('POST',`/sales/${sale.id}/payments`,'staff',{ amount })).status,422)
  assert.equal((await ok('GET',`/sales/${sale.id}`,'staff')).balance,200000)
})
test('penjualan langsung tunai dan stok reserved tidak dapat dijual',async () => {
  const a = await order(10); await confirm(a.id)
  const body = { items:[{ product_id:product,quantity:2,empty_returned:1 }],amount_paid:100000 }
  const key = randomUUID()
  const sale = await ok('POST','/sales/direct','staff',body,key)
  assert.equal(sale.retailer_id,null)
  assert.equal(sale.balance,0)
  assert.equal(sale.payment_status,'LUNAS')
  assert.equal((await ok('POST','/sales/direct','staff',body,key)).id,sale.id)
  assert.equal((await stock()).full_qty,10)
  assert.equal((await stock()).empty_qty,16)
  assert.equal((await api('POST','/sales/direct','staff',body)).status,409)
})
test('hak akses karyawan, isolasi pengecer dan laporan agregat admin',async () => {
  const a = await order(); await confirm(a.id); const sale = await complete(a.id)
  for (const path of [`/orders/${a.id}`,`/sales/${sale.id}`,`/receivables/${sale.id}`]) assert.equal((await api('GET',path,'other')).status,404)
  assert.equal((await ok('GET','/my/transactions','other')).items.length,0)
  assert.equal((await api('GET','/my/transactions?retailer_id='+retailer,'other')).status,403)
  for (const path of ['/dashboard','/reports/sales','/reports/stock','/reports/receivables','/audit-logs','/receivables']) assert.equal((await api('GET',path,'staff')).status,403)
  assert.equal((await ok('GET','/receivables?retailer_id='+retailer,'staff')).items.length,1)
  assert.equal((await api('GET','/receivables?q=SAL','staff')).status,403)
  assert.equal((await ok('GET','/receivables?q='+sale.number,'staff')).items.length,1)
  assert.ok(!('balance' in (await ok('GET','/sales','staff')).items[0]))
  assert.equal((await api('PATCH','/products/'+product,'staff',{ price:1 })).status,403)
  assert.equal((await api('POST','/stock-adjustments','staff',{ product_id:product,full_delta:1,empty_delta:0,reason:'Tidak berizin' })).status,403)
  assert.equal((await api('POST','/staff','retailer',{ username:'palsu' })).status,403)
})
test('stok minimum, koreksi berjejak dan tidak boleh kurang dari reservasi',async () => {
  const a = await order(8); await confirm(a.id)
  assert.equal((await stock()).low_stock,true)
  await ok('POST','/stock-adjustments','admin',{ product_id:product,full_delta:1,empty_delta:0,reason:'Selisih fisik terverifikasi' })
  assert.equal((await stock()).low_stock,false)
  assert.equal((await api('POST','/stock-adjustments','admin',{ product_id:product,full_delta:-6,empty_delta:0,reason:'Melebihi alokasi' })).status,409)
  const logs = await ok('GET','/stock-movements?type=ADJUSTMENT','admin')
  assert.equal(logs.items.length,2)
  assert.ok(logs.items.every((x: any) => x.actor_id === admin && x.reason && x.after_full>=0))
})
test('dashboard/laporan penjualan, stok dan piutang sesuai sumber; periode Jakarta dan pagination',async () => {
  const a = await order(); await confirm(a.id); const sale = await complete(a.id,50000)
  const dash = await ok('GET','/dashboard','admin')
  assert.equal(dash.sales_today,'200000')
  assert.equal(dash.cash_received_today,'50000')
  assert.equal(dash.total_receivables,'150000')
  const report = await ok('GET','/reports/receivables','admin')
  assert.deepEqual(report.summary,{ principal:'200000',paid:'50000',balance:'150000' })
  const sales = await ok('GET','/reports/sales?product_id='+product,'admin')
  assert.equal(sales.summary.total_sales,'200000')
  assert.equal(sales.summary.cash_received_in_period,'50000')
  assert.equal((await ok('GET','/reports/stock?product_id='+product,'admin')).summary[0].full_change,'8')
  assert.equal((await ok('GET','/reports/sales?from=2000-01-01&to=2000-01-31','admin')).summary.total_sales,'0')
  assert.equal((await api('GET','/reports/sales?from=2026-03-02&to=2026-03-01','admin')).status,422)
  assert.equal((await ok('GET','/audit-logs?limit=1','admin')).items.length,1)
  // UTC 18:00 is the next day in Jakarta.
  await db.query("UPDATE sales SET created_at='2026-10-01T18:00:00Z' WHERE id=$1",[sale.id])
  assert.equal((await ok('GET','/reports/sales?from=2026-10-02&to=2026-10-02','admin')).summary.total_sales,'200000')
  assert.equal((await ok('GET','/reports/sales?from=2026-10-01&to=2026-10-01','admin')).summary.total_sales,'0')
})
test('akun nonaktif membatalkan sesi lama, reset akses dan ubah password',async () => {
  await ok('PATCH','/retailers/'+retailer,'admin',{ status:'INACTIVE' })
  assert.equal((await api('GET','/auth/me','retailer')).status,401)
  await ok('PATCH','/retailers/'+retailer,'admin',{ status:'ACTIVE' })
  assert.equal((await api('GET','/auth/me','retailer')).status,401)
  await ok('POST','/staff/'+staff+'/reset-password','admin',{ password:'baru-password-123' })
  assert.equal((await api('GET','/auth/me','staff')).status,401)
  await ok('POST','/auth/change-password','other',{ current_password:'password-uji-123',new_password:'ubah-password-123' })
  assert.equal((await api('GET','/auth/me','other')).status,401)
  assert.ok((await ok('POST','/auth/login',undefined,{ identity:'other',password:'ubah-password-123' })).token)
})
test('rekonsiliasi piutang dua pengecer dan filter pembayaran/transaksi',async () => {
  const first = await order(4); await confirm(first.id); const saleA = await complete(first.id,50000)
  const second = await ok('POST','/orders','other',{ items:[{ product_id:product,quantity:2 }] })
  await confirm(second.id); const saleB = await complete(second.id,0)
  await ok('POST',`/sales/${saleB.id}/payments`,'staff',{ amount:25000 })
  const report = await ok('GET','/reports/receivables','admin')
  assert.equal(report.items.length,2)
  assert.deepEqual(report.summary,{ principal:'300000',paid:'75000',balance:'225000' })
  const filtered = await ok('GET','/reports/receivables?retailer_id='+other,'admin')
  assert.deepEqual(filtered.summary,{ principal:'100000',paid:'25000',balance:'75000' })
  assert.equal((await ok('GET','/payments?retailer_id='+retailer,'admin')).items[0].sale_id,saleA.id)
  assert.equal((await ok('GET','/payments','other')).items.length,1)
  assert.equal((await ok('GET','/sales?payment_status=BELUM_DIBAYAR','admin')).items.length,0)
  assert.equal((await ok('GET','/orders?q='+first.number,'admin')).items.length,1)
  assert.equal((await api('POST','/sales/direct','staff',{ items:[{ product_id:product,quantity:1,empty_returned:0 }],amount_paid:50000,ktp:'tidak-disimpan' })).status,422)
})
test('CSRF cookie, JSON rusak, field ekstra, batas login, dan log bebas kredensial',async () => {
  assert.equal((await api('POST','/auth/logout',undefined,{},undefined,{ Cookie:'lpg_session='+token.other,Origin:'http://jahat.example' })).status,403)
  const malformed = await fetch(base+'/api/auth/login',{ method:'POST',headers:{ 'Content-Type':'application/json' },body:'{rusak' })
  assert.equal(malformed.status,400)
  for (let n=0;n<10;n++) await api('POST','/auth/login',undefined,{ identity:'unknown',password:'salah' })
  assert.equal((await api('POST','/auth/login',undefined,{ identity:'unknown',password:'salah' })).status,429)
  const audits = JSON.stringify((await ok('GET','/audit-logs','admin')).items)
  assert.ok(!audits.includes('password_hash') && !audits.includes('password-uji') && !audits.includes(token.admin))
})
test('PostgreSQL multi-koneksi: dua konfirmasi bersaing tidak overselling', { skip:!process.env.TEST_DATABASE_URL },async () => {
  const a = await order(8), b = await order(8)
  const responses = await Promise.all([api('POST',`/orders/${a.id}/confirm`,'staff',{}),api('POST',`/orders/${b.id}/confirm`,'admin',{})])
  assert.deepEqual(responses.map(r => r.status).sort(),[200,409])
  assert.equal((await stock()).reserved_qty,8)
})
test('PostgreSQL multi-koneksi: retry paralel sale/payment dan pembayaran berlebih', { skip:!process.env.TEST_DATABASE_URL },async () => {
  const a = await order(); await confirm(a.id)
  const key = randomUUID(), path = `/orders/${a.id}/complete`
  const body = { payment_type:'BON',amount_paid:0,returns:[{ product_id:product,empty_returned:0 }] }
  const completed = await Promise.all([api('POST',path,'staff',body,key),api('POST',path,'staff',body,key)])
  assert.ok(completed.every(r => r.status===200))
  assert.equal(completed[0]!.body.data.id,completed[1]!.body.data.id)
  const saleId = completed[0]!.body.data.id, payKey = randomUUID(), payPath = `/sales/${saleId}/payments`
  const paid = await Promise.all([api('POST',payPath,'staff',{ amount:50000 },payKey),api('POST',payPath,'staff',{ amount:50000 },payKey)])
  assert.equal(paid[0]!.body.data.payment.id,paid[1]!.body.data.payment.id)
  const over = await Promise.all([api('POST',payPath,'staff',{ amount:100000 }),api('POST',payPath,'admin',{ amount:100000 })])
  assert.deepEqual(over.map(r => r.status).sort(),[200,422])
  assert.equal((await ok('GET','/sales/'+saleId,'admin')).balance,50000)
})
