import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { pool } from './pool.js'

const migration = await readFile(
  new URL('../../../databases/migrations/001_authentication.sql', import.meta.url),
  'utf8',
)

try {
  await pool.query(migration)
  console.log('Migración de autenticación aplicada correctamente.')
} finally {
  await pool.end()
}
