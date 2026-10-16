import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getSolicitudes, getSolicitudDetalle, aprobarSolicitud, rechazarSolicitud } from '../admin/adminApi';

function AdminSolicitudes({ onLogout, session }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [detalleCargado, setDetalleCargado] = useState({ solicitudId: null, item: null });
  const [ocupadoId, setOcupadoId] = useState(null);
  const [rechazando, setRechazando] = useState(null); // solicitud que se está rechazando
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');

  useEffect(() => {
    let cancelado = false;
    getSolicitudes()
      .then((lista) => {
        if (cancelado) return;
        setSolicitudes(lista);
        if (lista.length) setSeleccionadaId(lista[0].id);
      })
      .catch((e) => { if (!cancelado) setError(e.message || 'No se pudieron cargar las solicitudes.'); })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    if (seleccionadaId == null) return undefined;
    let cancelado = false;
    getSolicitudDetalle(seleccionadaId)
      .then((item) => {
        if (!cancelado) setDetalleCargado({ solicitudId: seleccionadaId, item });
      })
      .catch((requestError) => {
        if (cancelado) return;
        setDetalleCargado({ solicitudId: seleccionadaId, item: null });
        setError(requestError.message || 'No se pudieron cargar los datos de verificación.');
      });
    return () => { cancelado = true; };
  }, [seleccionadaId]);

  const quitar = (id) => {
    const resto = solicitudes.filter((s) => s.id !== id);
    setSolicitudes(resto);
    if (seleccionadaId === id) setSeleccionadaId(resto.length ? resto[0].id : null);
  };

  const aprobar = async (s) => {
    setOcupadoId(s.id); setError(''); setAviso('');
    try {
      await aprobarSolicitud(s.id);
      quitar(s.id);
      setAviso(`Solicitud de ${s.nombre} aprobada. El camionero ya puede operar.`);
    } catch (e) { setError(e.message || 'No se pudo aprobar la solicitud.'); }
    finally { setOcupadoId(null); }
  };

  const abrirRechazo = (s) => { setRechazando(s); setMotivo(''); setErrorMotivo(''); };
  const cerrarRechazo = () => { setRechazando(null); setMotivo(''); setErrorMotivo(''); };

  const confirmarRechazo = async (e) => {
    e.preventDefault();
    if (motivo.trim().length < 5) { setErrorMotivo('Indica el motivo del rechazo (mínimo 5 caracteres).'); return; }
    const s = rechazando;
    setOcupadoId(s.id); setError(''); setAviso('');
    try {
      await rechazarSolicitud(s.id, motivo.trim());
      quitar(s.id);
      cerrarRechazo();
      setAviso(`Solicitud de ${s.nombre} rechazada.`);
    } catch (err) { setErrorMotivo(err.message || 'No se pudo rechazar la solicitud.'); }
    finally { setOcupadoId(null); }
  };

  const seleccionada = solicitudes.find((s) => s.id === seleccionadaId);
  const cargandoDetalle = seleccionadaId != null && detalleCargado.solicitudId !== seleccionadaId;
  const detalle = cargandoDetalle || seleccionadaId == null ? null : detalleCargado.item;

  return (
    <AdminLayout onLogout={onLogout} userName={session?.name || session?.email}>
      <h1 className="adm-title">Solicitudes de camioneros pendientes</h1>
      <p className="adm-subtitle">Revisa los datos registrados del conductor y el vehículo para decidir cada solicitud.</p>

      {aviso && <p className="adm-success" role="status">{aviso}</p>}
      {error && <p className="adm-error" role="alert">{error}</p>}
      {loading && <p className="adm-loading" role="status"><span className="adm-spinner" aria-hidden="true" /> Cargando solicitudes…</p>}

      {!loading && solicitudes.length === 0 && !error && (
        <p className="adm-empty">No hay solicitudes pendientes. ¡Todo al día!</p>
      )}

      {solicitudes.length > 0 && (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Nombre</th><th scope="col">RUT</th><th scope="col">Patente</th>
                <th scope="col">Vehículo</th><th scope="col">Licencia</th><th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id} className={s.id === seleccionadaId ? 'selected' : ''}>
                  <td>
                    <button type="button" className="adm-link" onClick={() => setSeleccionadaId(s.id)} aria-pressed={s.id === seleccionadaId}>{s.nombre}</button>
                  </td>
                  <td>{s.rut}</td>
                  <td>{s.patente}</td>
                  <td>{s.vehiculo}</td>
                  <td>
                    <span className={s.licenciaVigente ? 'adm-badge adm-badge-ok' : 'adm-badge adm-badge-error'}>
                      {s.licenciaVigente ? 'Vigente' : 'Vencida o no registrada'}
                    </span>
                  </td>
                  <td>
                    <div className="adm-actions">
                      <button type="button" className="adm-btn adm-btn-success adm-btn-sm" disabled={ocupadoId === s.id} onClick={() => aprobar(s)}>Aprobar</button>
                      <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" disabled={ocupadoId === s.id} onClick={() => abrirRechazo(s)}>Rechazar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {seleccionada && (
        <section className="adm-card adm-docs" aria-label={`Datos de verificación de ${seleccionada.nombre}`}>
          <h2 className="adm-card-title">Datos registrados de {seleccionada.nombre}</h2>
          {cargandoDetalle ? (
            <p className="adm-loading" role="status"><span className="adm-spinner" aria-hidden="true" /> Cargando datos…</p>
          ) : (
            detalle && (
              <>
                <dl className="adm-verification-details">
                  <div><dt>Correo</dt><dd>{detalle.email}</dd></div>
                  <div><dt>Empresa</dt><dd>{detalle.empresa} · {detalle.empresaRut}</dd></div>
                  <div><dt>Conductor</dt><dd>{detalle.nombre} · RUT {detalle.rut}</dd></div>
                  <div><dt>Contacto</dt><dd>{detalle.telefono}</dd></div>
                  <div><dt>Licencia</dt><dd>{detalle.licencia || 'No registrada'} · vence {detalle.vencimientoLicencia || 'sin fecha'}</dd></div>
                  <div><dt>Vehículo</dt><dd>{detalle.vehiculo || 'No registrado'} · {detalle.patente || 'sin patente'} · {detalle.anio || 'sin año'}</dd></div>
                  <div><dt>Capacidad</dt><dd>{detalle.capacidadKg ?? '—'} kg · {detalle.capacidadM3 ?? '—'} m³</dd></div>
                </dl>
                <p className="adm-muted">
                  La cuenta aún no almacena archivos adjuntos. Esta revisión se basa en los datos registrados; confirma la vigencia de la licencia antes de aprobar.
                </p>
              </>
            )
          )}
        </section>
      )}

      {rechazando && (
        <div className="adm-overlay" onKeyDown={(e) => e.key === 'Escape' && cerrarRechazo()}>
          <form className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-modal-title" onSubmit={confirmarRechazo}>
            <h2 id="adm-modal-title">Rechazar solicitud de {rechazando.nombre}</h2>
            <label htmlFor="adm-motivo">Motivo del rechazo <span aria-hidden="true">*</span></label>
            <textarea id="adm-motivo" rows="4" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: El seguro obligatorio está vencido." autoFocus required aria-invalid={!!errorMotivo} aria-describedby={errorMotivo ? 'adm-motivo-error' : undefined} />
            {errorMotivo && <p id="adm-motivo-error" className="adm-error" role="alert">{errorMotivo}</p>}
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn adm-btn-outline" onClick={cerrarRechazo}>Cancelar</button>
              <button type="submit" className="adm-btn adm-btn-danger" disabled={ocupadoId === rechazando.id}>Confirmar rechazo</button>
            </div>
          </form>
        </div>
      )}

    </AdminLayout>
  );
}

export default AdminSolicitudes;