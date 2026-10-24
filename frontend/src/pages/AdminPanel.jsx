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
            <Link to="/admin/solicitudes" className="adm-card adm-stat-link">
              <h2 className="adm-card-title">Solicitudes de camionero</h2>
              <p className="adm-card-value">{data.solicitudesPendientes} <span>pendientes</span></p>
              <span className="adm-btn adm-btn-primary">Revisar</span>
            </Link>
            <Link to="/admin/transportistas" className="adm-card adm-stat-link">
              <h2 className="adm-card-title">Camioneros verificados</h2>
              <p className="adm-card-value">{data.camionerosVerificados}</p>
              <span className="adm-btn adm-btn-primary">Ver listado</span>
            </Link>
            <Link to="/admin/reportes" className="adm-card adm-stat-link">
              <h2 className="adm-card-title">Fletes activos</h2>
              <p className="adm-card-value">{data.fletesActivos}</p>
              <span className="adm-btn adm-btn-primary">Ver fletes</span>
            </Link>
            <Link to="/admin/reportes" className="adm-card adm-stat-link">
              <h2 className="adm-card-title">Pagos retenidos</h2>
              <p className="adm-card-value">{clp(data.pagosRetenidos)} <span>CLP</span></p>
              <span className="adm-btn adm-btn-primary">Ver pagos</span>
            </Link>
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
              {data.actividadReciente.length === 0 ? (
                <p className="adm-muted">Todavía no hay actividad reciente.</p>
              ) : (
                <ul className="adm-list">
                  {data.actividadReciente.map((a, i) => (
                    <li key={i}><span>{a.texto}</span><span className="adm-muted">{a.hace}</span></li>
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

export default AdminPanel;