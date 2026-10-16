import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getResumen } from '../admin/adminApi';

const clp = (n) => `$${Number(n).toLocaleString('es-CL')}`;

function AdminPanel({ onLogout, session }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;
    getResumen()
      .then((d) => { if (!cancelado) setData(d); })
      .catch((e) => { if (!cancelado) setError(e.message || 'No se pudo cargar el panel.'); })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, []);

  return (
    <AdminLayout onLogout={onLogout} userName={session?.name || session?.email}>
      <h1 className="adm-title">Panel administrativo</h1>
      <p className="adm-subtitle">Resumen de verificaciones y actividad de la plataforma.</p>

      {loading && <p className="adm-loading" role="status"><span className="adm-spinner" aria-hidden="true" /> Cargando panel…</p>}
      {error && <p className="adm-error" role="alert">{error}</p>}

      {data && (
        <>
          <section className="adm-stats" aria-label="Resumen">
            <article className="adm-card">
              <h2 className="adm-card-title">Solicitudes de camionero</h2>
              <p className="adm-card-value">{data.solicitudesPendientes} <span>pendientes</span></p>
              <Link to="/admin/solicitudes" className="adm-btn adm-btn-primary">Revisar</Link>
            </article>
            <article className="adm-card">
              <h2 className="adm-card-title">Camioneros verificados</h2>
              <p className="adm-card-value">{data.camionerosVerificados}</p>
              <Link to="/admin/transportistas" className="adm-btn adm-btn-primary">Ver listado</Link>
            </article>
            <article className="adm-card">
              <h2 className="adm-card-title">Fletes activos</h2>
              <p className="adm-card-value">{data.fletesActivos}</p>
              <Link to="/admin/reportes" className="adm-btn adm-btn-primary">Ver fletes</Link>
            </article>
            <article className="adm-card">
              <h2 className="adm-card-title">Pagos retenidos</h2>
              <p className="adm-card-value">{clp(data.pagosRetenidos)} <span>CLP</span></p>
              <Link to="/admin/reportes" className="adm-btn adm-btn-primary">Ver pagos</Link>
            </article>
          </section>

          <section className="adm-two-col">
            <article className="adm-card">
              <h2 className="adm-card-title">Verificaciones pendientes</h2>
              {data.verificacionesPendientes.length === 0 ? (
                <p className="adm-muted">No hay verificaciones pendientes.</p>
              ) : (
                <ul className="adm-list">
                  {data.verificacionesPendientes.map((v) => (
                    <li key={v.id}>
                      <span>{v.nombre} · {v.patente}</span>
                      <span className={v.licenciaVigente ? 'adm-badge adm-badge-ok' : 'adm-badge adm-badge-warn'}>
                        {v.licenciaVigente ? 'Licencia vigente' : 'Revisar licencia'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/admin/solicitudes" className="adm-btn adm-btn-primary adm-btn-block">Revisar solicitudes</Link>
            </article>

            <article className="adm-card">
              <h2 className="adm-card-title">Actividad reciente</h2>
              <ul className="adm-list">
                {data.actividadReciente.map((a, i) => (
                  <li key={i}><span>{a.texto}</span><span className="adm-muted">{a.hace}</span></li>
                ))}
              </ul>
            </article>
          </section>
        </>
      )}
    </AdminLayout>
  );
}

export default AdminPanel;