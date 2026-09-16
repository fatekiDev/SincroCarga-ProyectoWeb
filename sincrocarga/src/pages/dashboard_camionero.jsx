import { Link } from "react-router-dom";
import "../styles/dashboard_camionero.css";

// Datos de ejemplo — más adelante vendrán de tu API/backend
const stats = {
  saldo: 245800,
  matchesNuevos: 5,
  rating: 4.9,
  resenas: 120,
};

const testimonios = [
  { nombre: "Carlos M.", texto: "Excelente chofer, muy puntual." },
  { nombre: "Ana P.", texto: "Carga impecable, muy recomendado." },
];

function Dashboard() {
  return (
    <div className="dashboard">
      {/* HEADER */}
      <header className="header">
        <div className="header-logo">
          {/* <img src="/logo.png" alt="SincroCarga" className="logo-img" /> */}
          <div className="logo-img" />
          <div className="logo-text">
            <div className="logo-name">SincroCarga</div>
            <div className="logo-tagline">MATCHING OPERATIVO</div>
          </div>
        </div>

        <nav className="nav-desktop">
          <Link to="/publicar">Publicar</Link>
          <Link to="/matching">Matching</Link>
          <Link to="/pagos">Pagos seguros</Link>
        </nav>

        <button className="hamburger">☰</button>

        <div className="profile">
          {/* <img src="/avatar.jpg" alt="José P." className="profile-avatar" /> */}
          <div className="profile-avatar" />
          <div className="profile-name">
            José P. - <Link to="/perfil">Mi Perfil</Link>
          </div>
        </div>
      </header>

      {/* BIENVENIDA */}
      <section>
        <h1 className="welcome-title">¡Bienvenido de vuelta, José!</h1>
        <p className="welcome-subtitle">
          Tu panel de control para optimizar tus rutas y ganar más.
        </p>
      </section>

      {/* STATS */}
      <section className="stats-row">
        <div className="stat-card">
          <div className="stat-card-title">💰 Saldo Actual</div>
          <div className="stat-card-value">
            ${stats.saldo.toLocaleString("es-CL")} <span className="unit">CLP</span>
          </div>
          <button className="btn-primary">Retirar Fondos</button>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">📦 Matching de Encargos</div>
          <div className="stat-card-value">
            {stats.matchesNuevos} <span className="unit">(nuevas)</span>
          </div>
          <button className="btn-primary" onClick={() => {}}>Ver Solicitudes</button>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">⭐ Calificación</div>
          <div className="stat-card-value">
            <span className="star">★★★★★</span> {stats.rating}{" "}
            <span className="unit">({stats.resenas} reseñas)</span>
          </div>
          <button className="btn-primary">Ver Feedback</button>
        </div>
      </section>

      {/* PROGRESO + TESTIMONIOS */}
      <section className="mid-row">
        <div className="progress-card">
          <div className="progress-card-title">🥇 ¡Casi listo para tu bono de fletes!</div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: "80%" }} />
          </div>
          <div className="progress-card-count">8/10</div>
          <div className="progress-card-text">
            Completa 10 fletes este mes para calificar y ganar $50.000 CLP extra. ¡Solo 2 más!
          </div>
        </div>

        <div className="testimonial-card">
          <div className="testimonial-title">Lo que dicen tus clientes</div>
          <div className="testimonial-items">
            {testimonios.map((t) => (
              <div className="testimonial-item" key={t.nombre}>
                <strong>{t.nombre}:</strong> {t.texto}
                <span className="stars">★★★★★</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner">
        <div className="cta-text-group">
          <div className="cta-tag">✓ Todo listo para operar</div>
          <div className="cta-title">
            Optimiza tus fletes vacíos en Chiloé con SincroCarga.
          </div>
        </div>
        <button className="btn-cta-final">Revisar Matches de Hoy</button>
      </section>
    </div>
  );
}

export default Dashboard;