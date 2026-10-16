import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { pool } from '../db/pool.js'

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD
const name = process.env.ADMIN_NAME?.trim() || null

try {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Define ADMIN_EMAIL con un correo válido.')
  }
  if (!password || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres y como máximo 72 bytes.')
  }
  if (name && name.length > 120) {
    throw new Error('ADMIN_NAME no puede superar los 120 caracteres.')
  }

  const existing = await pool.query(
    'SELECT 1 FROM usuario WHERE LOWER(email) = LOWER($1)',
    [email],
  )
  if (existing.rowCount) {
    throw new Error('Ya existe una cuenta con ese correo. No se modificó la cuenta existente.')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await pool.query(`
    INSERT INTO usuario (email, password_hash, rol, nombre_mostrar)
    VALUES ($1, $2, 'admin', $3)
  `, [email, passwordHash, name])

  console.log(`Cuenta de administración creada para ${email}.`)
} catch (error) {
  console.error(`No se pudo crear la cuenta de administración: ${error.message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
