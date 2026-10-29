import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createDatabase, type Database } from '../server/lib/db'

export async function migrate(db: Database) {
  await db.transaction(async tx => {
    await tx.query('SELECT pg_advisory_xact_lock(1473001)')
    await tx.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now())')
    const directory = new URL('../database/migrations/',import.meta.url)
    for (const name of (await readdir(directory)).filter(n => n.endsWith('.sql')).sort()) {
      if ((await tx.query('SELECT name FROM schema_migrations WHERE name=$1',[name])).rows.length) continue
      await tx.query(await readFile(new URL(name,directory),'utf8'))
      await tx.query('INSERT INTO schema_migrations (name) VALUES ($1)',[name])
      console.log('Migrasi diterapkan:',name)
    }
  })
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = createDatabase(process.env.DATABASE_URL || '')
  try { await migrate(db) } finally { await db.close() }
}
