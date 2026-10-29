import bcrypt from 'bcryptjs'
import type { Database } from '../lib/db'
import { audit, fail, one, safeUser, type Actor } from '../lib/core'

export async function updateAccount(db: Database, actor: Actor, userId: string, role: string, patch: Record<string, any>) {
  return db.transaction(async tx => {
    const before = await one(tx, 'SELECT * FROM users WHERE id=$1 AND role=$2 FOR UPDATE', [userId, role])
    if (before.status === 'PENDING' || before.status === 'REJECTED') fail(409, 'Gunakan alur persetujuan untuk akun pendaftaran.')
    const values: any[] = [userId]
    const assignments = Object.entries(patch).map(([key, value]) => { values.push(value); return `${key}=$${values.length}` })
    const updated = await one(tx, `UPDATE users SET ${assignments.join(',')},updated_at=now() WHERE id=$1 RETURNING *`, values)
    if (patch.status === 'INACTIVE') await tx.query('DELETE FROM sessions WHERE user_id=$1', [userId])
    await audit(tx, actor, 'ACCOUNT_UPDATED', 'user', userId, safeUser(before), safeUser(updated))
    return safeUser(updated)
  })
}
export async function approveAccount(db: Database, actor: Actor, userId: string, approved: boolean, reason?: string) {
  return db.transaction(async tx => {
    const before = await one(tx, "SELECT * FROM users WHERE id=$1 AND role='pengecer' FOR UPDATE", [userId])
    if (before.status !== 'PENDING') fail(409, 'Pendaftaran sudah diproses.')
    const result = await one(tx, 'UPDATE users SET status=$2,rejection_reason=$3,updated_at=now() WHERE id=$1 RETURNING *', [userId, approved ? 'ACTIVE' : 'REJECTED', approved ? null : reason])
    await audit(tx, actor, approved ? 'REGISTRATION_APPROVED' : 'REGISTRATION_REJECTED', 'user', userId, safeUser(before), safeUser(result))
    return safeUser(result)
  })
}
export async function resetPassword(db: Database, actor: Actor, userId: string, role: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12)
  return db.transaction(async tx => {
    await one(tx, 'SELECT id FROM users WHERE id=$1 AND role=$2 FOR UPDATE', [userId, role])
    await tx.query('UPDATE users SET password_hash=$2,updated_at=now() WHERE id=$1', [userId, passwordHash])
    await tx.query('DELETE FROM sessions WHERE user_id=$1', [userId])
    await audit(tx, actor, 'PASSWORD_RESET', 'user', userId)
    return { message: 'Akses diperbarui. Semua sesi akun telah diakhiri.' }
  })
}
