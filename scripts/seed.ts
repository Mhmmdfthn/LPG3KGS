import bcrypt from 'bcryptjs'
import { createDatabase } from '../server/lib/db'
import { id, audit } from '../server/lib/core'
import { password, username } from '../server/lib/validation'

const adminUsername = username.parse(process.env.SEED_ADMIN_USERNAME || 'admin')
const adminPassword = password.parse(process.env.SEED_ADMIN_PASSWORD)
const passwordHash = await bcrypt.hash(adminPassword,12)
const demoEnabled = (process.env.SEED_DEMO_ACCOUNTS || '').toLowerCase() === 'true'
const demoPassword = password.parse(process.env.SEED_DEMO_PASSWORD || 'password-uji-123')
const demoPasswordHash = demoEnabled ? await bcrypt.hash(demoPassword,12) : null
const demoAccounts = [
  { username: 'demo_admin', name: 'Admin Demo', businessName: null, contact: '000000', role: 'admin' },
  { username: 'siti_karyawan', name: 'Siti Rahmawati', businessName: null, contact: '081200000001', role: 'karyawan' },
  { username: 'warung_sumber', name: 'Ahmad Fauzi', businessName: 'Toko Sumber Rejeki', contact: '081233445566', role: 'pengecer' },
] as const
const db = createDatabase(process.env.DATABASE_URL || '')
try {
  await db.transaction(async tx => {
    await tx.query('SELECT pg_advisory_xact_lock(1473002)')
    const existing = (await tx.query('SELECT id,role FROM users WHERE username=$1',[adminUsername])).rows[0]
    if (existing && existing.role !== 'admin') throw new Error('Username seed sudah digunakan akun lain.')
    const adminId = existing?.id ?? id()
    if (!existing) {
      await tx.query(`INSERT INTO users (id,username,password_hash,name,contact,role,status) VALUES ($1,$2,$3,$4,$5,'admin','ACTIVE')`,[adminId,adminUsername,passwordHash,process.env.SEED_ADMIN_NAME || 'Pemilik Pangkalan','000000'])
      await audit(tx,{ id:adminId,role:'admin' },'ADMIN_SEEDED','user',adminId)
    }
    // Akun demo opsional untuk tombol login cepat (SEED_DEMO_ACCOUNTS=true).
    if (demoEnabled) {
      for (const account of demoAccounts) {
        const exists = (await tx.query('SELECT id FROM users WHERE username=$1',[account.username])).rows[0]
        if (exists) continue
        const userId = id()
        await tx.query(`INSERT INTO users (id,username,password_hash,name,business_name,contact,role,status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE')`,
          [userId, account.username, demoPasswordHash, account.name, account.businessName, account.contact, account.role])
        await audit(tx,{ id:adminId,role:'admin' },'DEMO_ACCOUNT_SEEDED','user',userId)
      }
    }
    // Product prices are deliberately zero until configured by the owner.
    if (!(await tx.query('SELECT id FROM products LIMIT 1')).rows.length) {
      for (const [name,size] of [['LPG 3 kg',3],['Bright Gas 5,5 kg',5.5],['Bright Gas 12 kg',12]] as const) {
        const productId = id()
        await tx.query('INSERT INTO products (id,name,size_kg,price,active) VALUES ($1,$2,$3,0,false)',[productId,name,size])
        await tx.query('INSERT INTO inventory (product_id) VALUES ($1)',[productId])
        await audit(tx,{ id:adminId,role:'admin' },'PRODUCT_SEEDED','product',productId,null,{ name, size_kg:size,price:0,active:false })
      }
    }
  })
  console.log('Seed selesai. Atur harga, aktifkan produk, dan masukkan stok pembukaan melalui koreksi stok admin.')
} finally { await db.close() }
