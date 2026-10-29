import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { Database, Connection } from '../lib/db'
import { audit, fail, hash, id, safeUser, type Actor } from '../lib/core'
import type { z } from 'zod'
import type { account } from '../lib/validation'

const dummyHash = bcrypt.hashSync('dummy-password-for-timing-only', 12)
export async function rateLimit(db: Connection, bucket: string, max: number) {
  const result = await db.query(`INSERT INTO auth_limits (bucket,attempts,reset_at) VALUES ($1,1,now()+interval '15 minutes')
    ON CONFLICT (bucket) DO UPDATE SET attempts=CASE WHEN auth_limits.reset_at<=now() THEN 1 ELSE auth_limits.attempts+1 END,
    reset_at=CASE WHEN auth_limits.reset_at<=now() THEN now()+interval '15 minutes' ELSE auth_limits.reset_at END RETURNING attempts`, [hash(bucket)])
  if (result.rows[0]!.attempts > max) fail(429, 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.')
}
export async function createAccount(db: Database, data: z.infer<typeof account>, role: 'karyawan' | 'pengecer', actor: Actor | null) {
  const passwordHash = await bcrypt.hash(data.password, 12)
  return db.transaction(async tx => {
    const userId = id()
    const result = await tx.query(`INSERT INTO users (id,username,email,password_hash,name,business_name,contact,role,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [userId, data.username, data.email ?? null, passwordHash, data.name, data.business_name ?? null, data.contact, role, actor ? 'ACTIVE' : 'PENDING'])
    const user = safeUser(result.rows[0]!)
    await audit(tx, actor, actor ? 'ACCOUNT_CREATED' : 'RETAILER_REGISTERED', 'user', userId, null, user)
    return user
  })
}
export async function login(db: Database, identity: string, password: string, hours: number) {
  const user = (await db.query('SELECT * FROM users WHERE username=$1 OR email=$1', [identity.toLowerCase()])).rows[0]
  const valid = await bcrypt.compare(password, user?.password_hash ?? dummyHash)
  if (!valid || user?.status !== 'ACTIVE') fail(401, 'Kredensial tidak valid atau akun belum aktif.')
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + hours * 3600000).toISOString()
  await db.transaction(async tx => {
    const current = (await tx.query('SELECT status,password_hash FROM users WHERE id=$1 FOR SHARE', [user.id])).rows[0]!
    if (current.status !== 'ACTIVE' || current.password_hash !== user.password_hash) fail(401, 'Kredensial tidak valid atau akun belum aktif.')
    await tx.query('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)', [hash(token), user.id, expiresAt])
    await audit(tx, user as Actor, 'LOGIN', 'user', user.id)
  })
  return { token, expires_at: expiresAt, user: safeUser(user) }
}
export async function authenticate(db: Database, token: string) {
  const user = (await db.query(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND u.status='ACTIVE'`, [hash(token)])).rows[0]
  if (!user) fail(401, 'Sesi tidak valid. Silakan masuk kembali.')
  return user
}
export async function changePassword(db: Database, actor: Actor, current: string, next: string) {
  const u = (await db.query('SELECT password_hash FROM users WHERE id=$1', [actor.id])).rows[0]!
  if (!await bcrypt.compare(current, u.password_hash)) fail(422, 'Kata sandi saat ini tidak sesuai.')
  const nextHash = await bcrypt.hash(next, 12)
  await db.transaction(async tx => {
    const locked = (await tx.query('SELECT password_hash FROM users WHERE id=$1 FOR UPDATE', [actor.id])).rows[0]!
    if (locked.password_hash !== u.password_hash) fail(409, 'Kata sandi telah berubah. Silakan masuk kembali.')
    await tx.query('UPDATE users SET password_hash=$2,updated_at=now() WHERE id=$1', [actor.id, nextHash])
    await tx.query('DELETE FROM sessions WHERE user_id=$1', [actor.id])
    await audit(tx, actor, 'PASSWORD_CHANGED', 'user', actor.id)
  })
  return { message: 'Kata sandi diubah. Silakan masuk kembali.' }
}
