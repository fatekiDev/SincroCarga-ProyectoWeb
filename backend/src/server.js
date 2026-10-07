import express from 'express'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(express.json())

app.get('/', (_req, res) => {
  res.json({ message: 'API de SincroCarga' })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, 'localhost', () => {
  console.log(`API escuchando en http://localhost:${port}`)
})
