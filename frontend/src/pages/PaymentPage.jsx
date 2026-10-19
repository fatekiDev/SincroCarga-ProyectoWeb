import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Check, CreditCard, LoaderCircle, ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/button'
import Card from '../components/Card'
import { getCurrentPayment, startSimulatedPayment } from '../pagos/api'
import '../styles/PaymentPage.css'

const CURRENCY_FORMAT = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const PAYMENT_STEPS = [
  { state: 'Pendiente', label: 'Pendiente' },
  { state: 'Procesando', label: 'Procesando' },
  { state: 'Retenido', label: 'Retenido' },
  { state: 'Liberado', label: 'Liberado' },
]

function formatNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? new Intl.NumberFormat('es-CL').format(number) : '—'
}

function getPaymentStep(state) {
  const index = PAYMENT_STEPS.findIndex((step) => step.state === state)
  return Math.max(index, 0)
}

export default function PaymentPage({ session, onLogout }) {
  const [paymentData, setPaymentData] = useState(null)
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getCurrentPayment({ signal: controller.signal })
      .then((result) => {
        setPaymentData(result)
        setLoadState(result ? 'ready' : 'empty')
        setLoadError('')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setLoadError(error.message)
        setLoadState('error')
      })
    return () => controller.abort()
  }, [retryToken])

  const paymentState = paymentData?.pago?.estado ?? 'Pendiente'

  useEffect(() => {
    if (paymentState !== 'Procesando') return undefined
    const controller = new AbortController()
    let requestInFlight = false

    const pollPayment = async () => {
      if (requestInFlight) return
      requestInFlight = true
      try {
        const result = await getCurrentPayment({ signal: controller.signal })
        setPaymentData(result)
      } catch (error) {
        if (error.name !== 'AbortError') setActionError(error.message)
      } finally {
        requestInFlight = false
      }
    }

    const intervalId = window.setInterval(pollPayment, 1000)
    return () => {
      window.clearInterval(intervalId)
      controller.abort()
    }
  }, [paymentState])

  const handleSimulatedPayment = async () => {
    if (!termsAccepted || !paymentData || isSubmitting) return
    setIsSubmitting(true)
    setActionError('')
    try {
      const result = await startSimulatedPayment(paymentData.viaje.id)
      setPaymentData(result)
    } catch (error) {
      setActionError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPending = paymentState === 'Pendiente'
  const isProcessing = paymentState === 'Procesando'
  const paymentStep = getPaymentStep(paymentState)

  return (
    <div className="page payment-page">
      <Navbar activeSection="pagos" session={session} onLogout={onLogout} />

      <main className="payment-main">
        {loadState === 'loading' && (
          <p className="payment-message" role="status"><LoaderCircle size={18} /> Cargando el pago del viaje…</p>
        )}
        {loadState === 'error' && (
          <Card className="payment-empty" role="alert">
            <h1>No se pudo cargar el pago</h1>
            <p>{loadError || 'Algo se cayó al ir a buscar el pago. Prueba de nuevo en un rato.'}</p>
            <Button onClick={() => setRetryToken((token) => token + 1)}>Probar de nuevo</Button>
          </Card>
        )}
        {loadState === 'empty' && (
          <Card className="payment-empty">
            <h1>No hay una postulación aceptada pendiente</h1>
            <p>Cuando un transportista acepte una de tus cargas, aquí aparecerá la tarifa acordada.</p>
            <Button variant="secondary" onClick={() => window.location.assign('/publicar')}>Ir a mis publicaciones</Button>
          </Card>
        )}

        {paymentData && (
          <>
            <div className="payment-header">
              <div>
                <p className="eyebrow">Pago del viaje</p>
                <h1 className="payment-title">Confirma el monto de tu carga</h1>
                <p className="payment-subtitle">{paymentData.viaje.carga} · {paymentData.viaje.ruta.origen} → {paymentData.viaje.ruta.destino}</p>
              </div>
              <span className="payment-demo-badge"><span /> Pago de demostración</span>
            </div>

            <div className="payment-grid">
              <Card className="payment-card">
                <h2 className="payment-card__title">Carga y conductor</h2>
                <dl className="payment-facts">
                  <div><dt>Carga</dt><dd>{paymentData.viaje.carga}</dd></div>
                  <div><dt>Ruta</dt><dd>{paymentData.viaje.ruta.origen} → {paymentData.viaje.ruta.destino}</dd></div>
                  <div><dt>Peso</dt><dd>{formatNumber(paymentData.viaje.pesoKg)} kg</dd></div>
                  <div><dt>Conductor</dt><dd>{paymentData.conductor.nombre}</dd></div>
                  <div><dt>Transportista</dt><dd>{paymentData.conductor.transportista}</dd></div>
                </dl>
              </Card>

              <Card className="payment-card">
                <h2 className="payment-card__title">Datos de facturación</h2>
                <dl className="payment-facts">
                  <div><dt>Razón social</dt><dd>{paymentData.factura.razonSocial}</dd></div>
                  <div><dt>RUT</dt><dd>{paymentData.factura.rut}</dd></div>
                  <div><dt>Correo</dt><dd>{paymentData.factura.email}</dd></div>
                </dl>
                <p className="payment-invoice-note">Usaremos los datos de facturación registrados en tu cuenta.</p>
              </Card>

              <Card className="payment-card payment-card--checkout">
                <h2 className="payment-card__title">Desglose del monto acordado</h2>
                <dl className="payment-facts payment-costs">
                  <div><dt>Tarifa de la postulación aceptada</dt><dd>{CURRENCY_FORMAT.format(paymentData.costos.tarifaBase)}</dd></div>
                  <div><dt>Comisión SincroCarga ({formatNumber(paymentData.costos.comisionPorcentaje)}%)</dt><dd>{CURRENCY_FORMAT.format(paymentData.costos.comision)}</dd></div>
                  <div><dt>IVA sobre la comisión ({formatNumber(paymentData.costos.ivaPorcentaje)}%)</dt><dd>{CURRENCY_FORMAT.format(paymentData.costos.iva)}</dd></div>
                  <div className="payment-costs__total"><dt>Total a pagar</dt><dd>{CURRENCY_FORMAT.format(paymentData.costos.total)}</dd></div>
                </dl>

                <div className="payment-method-display">
                  <CreditCard size={17} />
                  <span>Pago simulado con tarjeta</span>
                  <span className="payment-method-display__tag">Sin cobro real</span>
                </div>

                <ol className="payment-progress" aria-label="Estado del pago">
                  {PAYMENT_STEPS.map((step, index) => (
                    <li key={step.state} className={index < paymentStep ? 'payment-progress__step payment-progress__step--done' : index === paymentStep ? 'payment-progress__step payment-progress__step--active' : 'payment-progress__step'}>
                      <span>{index < paymentStep ? <Check size={13} /> : index + 1}</span>
                      <p>{step.label}</p>
                    </li>
                  ))}
                </ol>

                {isPending && (
                  <>
                    <label className="payment-consent">
                      <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
                      <span>Confirmo los datos de facturación y acepto iniciar el pago de demostración por el monto indicado.</span>
                    </label>
                    {actionError && <p className="payment-error" role="alert">{actionError}</p>}
                    <Button fullWidth className="payment-submit" disabled={!termsAccepted || isSubmitting} onClick={handleSimulatedPayment}>
                      {isSubmitting ? <><LoaderCircle size={16} /> Iniciando…</> : 'Simular pago seguro'}
                    </Button>
                  </>
                )}
                {isProcessing && (
                  <p className="payment-state-message" role="status"><LoaderCircle size={17} /> Procesando el pago de demostración…</p>
                )}
                {paymentState === 'Retenido' && (
                  <p className="payment-state-message payment-state-message--held" role="status">
                    <ShieldCheck size={17} /> Estado simulado: fondos retenidos hasta confirmar la entrega. No se ha movido dinero real.
                  </p>
                )}
                {paymentState === 'Liberado' && (
                  <p className="payment-state-message payment-state-message--released" role="status">
                    <BadgeCheck size={17} /> Pago de demostración liberado al confirmar la recepción. No representa una transferencia bancaria.
                  </p>
                )}
                {actionError && !isPending && <p className="payment-error" role="alert">{actionError}</p>}
              </Card>
            </div>

            <section className="payment-guarantee" aria-label="Estado del pago de demostración">
              <div className="payment-guarantee__copy">
                <p className="payment-guarantee__eyebrow"><Check size={13} strokeWidth={3} /> Estado transparente</p>
                <h2>
                  {paymentState === 'Liberado'
                    ? 'La recepción se confirmó y el pago de demostración quedó liberado.'
                    : 'El pago se simula y queda retenido hasta que confirmes la recepción.'}
                </h2>
                <p className="payment-guarantee__disclaimer">No hay pasarela conectada ni reembolso automático. La comisión (10% por defecto) e IVA mostrado son valores configurables, sujetos a validación comercial y contable.</p>
              </div>
              <Link
                to={paymentState === 'Liberado' ? '/review' : '/matching'}
                className="btn btn--secondary payment-guarantee__button"
              >
                {paymentState === 'Liberado' ? 'Ver comprobante y reseña' : 'Ver seguimiento'}
              </Link>
            </section>
          </>
        )}
      </main>

      <Footer session={session} tagline="Matching de carga y transporte en Chiloé" />
    </div>
  )
}