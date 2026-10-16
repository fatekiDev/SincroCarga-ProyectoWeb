import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getReportes } from '../admin/adminApi';

const PERIODS = [
  ['7d', 'Últimos 7 días'],
  ['30d', 'Últimos 30 días'],
  ['90d', 'Últimos 90 días'],
  ['365d', 'Últimos 12 meses'],
  ['all', 'Todo el período disponible'],
];

const currency = (value) => `$${Number(value || 0).toLocaleString('es-CL')}`;

function csvCell(value) {
  const text = String(value ?? '');
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function downloadCsv(report, period) {
  const headers = ['Fecha', 'ID viaje', 'Ruta', 'Transportista', 'Tarifa (CLP)', 'Comisión (CLP)', 'Estado de pago', 'Calificación'];
  const rows = report.registros.map((record) => [
    record.fecha,
    record.viajeId,
    record.ruta,
    record.transportista,
    record.tarifa,
    record.comision,
    record.estadoPago,
    record.calificacion.toFixed(1),
  ]);
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `sincrocarga-reporte-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function AdminReportes({ onLogout, session }) {
  const [period, setPeriod] = useState('30d');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    getReportes(period)
      .then((data) => {
        if (cancelled) return;
        setReport(data);
        setError('');
      })
      .catch((requestError) => {
        if (!cancelled) {
          setReport(null);
          setError(requestError.message || 'No se pudieron cargar los reportes.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [period]);

  const exportReport = () => {
    if (!report) {
      setError('Espera a que el reporte termine de cargar antes de exportarlo.');
      return;
    }
    try {
      downloadCsv(report, period);
      setNotice(`CSV descargado con ${report.registros.length} fletes del período seleccionado.`);
      setError('');
    } catch (downloadError) {
      setError(downloadError.message || 'No se pudo generar el archivo CSV.');
      setNotice('');
    }
  };

  const maxWeekly = Math.max(1, ...(report?.fletesPorSemana ?? []).map((item) => item.cantidad));
  const maxRoute = Math.max(1, ...(report?.rutasFrecuentes ?? []).map((item) => item.cantidad));

  return (
    <AdminLayout onLogout={onLogout} userName={session?.name || session?.email}>
      <h1 className="adm-title">Reportes</h1>
      <p className="adm-subtitle">Indicadores de la operación en Chiloé.</p>

      <div className="adm-report-toolbar">
        <label className="adm-field">
          <span className="adm-visually-hidden">Período del reporte</span>
          <select value={period} onChange={(event) => {
            setLoading(true);
            setReport(null);
            setPeriod(event.target.value);
            setNotice('');
          }}>
            {PERIODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button
          type="button"
          className="adm-btn adm-btn-outline adm-export"
          onClick={exportReport}
          disabled={loading || !report}
        >
          Exportar CSV
        </button>
      </div>

      <p className="adm-demo-note">
        Indicadores calculados a partir de los viajes completados y pagos registrados en PostgreSQL.
      </p>
      {notice && <p className="adm-success" role="status">{notice}</p>}
      {error && <p className="adm-error" role="alert">{error}</p>}
      {loading && <p className="adm-loading" role="status"><span className="adm-spinner" aria-hidden="true" /> Calculando indicadores…</p>}

      {report && (
        <>
          <section className="adm-stats adm-report-stats" aria-label="Indicadores del período">
            <article className="adm-card">
              <h2 className="adm-card-title">Fletes completados</h2>
              <p className="adm-card-value">{report.fletesCompletados}</p>
              <p className="adm-muted">
                {report.cambioFletes == null
                  ? 'Período completo disponible'
                  : `${report.cambioFletes >= 0 ? '+' : ''}${report.cambioFletes} vs. período anterior`}
              </p>
            </article>
            <article className="adm-card">
              <h2 className="adm-card-title">Pagos retenidos</h2>
              <p className="adm-card-value">{currency(report.pagosRetenidos)} <span>CLP</span></p>
              <p className="adm-muted">A transportistas</p>
            </article>
            <article className="adm-card">
              <h2 className="adm-card-title">Comisión SincroCarga</h2>
              <p className="adm-card-value">{currency(report.comisiones)} <span>CLP</span></p>
              <p className="adm-muted">Comisiones registradas en los pagos</p>
            </article>
            <article className="adm-card">
              <h2 className="adm-card-title">Calificación promedio</h2>
              <p className="adm-card-value">
                {report.calificacionPromedio
                  ? report.calificacionPromedio.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                  : '—'}
                <span> de 5</span>
              </p>
              <p className="adm-muted">
                {report.calificacionesCount
                  ? `Basada en ${report.calificacionesCount} calificaciones`
                  : 'Sin calificaciones en el período'}
              </p>
            </article>
          </section>

          <section className="adm-report-charts" aria-label="Gráficos del reporte">
            <article className="adm-card adm-chart-card">
              <h2 className="adm-card-title">Fletes completados por semana</h2>
              {report.fletesCompletados === 0 ? (
                <p className="adm-chart-empty">No hay fletes para mostrar en este período.</p>
              ) : (
                <div className="adm-bar-chart" role="img" aria-label="Cantidad semanal de fletes completados">
                  {report.fletesPorSemana.map((item) => (
                    <div className="adm-bar-column" key={item.semana}>
                      <span className="adm-bar-value">{item.cantidad}</span>
                      <div className="adm-bar-track">
                        <span className="adm-bar" style={{ height: `${Math.max(4, item.cantidad / maxWeekly * 100)}%` }} />
                      </div>
                      <span className="adm-bar-label">{item.semana}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="adm-muted">Total del período: {report.fletesCompletados} fletes.</p>
            </article>

            <article className="adm-card adm-chart-card">
              <h2 className="adm-card-title">Rutas más frecuentes</h2>
              {report.rutasFrecuentes.length === 0 ? (
                <p className="adm-chart-empty">No hay rutas para mostrar en este período.</p>
              ) : (
                <ul className="adm-route-chart">
                  {report.rutasFrecuentes.map((item) => (
                    <li key={item.ruta}>
                      <div className="adm-route-meta"><span>{item.ruta}</span><strong>{item.cantidad} fletes</strong></div>
                      <span className="adm-route-track">
                        <span style={{ width: `${item.cantidad / maxRoute * 100}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </>
      )}
    </AdminLayout>
  );
}

export default AdminReportes;
