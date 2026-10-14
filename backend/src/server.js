import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import { pool } from './db/pool.js'
import authRouter from './routes/auth.routes.js'
import publicacionesRouter from './routes/publicaciones.routes.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(express.json({ limit: '32kb' }))
app.use(cookieParser())

app.get('/', (_req, res) => {
  res.json({ message: 'API de SincroCarga' })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/health/db', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.status(200).json({ status: 'ok', database: 'connected' })
  } catch (error) {
    console.error('Error al comprobar la conexión con PostgreSQL:', error)
    res.status(503).json({ status: 'error', database: 'unavailable' })
  }
})

app.use('/api/publicaciones', publicacionesRouter)
app.use('/api/auth', authRouter)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' })
})

app.use((error, _req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud debe ser JSON válido' })
  }

  const clientErrors = {
    '23505': [409, 'El correo o identificador ya está registrado'],
    '22001': [400, 'Uno de los campos excede la longitud permitida'],
    '22003': [400, 'Uno de los valores numéricos está fuera de rango'],
    '22007': [400, 'Una de las fechas no es válida'],
    '23502': [400, 'Falta un campo obligatorio'],
    '23503': [404, 'No se encontró uno de los recursos relacionados'],
    '23514': [400, 'Los datos no cumplen las restricciones de la base de datos'],
    '22P02': [400, 'Uno de los valores tiene un formato no válido'],
  }

  if (clientErrors[error.code]) {
    const [status, message] = clientErrors[error.code]
    return res.status(status).json({ error: message })
  }

  console.error('Error no controlado en la API:', error)

  if (res.headersSent) {
    return next(error)
  }

  res.status(500).json({ error: 'Error interno del servidor' })
})

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`)
})
