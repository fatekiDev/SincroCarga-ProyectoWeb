import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, Download, Star, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/button';
import Card from '../components/Card';
import { confirmJourneyReceipt, getJourneyReview, reportTrackingIncident, submitJourneyRating } from '../seguimiento/api';
import '../styles/ReviewPage.css';

const MAX_REVIEW_LENGTH = 200;
const REVIEW_TAGS = ['Puntual', 'Buen trato', 'Carga en buen estado'];
const CURRENCY_FORMAT = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

function getInitials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0].toLocaleUpperCase('es-CL')).join('');
}

function formatDate(value) {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(date);
}

export default function ReviewPage({ session, onLogout }) {
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [retryToken, setRetryToken] = useState(0);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [receiptStatus, setReceiptStatus] = useState('idle');
  const [receiptError, setReceiptError] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentStatus, setIncidentStatus] = useState('idle');
  const [incidentError, setIncidentError] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [ratingStatus, setRatingStatus] = useState('idle');
  const [ratingError, setRatingError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadStatus, setDownloadStatus] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getJourneyReview({ signal: controller.signal })
      .then((data) => {
        setReviewData(data);
        setLoadState(data ? 'ready' : 'empty');
        setLoadError('');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setLoadError(error.message);
        setLoadState('error');
      });
    return () => controller.abort();
  }, [retryToken]);

  const journey = reviewData?.viaje;
  const driver = reviewData?.conductor;
  const existingRating = reviewData?.calificacion;
  const receiptConfirmed = journey?.estado === 'Completado';
  const paymentHeld = journey?.pago?.estado === 'Retenido';
  const receiptAmount = journey?.pago?.totalCliente ?? journey?.tarifaFinal ?? 0;
  const displayedRating = existingRating?.puntaje ?? hoverRating ?? rating;
  const vehicleDetails = [driver?.marca, driver?.modelo, driver?.patente].filter(Boolean).join(' · ');

  const handleConfirmReceipt = async () => {
    setReceiptStatus('saving');
    setReceiptError('');
    try {
      const result = await confirmJourneyReceipt(journey.id);
      setReviewData(result);
      setShowReceiptDialog(false);
      setReceiptStatus('success');
    } catch (error) {
      setReceiptError(error.message);
      setReceiptStatus('error');
    }
  };

  const handleReportIncident = async (event) => {
    event.preventDefault();
    if (!incidentDescription.trim()) return;
    setIncidentStatus('saving');
    setIncidentError('');
    try {
      await reportTrackingIncident(journey.id, incidentDescription.trim());
      setReviewData((current) => current && ({
        ...current,
        viaje: { ...current.viaje, tieneIncidencia: true },
      }));
      setIncidentDescription('');
      setIncidentStatus('success');
    } catch (error) {
      setIncidentError(error.message);
      setIncidentStatus('error');
    }
  };

  const handleSubmitRating = async (event) => {
    event.preventDefault();
    if (!receiptConfirmed || rating < 1 || existingRating) return;
    setRatingStatus('saving');
    setRatingError('');
    try {
      const result = await submitJourneyRating(journey.id, {
        puntaje: rating,
        comentario: reviewText.trim(),
        etiquetas: selectedTags,
      });
      setReviewData((current) => ({ ...current, calificacion: result.calificacion }));
      setRatingStatus('success');
    } catch (error) {
      setRatingError(error.message);
      setRatingStatus('error');
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((current) => current.includes(tag)
      ? current.filter((selectedTag) => selectedTag !== tag)
      : [...current, tag]);
  };

  const downloadReceipt = async () => {
    setDownloadError('');
    setDownloadStatus('');
    try {
      const { jsPDF } = await import('jspdf');
      const document = new jsPDF();
      const margin = 22;
      document.setFont('helvetica', 'bold');
      document.setFontSize(20);
      document.text('SincroCarga', margin, 25);
      document.setFont('helvetica', 'normal');
      document.setFontSize(15);
      document.text('Comprobante de recepción', margin, 42);
      document.setDrawColor(226, 232, 240);
      document.line(margin, 49, 188, 49);
      document.setFontSize(11);
      const details = [
        ['Viaje', `#${journey.id}`],
        ['Fecha de cierre', formatDate(journey.fechaFin)],
        ['Carga', journey.carga],
        ['Ruta', `${journey.ruta.origen} a ${journey.ruta.destino}`],
        ['Conductor', driver.nombre],
        ['Vehículo', vehicleDetails || driver.transportista],
        ['Tarifa acordada', CURRENCY_FORMAT.format(Number(journey.pago?.tarifaBase ?? journey.tarifaFinal))],
        ...(journey.pago ? [
          ['Comisión SincroCarga', CURRENCY_FORMAT.format(journey.pago.comision)],
          ['IVA de la comisión', CURRENCY_FORMAT.format(journey.pago.iva)],
          ['Total del pago simulado', CURRENCY_FORMAT.format(journey.pago.totalCliente)],
          ['Estado del pago', journey.pago.estado],
        ] : []),
        ['Recepción', 'Confirmada por el cliente'],
      ];
      details.forEach(([label, value], index) => {
        const y = 64 + index * 13;
        document.setFont('helvetica', 'bold');
        document.text(label, margin, y);
        document.setFont('helvetica', 'normal');
        document.text(String(value), 76, y, { maxWidth: 110 });
      });
      document.setFontSize(9);
      document.setTextColor(100, 116, 139);
      document.text('Constancia del cierre registrado en SincroCarga. No acredita una transferencia bancaria.', margin, 180, { maxWidth: 165 });
      document.save(`sincrocarga-comprobante-viaje-${journey.id}.pdf`);
      setDownloadStatus('Comprobante PDF preparado.');
    } catch (error) {
      setDownloadError(error.message || 'No se pudo generar el comprobante.');
    }
  };

  const repeatShipment = () => {
    navigate('/publicar', {
      state: {
        repeatPublication: {
          descripcion: journey.carga,
          tipoCargaId: journey.tipoCargaId,
          pesoKg: journey.pesoKg,
          volumenM3: journey.volumenM3,
          valorDeclarado: journey.valorDeclarado,
          rutaId: journey.ruta.id,
        },
      },
    });
  };

  return (
    <div className="page">
      <Navbar activeSection="matching" session={session} onLogout={onLogout} />

      <main className="page__main">
        {loadState === 'loading' && <p className="publish-loading" role="status">Cargando cierre del viaje…</p>}
        {loadState === 'error' && (
          <Card className="review-empty" role="alert">
            <AlertTriangle size={22} />
            <h1>No pudimos cargar el cierre del viaje</h1>
            <p>{loadError}</p>
            <Button onClick={() => setRetryToken((token) => token + 1)}>Reintentar</Button>
          </Card>
        )}
        {loadState === 'empty' && (
          <Card className="review-empty">
            <h1>No hay un viaje para revisar</h1>
            <p>Cuando completes un viaje, podrás confirmar la recepción y dejar tu evaluación aquí.</p>
            <Button variant="secondary" onClick={() => navigate('/matching')}>Volver al seguimiento</Button>
          </Card>
        )}

        {journey && driver && (
          <>
            <span className={`success-badge ${receiptConfirmed ? '' : 'success-badge--pending'}`}>
              {receiptConfirmed ? <Check size={18} strokeWidth={3} /> : <AlertTriangle size={18} />}
            </span>
            <h1 className="page__title review-title">
              {receiptConfirmed ? 'Recepción registrada' : 'Confirma la recepción de tu carga'}
            </h1>
            <p className="page__subtitle">
              {journey.carga} · {journey.ruta.origen} → {journey.ruta.destino}
            </p>

            {receiptConfirmed && (
              <p className="review-alert review-alert--success" role="status">
                Recepción registrada. La transferencia real requiere una pasarela de pago, que aún no está conectada.
              </p>
            )}

            <div className="review-grid">
              <div className="review-column">
                <Card>
                  <div className="step-heading">
                    <span className="step-heading__number step-heading__number--success">1</span>
                    <h2 className="section-title">Confirma tu recepción</h2>
                  </div>
                  <p className="review-confirm-copy">
                    {receiptConfirmed
                      ? `Recepción confirmada el ${formatDate(journey.fechaFin)}.`
                      : 'Confirma solo si recibiste la carga en buen estado.'}
                  </p>
                  {receiptConfirmed ? (
                    <p className="review-confirmed-state"><Check size={16} /> Recepción confirmada</p>
                  ) : journey.tieneIncidencia ? (
                    <p className="review-alert review-alert--error" role="status">
                      Hay un problema reportado. La confirmación y autorización de liberación están bloqueadas hasta resolverlo con soporte.
                    </p>
                  ) : !paymentHeld ? (
                    <p className="review-lock-note" role="status">
                      {journey.pago?.estado === 'Procesando'
                        ? 'El pago simulado aún se está procesando. Espera a que figure como retenido.'
                        : <>Antes de confirmar, <Link to="/pagos">inicia el pago seguro</Link> y espera a que quede retenido.</>}
                    </p>
                  ) : (
                    <>
                      <Button
                        variant="success"
                        fullWidth
                        className="step-heading__action"
                        onClick={() => setShowReceiptDialog(true)}
                      >
                        Confirmar recepción
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        className="review-report-link"
                        onClick={() => setShowIncidentDialog(true)}
                      >
                        No llegó bien / reportar problema
                      </Button>
                    </>
                  )}
                  {receiptError && <p className="review-alert review-alert--error" role="alert">{receiptError}</p>}
                  <div className="divider divider--dashed" />
                  <p className="cargo-summary">
                    <strong>Tarifa acordada:</strong> {CURRENCY_FORMAT.format(Number(journey.pago?.tarifaBase ?? journey.tarifaFinal))}
                  </p>
                  {journey.pago && (
                    <p className="cargo-summary review-payment-total">
                      <strong>Total con comisión e IVA:</strong> {CURRENCY_FORMAT.format(journey.pago.totalCliente)}
                    </p>
                  )}
                </Card>

                <Card className={`review-rating-card ${!receiptConfirmed ? 'review-rating-card--locked' : ''}`}>
                  <div className="step-heading">
                    <span className="step-heading__number step-heading__number--primary">2</span>
                    <h2 className="section-title">Evalúa tu experiencia</h2>
                  </div>

                  {!receiptConfirmed && (
                    <p className="review-lock-note">Confirma primero la recepción para habilitar la evaluación.</p>
                  )}

                  {existingRating ? (
                    <div className="review-saved-rating" role="status">
                      <div className="star-picker star-picker--saved" aria-label={`${existingRating.puntaje} de 5 estrellas`}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} size={22} className={index < existingRating.puntaje ? 'star star--filled star--lg' : 'star star--lg'} />
                        ))}
                      </div>
                      <p>Tu evaluación ya está guardada.</p>
                      {existingRating.comentario && <blockquote>{existingRating.comentario}</blockquote>}
                      <p className="field-hint">Enviada el {formatDate(existingRating.fecha)}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitRating}>
                      <fieldset className="review-fieldset" disabled={!receiptConfirmed || ratingStatus === 'saving'}>
                        <div className="rating-block">
                          <p className="field-title">Puntuación</p>
                          <p className="field-hint">¿Cómo fue el servicio de {driver.nombre}?</p>
                          <div className="star-picker">
                            {Array.from({ length: 5 }).map((_, index) => {
                              const value = index + 1;
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onMouseEnter={() => setHoverRating(value)}
                                  onMouseLeave={() => setHoverRating(null)}
                                  onFocus={() => setHoverRating(value)}
                                  onBlur={() => setHoverRating(null)}
                                  onClick={() => setRating(value)}
                                  className="star-picker__btn"
                                  aria-label={`${value} estrellas`}
                                  aria-pressed={rating === value}
                                >
                                  <Star size={24} className={value <= displayedRating ? 'star star--filled star--lg' : 'star star--lg'} />
                                </button>
                              );
                            })}
                          </div>
                          {receiptConfirmed && rating === 0 && <p className="field-hint">Elige una puntuación para enviar tu evaluación.</p>}
                        </div>

                        <div className="review-tags">
                          <p className="field-title">Etiquetas rápidas</p>
                          <div className="review-tags__list">
                            {REVIEW_TAGS.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                className={`review-tag ${selectedTags.includes(tag) ? 'review-tag--selected' : ''}`}
                                aria-pressed={selectedTags.includes(tag)}
                                onClick={() => toggleTag(tag)}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="review-block">
                          <label className="field-title" htmlFor="review-comment">Reseña (opcional)</label>
                          <p className="field-hint">Cuéntale a otros clientes cómo fue la experiencia (máx. 200 caracteres).</p>
                          <textarea
                            id="review-comment"
                            value={reviewText}
                            maxLength={MAX_REVIEW_LENGTH}
                            onChange={(event) => setReviewText(event.target.value)}
                            placeholder="Describe el trato y el estado de la carga"
                            rows={4}
                            className="textarea-field"
                          />
                          <p className="char-count">{reviewText.length} / {MAX_REVIEW_LENGTH}</p>
                        </div>
                      </fieldset>

                      {ratingError && <p className="review-alert review-alert--error" role="alert">{ratingError}</p>}
                      {ratingStatus === 'success' && <p className="review-alert review-alert--success" role="status">Tu evaluación quedó guardada.</p>}
                      <Button
                        type="submit"
                        fullWidth
                        className="submit-review-btn"
                        disabled={!receiptConfirmed || rating < 1 || ratingStatus === 'saving'}
                      >
                        {ratingStatus === 'saving' ? 'Guardando…' : 'Enviar reseña y puntuación'}
                      </Button>
                    </form>
                  )}
                </Card>
              </div>

              <Card className="driver-card">
                <p className="field-title">Tu camionero</p>
                <div className="driver-profile">
                  <span className="driver-profile__avatar">{getInitials(driver.nombre)}</span>
                  <p className="driver-profile__name">{driver.nombre}</p>
                  <p className="driver-profile__meta">{driver.transportista}</p>
                  <p className="driver-profile__meta">{vehicleDetails || 'Vehículo no informado'}</p>
                </div>
                <div className="divider" />
                <dl className="review-summary-facts">
                  <div><dt>Viaje</dt><dd>#{journey.id}</dd></div>
                  <div><dt>{receiptConfirmed ? 'Fecha de cierre' : 'Inicio del viaje'}</dt><dd>{formatDate(receiptConfirmed ? journey.fechaFin : journey.fechaInicio)}</dd></div>
                  <div><dt>Total acordado</dt><dd>{CURRENCY_FORMAT.format(receiptAmount)}</dd></div>
                  {journey.pago && <div><dt>Pago</dt><dd>{journey.pago.estado}</dd></div>}
                </dl>
              </Card>
            </div>

            {receiptConfirmed && (
              <section className="review-closeout" aria-label="Acciones de cierre">
                <div>
                  <p className="review-closeout__title">Viaje cerrado</p>
                  <p className="review-closeout__copy">Descarga la constancia o vuelve a publicar esta ruta.</p>
                </div>
                <div className="review-closeout__actions">
                  <Button variant="secondary" onClick={downloadReceipt}><Download size={16} /> Descargar comprobante</Button>
                  <Button variant="secondary" onClick={repeatShipment}>Repetir este envío</Button>
                  <Button onClick={() => navigate('/publicar', { state: null })}>Publicar otra carga</Button>
                </div>
                {downloadError && <p className="review-alert review-alert--error" role="alert">{downloadError}</p>}
                {downloadStatus && <p className="review-alert review-alert--success" role="status">{downloadStatus}</p>}
              </section>
            )}
          </>
        )}
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />

      {showReceiptDialog && journey && driver && (
        <div className="review-dialog-backdrop" onClick={(event) => event.target === event.currentTarget && setShowReceiptDialog(false)} role="presentation">
          <section className="review-dialog" role="dialog" aria-modal="true" aria-labelledby="receipt-dialog-title">
            <div className="review-dialog__heading">
              <div><p className="eyebrow">Confirmación de entrega</p><h2 id="receipt-dialog-title">¿Recibiste la carga?</h2></div>
              <button type="button" className="review-dialog__close" onClick={() => setShowReceiptDialog(false)} aria-label="Cerrar confirmación"><X size={18} /></button>
            </div>
            <p className="review-dialog__amount">
              Se autorizará liberar <strong>{CURRENCY_FORMAT.format(receiptAmount)}</strong> a <strong>{driver.nombre}</strong>.
            </p>
            <p className="review-dialog__notice">
              La confirmación quedará registrada en el viaje. La transferencia real no se procesa porque todavía no hay una pasarela de pago conectada.
            </p>
            {receiptError && <p className="review-alert review-alert--error" role="alert">{receiptError}</p>}
            <div className="review-dialog__actions">
              <Button type="button" variant="secondary" onClick={() => setShowReceiptDialog(false)}>Volver</Button>
              <Button type="button" variant="success" disabled={receiptStatus === 'saving'} onClick={handleConfirmReceipt}>
                {receiptStatus === 'saving' ? 'Registrando…' : 'Confirmar recepción'}
              </Button>
            </div>
          </section>
        </div>
      )}

      {showIncidentDialog && journey && (
        <div className="review-dialog-backdrop" onClick={(event) => event.target === event.currentTarget && setShowIncidentDialog(false)} role="presentation">
          <section className="review-dialog" role="dialog" aria-modal="true" aria-labelledby="incident-dialog-title">
            <div className="review-dialog__heading">
              <div><p className="eyebrow">Garantía Sincro</p><h2 id="incident-dialog-title">No llegó bien</h2></div>
              <button type="button" className="review-dialog__close" onClick={() => setShowIncidentDialog(false)} aria-label="Cerrar reporte"><X size={18} /></button>
            </div>
            <p className="review-dialog__notice">Reporta el problema antes de confirmar la recepción. El pago no quedará autorizado.</p>
            <form onSubmit={handleReportIncident}>
              <label className="field-title" htmlFor="delivery-incident">¿Qué ocurrió?</label>
              <textarea
                id="delivery-incident"
                className="textarea-field"
                rows={4}
                maxLength={500}
                required
                value={incidentDescription}
                onChange={(event) => setIncidentDescription(event.target.value)}
                placeholder="Describe el daño, faltante o problema de entrega"
              />
              {incidentError && <p className="review-alert review-alert--error" role="alert">{incidentError}</p>}
              {incidentStatus === 'success' && <p className="review-alert review-alert--success" role="status">El problema se registró. No confirmes la recepción hasta resolverlo.</p>}
              <div className="review-dialog__actions">
                <Button type="button" variant="secondary" onClick={() => setShowIncidentDialog(false)}>Cerrar</Button>
                <Button type="submit" variant="secondary" disabled={!incidentDescription.trim() || incidentStatus === 'saving'}>
                  {incidentStatus === 'saving' ? 'Enviando…' : 'Enviar reporte'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
