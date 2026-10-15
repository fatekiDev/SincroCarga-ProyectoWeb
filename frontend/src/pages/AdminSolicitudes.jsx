import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getSolicitudes, getDocumentos, aprobarSolicitud, rechazarSolicitud } from '../admin/adminApi';

function AdminSolicitudes({ onLogout }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [documentoActivo, setDocumentoActivo] = useState(null);
  const [documentosCargados, setDocumentosCargados] = useState({ solicitudId: null, items: [] });
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
    getDocumentos(seleccionadaId)
      .then((items) => {
        if (!cancelado) setDocumentosCargados({ solicitudId: seleccionadaId, items });
      })
      .catch((requestError) => {
        if (cancelado) return;
        setDocumentosCargados({ solicitudId: seleccionadaId, items: [] });
        setError(requestError.message || 'No se pudieron cargar los documentos.');
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
  const cargandoDocs = seleccionadaId != null && documentosCargados.solicitudId !== seleccionadaId;
  const documentos = cargandoDocs || seleccionadaId == null ? [] : documentosCargados.items;
  const cerrarDocumento = () => setDocumentoActivo(null);

  return (
    <AdminLayout onLogout={onLogout}>
      <h1 className="adm-title">Solicitudes de camioneros pendientes</h1>
      <p className="adm-subtitle">Revisa los documentos y aprueba o rechaza cada solicitud.</p>

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
                <th scope="col">Vehículo</th><th scope="col">Documentos</th><th scope="col">Acciones</th>
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
                    <span className={s.documentos === 'completos' ? 'adm-badge adm-badge-ok' : 'adm-badge adm-badge-error'}>
                      {s.documentos === 'completos' ? 'Completos' : `Falta ${s.faltante || 'documento'}`}
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
        <section className="adm-card adm-docs" aria-label={`Documentos de ${seleccionada.nombre}`}>
          <h2 className="adm-card-title">Documentos de {seleccionada.nombre}</h2>
          {cargandoDocs ? (
            <p className="adm-loading" role="status"><span className="adm-spinner" aria-hidden="true" /> Cargando documentos…</p>
          ) : (
            <div className="adm-docs-grid">
              {documentos.map((d) => (
                <article key={d.tipo} className="adm-doc">
                  <h3>{d.tipo}</h3>
                  <span className={d.estado === 'cargado' ? 'adm-badge adm-badge-ok' : 'adm-badge adm-badge-error'}>
                    {d.estado === 'cargado' ? 'Cargado' : 'Falta'}
                  </span>
                  <button
                    type="button"
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    onClick={() => setDocumentoActivo(d)}
                  >
                    Ver documento
                  </button>
                </article>
              ))}
            </div>
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

      {documentoActivo && (
        <div
          className="adm-overlay"
          onClick={(event) => event.target === event.currentTarget && cerrarDocumento()}
          onKeyDown={(event) => event.key === 'Escape' && cerrarDocumento()}
        >
          <section
            className="adm-modal adm-document-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adm-document-title"
          >
            <button
              type="button"
              className="adm-modal-close"
              aria-label="Cerrar vista previa"
              onClick={cerrarDocumento}
            >
              ×
            </button>
            <h2 id="adm-document-title">{documentoActivo.tipo}</h2>
            <p className="adm-muted">
              {seleccionada?.nombre} · {documentoActivo.numero || 'Documento del transportista'}
            </p>
            {documentoActivo.url ? (
              <>
                <iframe
                  className="adm-document-preview"
                  src={documentoActivo.url}
                  title={`Vista previa: ${documentoActivo.tipo}`}
                  sandbox=""
                  referrerPolicy="no-referrer"
                />
                <a
                  className="adm-btn adm-btn-outline"
                  href={documentoActivo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir documento en otra pestaña
                </a>
              </>
            ) : (
              <div className="adm-document-placeholder" role="status">
                <strong>Vista previa de demostración</strong>
                <p>
                  Esta solicitud no tiene un archivo adjunto almacenado. El documento se muestra
                  como dato de prueba y no se genera ni descarga un archivo real.
                </p>
              </div>
            )}
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn adm-btn-primary" onClick={cerrarDocumento}>
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminSolicitudes;