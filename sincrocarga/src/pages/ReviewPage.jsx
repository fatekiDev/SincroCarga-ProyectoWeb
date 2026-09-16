import { useState } from 'react';
import { Check, Star, BadgeCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Card from '../components/Card';
import '../styles/ReviewPage.css';

const MOCK_USER = { initials: 'FM', name: 'Francisco M.', roleLabel: 'Cliente · Ancud' };

const MOCK_DRIVER = {
  initials: 'RS',
  name: 'Raúl Soto',
  verified: true,
  rating: 4.9,
  reviewCount: 86,
  vehicle: 'Camión Sinotruk · Patente HXPL-32',
  completedDeliveries: 92,
};

const MOCK_CARGO = {
  title: 'Muebles de living',
  route: 'Ancud — Puerto Montt',
};

const MAX_REVIEW_LENGTH = 200;

export default function ReviewPage() {
  const [receptionConfirmed, setReceptionConfirmed] = useState(false);
  const [rating, setRating] = useState(4);
  const [hoverRating, setHoverRating] = useState(null);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const displayedRating = hoverRating ?? rating;

  return (
    <div className="page">
      <Navbar activeSection="matching" user={MOCK_USER} />

      <main className="page__main">
        <span className="success-badge">
          <Check size={18} strokeWidth={3} />
        </span>

        <h1 className="page__title review-title">
          Carga entregada con éxito — <span className="text-primary">Confirma y evalúa</span>
        </h1>
        <p className="page__subtitle">
          Antes de liberar el pago, confirma que recibiste tu carga en buen estado y cuéntanos
          cómo fue tu experiencia con el transportista.
        </p>

        <div className="review-grid">
          <div className="review-column">
            <Card>
              <div className="step-heading">
                <span className="step-heading__number step-heading__number--success">1</span>
                <h2 className="section-title">Confirma tu recepción</h2>
              </div>

              <Button
                variant="success"
                fullWidth
                className="step-heading__action"
                onClick={() => setReceptionConfirmed(true)}
                disabled={receptionConfirmed}
              >
                {receptionConfirmed ? 'Carga recibida — confirmada ✓' : 'Carga recibida — confirmada'}
              </Button>

              <p className="helper-text">
                Al confirmar, autorizas la liberación del pago retenido al transportista. Si
                algo no llegó en buen estado, contáctanos antes de confirmar.
              </p>

              <div className="divider divider--dashed" />

              <p className="cargo-summary">
                <strong>Tipo:</strong> {MOCK_CARGO.title} &nbsp;&nbsp;
                <strong>Ruta:</strong> {MOCK_CARGO.route}
              </p>
            </Card>

            <Card>
              <div className="step-heading">
                <span className="step-heading__number step-heading__number--primary">2</span>
                <h2 className="section-title">Evalúa tu experiencia</h2>
              </div>

              <div className="rating-block">
                <p className="field-title">Puntuación</p>
                <p className="field-hint">
                  ¿Cómo calificarías el servicio de {MOCK_DRIVER.name.split(' ')[0]}?
                </p>
                <div className="star-picker">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const value = i + 1;
                    return (
                      <button
                        key={value}
                        type="button"
                        onMouseEnter={() => setHoverRating(value)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(value)}
                        className="star-picker__btn"
                        aria-label={`${value} estrellas`}
                      >
                        <Star size={24} className={value <= displayedRating ? 'star star--filled star--lg' : 'star star--lg'} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="review-block">
                <p className="field-title">Reseña</p>
                <p className="field-hint">
                  Cuéntale a otros clientes cómo fue el trato y el estado de la entrega (máx. 200
                  caracteres).
                </p>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value.slice(0, MAX_REVIEW_LENGTH))}
                  placeholder="Ej: Muy buena comunicación durante el viaje, llegó puntual y la carga en perfecto estado."
                  rows={4}
                  className="textarea-field"
                />
                <p className="char-count">
                  {review.length} / {MAX_REVIEW_LENGTH}
                </p>
              </div>

              <Button
                fullWidth
                className="submit-review-btn"
                onClick={() => setSubmitted(true)}
                disabled={submitted}
              >
                {submitted ? 'Reseña enviada ✓' : 'Enviar reseña y puntuación'}
              </Button>
            </Card>
          </div>

          <Card className="driver-card">
            <p className="field-title">Tu camionero</p>
            <div className="driver-profile">
              <span className="driver-profile__avatar">{MOCK_DRIVER.initials}</span>
              <p className="driver-profile__name">{MOCK_DRIVER.name}</p>
              {MOCK_DRIVER.verified && (
                <span className="verified-badge">
                  <BadgeCheck size={12} /> Verificado
                </span>
              )}
              <div className="rating-row rating-row--center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} className={i < Math.round(MOCK_DRIVER.rating) ? 'star star--filled' : 'star'} />
                ))}
                <span className="rating-row__text">
                  {MOCK_DRIVER.rating} ({MOCK_DRIVER.reviewCount})
                </span>
              </div>
              <p className="driver-profile__meta">{MOCK_DRIVER.vehicle}</p>
              <p className="driver-profile__meta">
                {MOCK_DRIVER.completedDeliveries} entregas completadas en Chiloé
              </p>
            </div>
          </Card>
        </div>

        <div className="status-banner">
          <div>
            <p className="status-banner__title">Tu reseña ayuda a mejorar la plataforma.</p>
            <p className="status-banner__meta">
              Las evaluaciones son visibles para futuros clientes y transportistas.
            </p>
          </div>
          <Button variant="dark">Revisar matches</Button>
        </div>
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />
    </div>
  );
}
