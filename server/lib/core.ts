import { createHash, randomUUID } from 'node:crypto'
import type { Connection, Row } from './db'

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
export function fail(status: number, message: string): never { throw new ApiError(status, message) }
export type Actor = { id: string; role: 'admin' | 'karyawan' | 'pengecer' }
export const id = () => randomUUID()
export const number = (prefix: string) => `${prefix}-${randomUUID().toUpperCase()}`
export const hash = (value: string) => createHash('sha256').update(value).digest('hex')
export async function one(db: Connection, sql: string, values: any[] = []) {
  const row = (await db.query(sql, values)).rows[0]
  return row ?? fail(404, 'Data tidak ditemukan.')
}
export function allow(actor: Actor, roles: Actor['role'][]) {
  if (!roles.includes(actor.role)) fail(403, 'Anda tidak memiliki izin untuk tindakan ini.')
}
export function own(actor: Actor, retailerId: string | null) {
  if (actor.role === 'pengecer' && actor.id !== retailerId) fail(404, 'Data tidak ditemukan.')
}
export async function audit(db: Connection, actor: Actor | null, action: string, entity: string, entityId: string, before: unknown = null, after: unknown = null) {
  await db.query('INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id,before_data,after_data) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id(), actor?.id ?? null, action, entity, entityId, JSON.stringify(before), JSON.stringify(after)])
}
function canonical(value: any): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']'
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}'
  return JSON.stringify(value)
}
export async function idempotent<T>(db: Connection, actor: Actor, scope: string, key: string, body: unknown, fn: () => Promise<T>): Promise<T> {
  const fingerprint = hash(canonical(body))
  await db.query('INSERT INTO idempotency_keys (actor_id,scope,key,request_hash) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [actor.id, scope, key, fingerprint])
  const existing = await one(db, 'SELECT * FROM idempotency_keys WHERE actor_id=$1 AND scope=$2 AND key=$3 FOR UPDATE', [actor.id, scope, key])
  if (existing.request_hash !== fingerprint) fail(409, 'Idempotency-Key sudah dipakai untuk data berbeda.')
  if (existing.response !== null) return existing.response as T
  const result = await fn()
  await db.query('UPDATE idempotency_keys SET response=$4 WHERE actor_id=$1 AND scope=$2 AND key=$3', [actor.id, scope, key, JSON.stringify(result)])
  return result
}
export function money(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 2147483647) fail(422, 'Total Rupiah melampaui batas transaksi (Rp2.147.483.647).')
  return value
}
export const safeUser = (u: Row) => ({ id: u.id, username: u.username, email: u.email, name: u.name, business_name: u.business_name, contact: u.contact, role: u.role, status: u.status, rejection_reason: u.rejection_reason, created_at: u.created_at })
