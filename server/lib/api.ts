import { randomUUID } from 'node:crypto'
import { defineEventHandler, readBody, getHeader, getCookie, setCookie, deleteCookie, getQuery, getRequestURL, getRequestIP, setHeader, setResponseStatus, type H3Event } from 'h3'
import { z } from 'zod'
import type { Database, Row } from './db'
import { ApiError, allow, audit, fail, hash, idempotent, safeUser, type Actor } from './core'
import * as v from './validation'
import * as auth from '../services/auth'
import * as accounts from '../services/accounts'
import * as stock from '../services/inventory'
import * as commerce from '../services/commerce'
import * as queries from '../services/queries'

export interface BackendConfig { appOrigin: string; sessionHours: number; secureCookies: boolean }
type Context = { event: H3Event; actor: Actor; user: Row; token: string; params: Record<string,string>; body: any; filters: v.Filters; key: string }
type Route = { method: string; path: string; roles?: Actor['role'][]; public?: boolean; schema?: z.ZodType; filters?: boolean; idempotent?: boolean; handle: (ctx: Context) => Promise<any> }
const internal: Actor['role'][] = ['admin','karyawan']
const all: Actor['role'][] = ['admin','karyawan','pengecer']

export function createBackend(db: Database, config: BackendConfig) {
  const routes: Route[] = []
  const route = (r: Route) => routes.push(r)
  const snapshot = <T>(fn: (tx: import('./db').Connection) => Promise<T>) => db.transaction(async tx => {
    await tx.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
    return fn(tx)
  })
  // This adapter keeps the transaction connection explicit for every business write.
  const critical = (method: string, path: string, roles: Actor['role'][], schema: z.ZodType, fn: (tx: import('./db').Connection,c: Context) => Promise<any>) => {
    route({ method,path,roles,schema,idempotent:true,handle: c => db.transaction(async tx => {
      const current = (await tx.query("SELECT id FROM users WHERE id=$1 AND status='ACTIVE' FOR SHARE",[c.actor.id])).rows[0]
      if (!current) fail(401,'Akun tidak aktif.')
      return idempotent(tx,c.actor,method+' '+getRequestURL(c.event).pathname,c.key,c.body,() => fn(tx,c))
    }) })
  }
  route({ method:'GET',path:'/health',public:true,handle: async () => {
    await db.query('SELECT 1')
    return { status:'ok',service:'lpg3kgs-backend' }
  } })
  route({ method:'POST',path:'/retailer-registrations',public:true,schema:v.registration,handle: async c => {
    await auth.rateLimit(db,'register:'+getRequestIP(c.event),5)
    const { password_confirmation, ...data } = c.body
    return { user: await auth.createAccount(db,data,'pengecer',null), message:'Pendaftaran diterima. Tunggu persetujuan admin sebelum memesan.' }
  } })
  route({ method:'POST',path:'/auth/login',public:true,schema:z.object({ identity:z.string().trim().min(1).max(254),password:z.string().min(1).max(200) }).strict(),handle: async c => {
    await auth.rateLimit(db,'login-ip:'+getRequestIP(c.event),30)
    await auth.rateLimit(db,'login-identity:'+c.body.identity.toLowerCase(),10)
    const result = await auth.login(db,c.body.identity,c.body.password,config.sessionHours)
    setCookie(c.event,'lpg_session',result.token,{ httpOnly:true,secure:config.secureCookies,sameSite:'strict',path:'/',maxAge:config.sessionHours*3600 })
    return result
  } })
  route({ method:'POST',path:'/auth/logout',roles:all,schema:z.object({}).strict(),handle: async c => {
    await db.transaction(async tx => {
      await tx.query('DELETE FROM sessions WHERE token_hash=$1',[hash(c.token)])
      await audit(tx,c.actor,'LOGOUT','user',c.actor.id)
    })
    deleteCookie(c.event,'lpg_session',{ path:'/' })
    return { message:'Sesi telah diakhiri.' }
  } })
  route({ method:'GET',path:'/auth/me',roles:all,handle:async c => safeUser(c.user) })
  route({ method:'POST',path:'/auth/change-password',roles:all,schema:z.object({ current_password:z.string().max(200),new_password:v.password }).strict(),handle:async c => {
    await auth.rateLimit(db,'password:'+c.actor.id,10)
    const result = await auth.changePassword(db,c.actor,c.body.current_password,c.body.new_password)
    deleteCookie(c.event,'lpg_session',{ path:'/' })
    return result
  } })
  for (const [path,role] of [['retailers','pengecer'],['staff','karyawan']] as const) {
    route({ method:'GET',path:'/'+path,roles:['admin'],filters:true,handle:c => queries.accounts(db,role,c.filters) })
    route({ method:'POST',path:'/'+path,roles:['admin'],schema:v.account,handle:c => auth.createAccount(db,c.body,role,c.actor) })
    route({ method:'PATCH',path:'/'+path+'/:id',roles:['admin'],schema:v.accountPatch,handle:c => accounts.updateAccount(db,c.actor,c.params.id!,role,c.body) })
    route({ method:'POST',path:'/'+path+'/:id/reset-password',roles:['admin'],schema:z.object({ password:v.password }).strict(),handle:c => accounts.resetPassword(db,c.actor,c.params.id!,role,c.body.password) })
  }
  route({ method:'GET',path:'/retailers/pending',roles:['admin'],filters:true,handle:c => queries.accounts(db,'pengecer',c.filters,true) })
  route({ method:'PATCH',path:'/retailers/:id/approval',roles:['admin'],schema:z.object({ approved:z.boolean(),reason:v.reason.optional() }).strict().refine(b => b.approved || !!b.reason,'Alasan penolakan wajib diisi.'),handle:c => accounts.approveAccount(db,c.actor,c.params.id!,c.body.approved,c.body.reason) })
  route({ method:'GET',path:'/products',roles:all,filters:true,handle:c => queries.catalog(db,c.actor,c.filters) })
  route({ method:'POST',path:'/products',roles:['admin'],schema:v.product,handle:c => stock.createProduct(db,c.actor,c.body) })
  route({ method:'PATCH',path:'/products/:id',roles:['admin'],schema:v.productPatch,handle:c => stock.updateProduct(db,c.actor,c.params.id!,c.body) })
  route({ method:'GET',path:'/inventory',roles:internal,filters:true,handle:c => queries.catalog(db,c.actor,c.filters,true) })
  route({ method:'GET',path:'/stock-movements',roles:internal,filters:true,handle:c => queries.movements(db,c.filters) })
  critical('POST','/stock-receipts',internal,v.receipt,(tx,c) => stock.receiveStock(tx,c.actor,c.body))
  critical('POST','/stock-adjustments',['admin'],v.adjustment,(tx,c) => stock.adjustStock(tx,c.actor,c.body))
  critical('POST','/orders',['pengecer'],v.orderBody,(tx,c) => commerce.submitOrder(tx,c.actor,c.body))
  route({ method:'GET',path:'/orders',roles:internal,filters:true,handle:c => queries.orders(db,c.actor,c.filters) })
  route({ method:'GET',path:'/orders/my',roles:['pengecer'],filters:true,handle:c => queries.orders(db,c.actor,c.filters) })
  route({ method:'GET',path:'/orders/:id',roles:all,handle:c => commerce.orderDetail(db,c.actor,c.params.id!) })
  for (const action of ['confirm','reject','cancel'] as const) critical('POST','/orders/:id/'+action,internal,
    action === 'confirm' ? z.object({}).strict() : z.object({ reason:v.reason }).strict(),
    (tx,c) => commerce.transitionOrder(tx,c.actor,c.params.id!,action,c.body.reason))
  critical('POST','/orders/:id/complete',internal,v.settlement,(tx,c) => commerce.completeOrder(tx,c.actor,c.params.id!,c.body))
  critical('POST','/sales/direct',internal,v.directBody,(tx,c) => commerce.directSale(tx,c.actor,c.body))
  route({ method:'GET',path:'/sales',roles:internal,filters:true,handle:c => queries.sales(db,c.actor,c.filters) })
  route({ method:'GET',path:'/sales/:id',roles:all,handle:c => commerce.saleDetail(db,c.actor,c.params.id!) })
  critical('POST','/sales/:id/payments',internal,v.payment,(tx,c) => commerce.paySale(tx,c.actor,c.params.id!,c.body))
  route({ method:'GET',path:'/receivables',roles:internal,filters:true,handle:async c => {
    if (c.actor.role === 'karyawan' && !c.filters.retailer_id && !/^SAL-[A-F0-9-]{36}$/.test(c.filters.q ?? '')) fail(403,'Pilih pengecer atau nomor transaksi lengkap untuk mencari bon operasional.')
    return queries.sales(db,c.actor,c.filters,true)
  } })
  route({ method:'GET',path:'/receivables/:id',roles:all,handle:c => commerce.saleDetail(db,c.actor,c.params.id!) })
  route({ method:'GET',path:'/payments',roles:['admin','pengecer'],filters:true,handle:c => queries.payments(db,c.actor,c.filters) })
  route({ method:'GET',path:'/my/transactions',roles:['pengecer'],filters:true,handle:c => queries.sales(db,c.actor,c.filters) })
  route({ method:'GET',path:'/my/receivables',roles:['pengecer'],filters:true,handle:c => queries.sales(db,c.actor,c.filters,true) })
  route({ method:'GET',path:'/dashboard',roles:['admin'],handle:() => snapshot(tx => queries.dashboard(tx)) })
  route({ method:'GET',path:'/reports/sales',roles:['admin'],filters:true,handle:c => snapshot(tx => queries.salesReport(tx,c.actor,c.filters)) })
  route({ method:'GET',path:'/reports/stock',roles:['admin'],filters:true,handle:c => snapshot(tx => queries.stockReport(tx,c.filters)) })
  route({ method:'GET',path:'/reports/receivables',roles:['admin'],filters:true,handle:c => snapshot(tx => queries.receivablesReport(tx,c.actor,c.filters)) })
  route({ method:'GET',path:'/audit-logs',roles:['admin'],filters:true,handle:c => queries.audits(db,c.filters) })

  return defineEventHandler(async event => {
    const requestId = randomUUID()
    setHeader(event,'X-Request-Id',requestId)
    setHeader(event,'Cache-Control','no-store')
    setHeader(event,'X-Content-Type-Options','nosniff')
    try {
      const path = getRequestURL(event).pathname.replace(/^\/api/, '').replace(/\/$/,'') || '/'
      let matched: Route | undefined
      let params: Record<string,string> = {}
      // Static paths take precedence over dynamic IDs regardless of registration order.
      for (const candidate of [...routes].sort((a,b) => Number(a.path.includes(':'))-Number(b.path.includes(':')))) {
        if (candidate.method !== event.method) continue
        const keys: string[] = []
        const pattern = candidate.path.replace(/:([a-z_]+)/g,(_,key) => { keys.push(key); return '([^/]+)' })
        const match = path.match(new RegExp('^'+pattern+'$'))
        if (match) { matched=candidate; params=Object.fromEntries(keys.map((key,i) => [key,match[i+1]!])); break }
      }
      if (!matched) fail(404,'Endpoint tidak ditemukan.')
      const origin = getHeader(event,'origin')
      if (!['GET','HEAD'].includes(event.method) && origin && origin !== config.appOrigin) fail(403,'Asal permintaan tidak diizinkan.')
      const ctx = { event,params } as Context
      if (!matched.public) {
        const authorization = getHeader(event,'authorization')
        const bearer = authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1]
        const cookie = getCookie(event,'lpg_session')
        ctx.token = bearer ?? cookie ?? ''
        if (authorization && !bearer) fail(401,'Token tidak valid.')
        if (!ctx.token) fail(401,'Silakan masuk terlebih dahulu.')
        if (!bearer && !['GET','HEAD'].includes(event.method) && getHeader(event,'origin') !== config.appOrigin) fail(403,'Asal permintaan tidak diizinkan.')
        ctx.user = await auth.authenticate(db,ctx.token)
        ctx.actor = { id:ctx.user.id,role:ctx.user.role }
        allow(ctx.actor,matched.roles ?? [])
      }
      if (params.id) v.uuid.parse(params.id)
      if (matched.filters) {
        ctx.filters = v.filters.parse(getQuery(event))
        if (ctx.actor.role === 'pengecer' && ctx.filters.retailer_id && ctx.filters.retailer_id !== ctx.actor.id) fail(403,'Anda hanya dapat mengakses data sendiri.')
      }
      if (matched.schema) {
        const length = Number(getHeader(event,'content-length') || '0')
        if (length > 65536) fail(413,'Data permintaan terlalu besar.')
        const type = getHeader(event,'content-type')?.split(';')[0]
        if (type && type !== 'application/json') fail(415,'Gunakan Content-Type application/json.')
        let raw: unknown
        try { raw = await readBody(event) } catch { fail(400,'JSON tidak valid.') }
        if (Buffer.byteLength(JSON.stringify(raw ?? {})) > 65536) fail(413,'Data permintaan terlalu besar.')
        ctx.body = matched.schema.parse(raw ?? {})
      }
      if (matched.idempotent) {
        const key = getHeader(event,'idempotency-key')
        if (!key || !/^[A-Za-z0-9_.:-]{8,128}$/.test(key)) fail(422,'Idempotency-Key wajib diisi (8–128 karakter). Gunakan kembali kunci yang sama saat mengulang permintaan.')
        ctx.key = key
      }
      const data = await matched.handle(ctx)
      return { data, request_id:requestId }
    } catch (error: any) {
      let status = 500, message = 'Terjadi kesalahan server. Gunakan nomor referensi untuk penelusuran.'
      if (error instanceof ApiError) { status=error.status; message=error.message }
      else if (error instanceof z.ZodError) { status=422; message='Data tidak valid. Periksa isian dan field yang diizinkan.' }
      else if (error.code === '23505') { status=409; message='Data unik sudah terdaftar atau transaksi sudah diproses.' }
      else if (['23514','22003','23503'].includes(error.code)) { status=409; message='Data bertentangan dengan saldo atau referensi yang tersimpan.' }
      else if (['40P01','40001','55P03'].includes(error.code)) { status=409; message='Data sedang berubah. Ulangi permintaan dengan Idempotency-Key yang sama.' }
      if (status === 500) console.error(JSON.stringify({ request_id:requestId, code:'INTERNAL_ERROR' }))
      setResponseStatus(event,status)
      if (status === 429) setHeader(event,'Retry-After',900)
      return { error: { code:status,message }, request_id:requestId }
    }
  })
}
