import pg from 'pg'

const { Pool } = pg

const databaseUrl = process.env.DATABASE_URL?.trim()
let poolConfig

if (databaseUrl) {
  poolConfig = {
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  }
} else {
  function requiredEnv(name) {
    const value = process.env[name]

    if (!value?.trim()) {
      throw new Error(`Missing required environment variable: ${name}`)
    }

    return value
  }

  const port = Number(process.env.PGPORT ?? 5432)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PGPORT must be an integer between 1 and 65535')
  }

  poolConfig = {
    host: requiredEnv('PGHOST'),
    port,
    database: requiredEnv('PGDATABASE'),
    user: requiredEnv('PGUSER'),
    password: requiredEnv('PGPASSWORD'),
    connectionTimeoutMillis: 5000,
  }
}

export const pool = new Pool(poolConfig)
