import pg from 'pg'

// SQL is parameterized throughout. One checked-out connection owns each transaction.
export type Row = Record<string, any>
export interface Connection {
  query<T extends Row = Row>(text: string, values?: any[]): Promise<{ rows: T[] }>
}
export interface Database extends Connection {
  transaction<T>(fn: (tx: Connection) => Promise<T>): Promise<T>
  close(): Promise<void>
}

export function createDatabase(url: string): Database {
  if (!url) throw new Error('DATABASE_URL wajib diisi.')
  const pool = new pg.Pool({ connectionString: url, max: 10, connectionTimeoutMillis: 5000 })
  pool.on('error', () => console.error('Koneksi database terputus.'))
  return {
    query: (text, values) => pool.query(text, values),
    async transaction(fn) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query("SET LOCAL lock_timeout = '10s'")
        const result = await fn(client)
        await client.query('COMMIT')
        return result
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally { client.release() }
    },
    close: () => pool.end(),
  }
}

let database: Database | undefined
export function useDatabase() {
  return database ??= createDatabase(process.env.DATABASE_URL || '')
}
export async function closeDatabase() {
  const current = database
  database = undefined
  await current?.close()
}
