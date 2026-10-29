import bcrypt from 'bcryptjs'
import { createDatabase } from '../server/lib/db'
import { id, audit } from '../server/lib/core'
import { password, username } from '../server/lib/validation'

const adminUsername = username.parse(process.env.SEED_ADMIN_USERNAME || 'admin')
const adminPassword = password.parse(process.env.SEED_ADMIN_PASSWORD)
const passwordHash = await bcrypt.hash(adminPassword,12)
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
