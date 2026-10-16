import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { pool } from './pool.js'

const migrations = [
  new URL('../../../databases/migrations/001_authentication.sql', import.meta.url),
  new URL('../../../databases/migrations/002_unique_trip_rating.sql', import.meta.url),
  new URL('../../../databases/migrations/003_simulated_payments.sql', import.meta.url),
  new URL('../../../databases/migrations/004_admin_verification.sql', import.meta.url),
]

try {
  for (const migrationUrl of migrations) {
    const migration = await readFile(migrationUrl, 'utf8')
    await pool.query(migration)
    console.log(`Migración ${migrationUrl.pathname.split('/').at(-1)} aplicada correctamente.`)
  }
} finally {
  await pool.end()
}
