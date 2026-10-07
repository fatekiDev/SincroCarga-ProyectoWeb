import './statcard.css'

/**
 * Tarjeta pequeña para métricas (ej: "18 coincidencias activas").
 * value: NO debe ser un dato inventado — usar '—' mientras no exista
 * la cifra real conectada al backend.
 */
function StatCard({ value, label }) {
  return (
    <article className="stat-card">
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__label">{label}</p>
    </article>
  )
}

export default StatCard
