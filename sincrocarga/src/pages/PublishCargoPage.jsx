import { useMemo, useState } from 'react';
import { Package, Weight, Calendar, MapPin, Flag, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Card from '../components/Card';
import '../styles/PublishCargoPage.css';

const MOCK_USER = { initials: 'FM', name: 'Francisco M.', roleLabel: 'Cliente · Ancud' };

const INITIAL_FORM = {
  objectName: '',
  weightKg: '850',
  lengthCm: '120',
  widthCm: '100',
  heightCm: '90',
  pickupDate: '',
  origin: '',
  destination: '',
};

const DIMENSION_OPTIONS = ['60', '90', '100', '120', '150', '180'];

export default function PublishCargoPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const breakdown = useMemo(() => {
    const weight = Number(form.weightKg) || 0;
    const baseFreight = 20000 + weight * 9.4;
    return [
      { label: 'Flete base', value: `$${Math.round(baseFreight).toLocaleString('es-CL')}` },
      { label: 'Recargo por cruce marítimo', value: '+ $6.500', accent: 'warning' },
      { label: 'Distancia estimada', value: '86 km · Pargua–Chacao incluido' },
    ];
  }, [form.weightKg]);

  const estimatedTotal = useMemo(() => {
    const weight = Number(form.weightKg) || 0;
    return Math.round(20000 + weight * 9.4 + 6500);
  }, [form.weightKg]);

  return (
    <div className="page">
      <Navbar activeSection="publicar" user={MOCK_USER} />

      <main className="page__main">
        <p className="eyebrow">Publicar carga</p>
        <h1 className="page__title">Publica tu carga y obtén coincidencias</h1>
        <p className="page__subtitle">
          Describe qué necesitas transportar y cuándo. Te mostramos transportistas con espacio
          disponible en tu ruta y un precio estimado al instante.
        </p>

        <div className="route-breadcrumb">
          <span>Pargua</span>
          <span className="route-breadcrumb__dash">-------</span>
          <span>Cruce Chacao</span>
          <span className="route-breadcrumb__dash">-------</span>
          <span className="route-breadcrumb__highlight">Chiloé</span>
        </div>

        <div className="steps-grid">
          <div>
            <button
              onClick={() => setStep(1)}
              className={`step-tab ${step === 1 ? 'step-tab--active' : ''}`}
            >
              Datos de la carga <span className="step-tab__meta">Paso 1 de 2</span>
            </button>

            <div className="field-stack">
              <Field label="Nombre del objeto" icon={<Package size={16} />}>
                <input
                  value={form.objectName}
                  onChange={(e) => updateField('objectName', e.target.value)}
                  placeholder="Ej: Pallets de mariscos congelados"
                  className="input-field"
                />
              </Field>

              <Field label="Peso" icon={<Weight size={16} />} suffix="kg">
                <input
                  value={form.weightKg}
                  onChange={(e) => updateField('weightKg', e.target.value)}
                  type="number"
                  className="input-field"
                />
              </Field>

              <div>
                <label className="field-label">Dimensiones (largo × ancho × alto)</label>
                <div className="dimensions-grid">
                  <DimensionSelect value={form.lengthCm} onChange={(v) => updateField('lengthCm', v)} />
                  <DimensionSelect value={form.widthCm} onChange={(v) => updateField('widthCm', v)} />
                  <DimensionSelect value={form.heightCm} onChange={(v) => updateField('heightCm', v)} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={() => setStep(2)}
              className={`step-tab ${step === 2 ? 'step-tab--active' : ''}`}
            >
              Detalles del viaje y costo <span className="step-tab__meta">Paso 2 de 2</span>
            </button>

            <div className="field-stack">
              <Field label="Retiro deseado" icon={<Calendar size={16} />}>
                <input
                  value={form.pickupDate}
                  onChange={(e) => updateField('pickupDate', e.target.value)}
                  type="date"
                  className="input-field"
                />
              </Field>

              <Field label="Origen" icon={<MapPin size={16} />}>
                <input
                  value={form.origin}
                  onChange={(e) => updateField('origin', e.target.value)}
                  placeholder="Ancud, sector Pudeto"
                  className="input-field"
                />
              </Field>

              <Field label="Destino" icon={<Flag size={16} />}>
                <input
                  value={form.destination}
                  onChange={(e) => updateField('destination', e.target.value)}
                  placeholder="Puerto Montt, terminal"
                  className="input-field"
                />
              </Field>
            </div>
          </div>
        </div>

        <Card className="price-card">
          <div className="price-card__top">
            <div className="price-card__note">
              <span className="price-card__note-icon">
                <Zap size={12} />
              </span>
              <div>
                <p className="price-card__note-title">Precio en tiempo real</p>
                <p className="price-card__note-text">
                  Se recalcula automáticamente según distancia, peso declarado y disponibilidad
                  de transportistas en tu ruta.
                </p>
              </div>
            </div>
            <div className="price-card__total">
              <p className="price-card__total-label">Precio estimado</p>
              <p className="price-card__total-value">
                ${estimatedTotal.toLocaleString('es-CL')} <span>CLP</span>
              </p>
            </div>
          </div>

          <div className="price-card__divider" />

          <div className="price-card__breakdown">
            {breakdown.map((item) => (
              <div key={item.label} className="price-card__row">
                <span className={item.accent === 'warning' ? 'text-warning' : 'text-primary'}>
                  {item.label}
                </span>
                <span className={item.accent === 'warning' ? 'text-warning font-medium' : 'font-medium'}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="submit-row">
          <p className="submit-row__disclaimer">
            Al publicar, tu solicitud queda visible para transportistas con rutas compatibles.
            Podrás revisar y aceptar propuestas antes de confirmar el pago.
          </p>
          <Button>Publicar solicitud de flete</Button>
        </div>
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />
    </div>
  );
}

function Field({ label, icon, suffix, children }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="field-wrap">
        <span className="field-icon">{icon}</span>
        {children}
        {suffix && <span className="field-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

function DimensionSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field select-field">
      {DIMENSION_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt} cm
        </option>
      ))}
    </select>
  );
}
