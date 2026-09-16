import { Truck, ShieldCheck, Star, MapPin, Flag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Card from '../components/Card';
import '../styles/TrackingPage.css';

const MOCK_USER = { initials: 'FM', name: 'Francisco M.', roleLabel: 'Cliente · Ancud' };

const MOCK_DRIVER = {
  initials: 'RS',
  name: 'Raúl Soto',
  rating: 4.9,
  reviewCount: 86,
  vehicle: 'Camión Sinotruk · Patente HXPL-32',
};

const TIMELINE = [
  { id: '1', label: 'Pedido confirmado', status: 'done', timestamp: 'Lun 14 · 09:12' },
  { id: '2', label: 'Pago recibido', status: 'done', timestamp: 'Lun 14 · 09:15' },
  { id: '3', label: 'Carga recogida', status: 'active', helperText: 'En progreso' },
  { id: '4', label: 'En ruta', status: 'pending', helperText: 'Pendiente' },
  { id: '5', label: 'Entregado', status: 'pending', helperText: 'Pendiente' },
];

const PROGRESS_PERCENT = 64;
const ETA = '18:40';

export default function TrackingPage() {
  return (
    <div className="page">
      <Navbar activeSection="matching" user={MOCK_USER} />

      <main className="page__main">
        <div className="tracking-header">
          <div>
            <p className="eyebrow">Rastreo en tiempo real</p>
            <h1 className="page__title">Tu carga — Juego de muebles de living</h1>
          </div>
          <span className="status-pill">
            <span className="status-pill__dot" />
            Seguimiento activo
          </span>
        </div>

        <div className="tracking-grid">
          <Card>
            <h2 className="section-title">Línea de tiempo del estado</h2>
            <ol className="timeline">
              {TIMELINE.map((step, idx) => (
                <li key={step.id} className="timeline__item">
                  {idx < TIMELINE.length - 1 && (
                    <span className={`timeline__line ${step.status === 'done' ? 'timeline__line--done' : ''}`} />
                  )}
                  <span className={`timeline__dot timeline__dot--${step.status}`} />
                  <div>
                    <p className={step.status === 'pending' ? 'timeline__label' : 'timeline__label timeline__label--strong'}>
                      {step.label}
                    </p>
                    {step.timestamp && <p className="timeline__meta">{step.timestamp}</p>}
                    {step.helperText && (
                      <p className={step.status === 'active' ? 'timeline__meta timeline__meta--active' : 'timeline__meta'}>
                        {step.helperText}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="map-card">
            <h2 className="section-title">Mapa de seguimiento</h2>
            <div className="map-canvas">
              <span className="map-canvas__updated">Actualizado hace 1 min</span>

              <svg viewBox="0 0 400 240" className="map-canvas__svg" aria-hidden="true">
                <line x1="60" y1="190" x2="330" y2="55" stroke="var(--sc-primary)" strokeWidth="2.5" />
              </svg>

              <div className="map-marker map-marker--origin">
                <MapPin size={18} />
                <span className="map-marker__label">Origen</span>
              </div>
              <div className="map-marker map-marker--destination">
                <Flag size={18} />
                <span className="map-marker__label">Destino</span>
              </div>
              <div
                className="map-marker map-marker--truck"
                style={{ left: `${25 + (PROGRESS_PERCENT / 100) * 55}%`, top: '46%' }}
              >
                <span className="map-marker__truck-icon">
                  <Truck size={14} />
                </span>
                <span className="map-marker__label map-marker__label--dark">Camión</span>
              </div>
            </div>

            <div className="map-progress">
              <div className="map-progress__top">
                <span className="map-progress__percent">{PROGRESS_PERCENT}% completado</span>
                <span className="map-progress__eta">
                  Llegada estimada · <strong>{ETA}</strong>
                </span>
              </div>
              <div className="map-progress__track">
                <div className="map-progress__fill" style={{ width: `${PROGRESS_PERCENT}%` }} />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="section-title">Info de carga y camionero</h2>

            <div className="cargo-confirmed">
              <span className="cargo-confirmed__check">✓</span>
              <div>
                <p className="cargo-confirmed__title">Carga confirmada</p>
                <p className="cargo-confirmed__meta">850 kg · 120×100×90 cm</p>
              </div>
            </div>

            <div className="divider" />

            <div className="driver-row">
              <span className="driver-avatar">{MOCK_DRIVER.initials}</span>
              <div>
                <p className="driver-name">{MOCK_DRIVER.name}</p>
                <p className="driver-vehicle">{MOCK_DRIVER.vehicle}</p>
              </div>
            </div>

            <div className="rating-row">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < Math.round(MOCK_DRIVER.rating) ? 'star star--filled' : 'star'}
                />
              ))}
              <span className="rating-row__text">
                {MOCK_DRIVER.rating} ({MOCK_DRIVER.reviewCount})
              </span>
            </div>

            <Button variant="secondary" fullWidth className="profile-btn">
              Ver perfil
            </Button>

            <div className="guarantee-box">
              <ShieldCheck size={16} />
              <p>
                <strong>Garantía Sincro:</strong> tu pago queda retenido hasta confirmar la
                entrega. Si algo falla, te devolvemos el 100%.
              </p>
            </div>
          </Card>
        </div>

        <div className="status-banner">
          <div className="status-banner__left">
            <span className="status-banner__dot" />
            <div>
              <p className="status-banner__title">En ruta — seguimiento activo</p>
              <p className="status-banner__meta">
                Raúl recogió tu carga hace 42 min · próxima actualización automática
              </p>
            </div>
          </div>
          <Button variant="dark">Revisar matches</Button>
        </div>
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />
    </div>
  );
}
