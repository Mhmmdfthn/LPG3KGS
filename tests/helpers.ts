import { readdir, readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { createDatabase, type Database, type Connection } from '../server/lib/db'

export async function testDatabase(): Promise<Database> {
  const directory = new URL('../database/migrations/',import.meta.url)
  const migration = 'CREATE TABLE schema_migrations (name text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now());\n'+
    (await Promise.all((await readdir(directory)).filter(n => n.endsWith('.sql')).sort().map(name => readFile(new URL(name,directory),'utf8')))).join('\n')
  if (process.env.TEST_DATABASE_URL) {
    // An isolated schema avoids touching existing application tables.
    const schema = 'test_'+randomUUID().replaceAll('-','')
    const root = createDatabase(process.env.TEST_DATABASE_URL)
    await root.query(`CREATE SCHEMA ${schema}`)
    const url = new URL(process.env.TEST_DATABASE_URL)
    url.searchParams.set('options','-c search_path='+schema)
    const db = createDatabase(url.toString())
    await db.query(migration)
    return { ...db, close: async () => {
      await db.close()
      await root.query(`DROP SCHEMA ${schema} CASCADE`)
      await root.close()
    } }
  }
  const pg = new PGlite()
  await pg.exec(migration)
  return {
    query: (text,values) => pg.query(text,values),
    transaction: fn => pg.transaction(tx => fn(tx as Connection)),
    close: () => pg.close(),
  }
}
