import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createTransportista, getTransportistas, updateTransportista } from '../admin/adminApi';

const PAGE_SIZE = 5;
const STATUSES = ['Todos', 'Verificado', 'Pendiente', 'Suspendido'];

const emptyForm = { nombre: '', rut: '', patente: '', vehiculo: '', telefono: '' };

function AdminTransportistas({ onLogout }) {
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [managed, setManaged] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTransportistas({ search, estado, page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setError('');
        if (data.page !== page) setPage(data.page);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || 'No se pudieron cargar los transportistas.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [search, estado, page, refresh]);

  const changeSearch = (value) => {
    setLoading(true);
    setResult(null);
    setSearch(value);
    setPage(1);
  };

  const changeStatusFilter = (value) => {
    setLoading(true);
    setResult(null);
    setEstado(value);
    setPage(1);
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const carrier = await createTransportista(form);
      setCreating(false);
      setForm(emptyForm);
      setSearch('');
      setEstado('Todos');
      setPage(1);
      setResult(null);
      setLoading(true);
      setRefresh((current) => current + 1);
      setNotice(`Conductor ${carrier.nombre} registrado. Su estado inicial es Pendiente.`);
    } catch (requestError) {
      setError(requestError.message || 'No se pudo registrar el conductor.');
    } finally {
      setSaving(false);
    }
  };

  const submitManage = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await updateTransportista(managed.id, {
        estado: managed.estado,
        telefono: managed.telefono,
      });
      setManaged(null);
      setResult(null);
      setLoading(true);
      setRefresh((current) => current + 1);
      setNotice(`Se actualizaron los datos de ${managed.nombre}.`);
      setPage(1);
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron actualizar los datos.');
    } finally {
      setSaving(false);
    }
  };

  const pages = result?.totalPages ?? 1;

  return (
    <AdminLayout onLogout={onLogout}>
      <h1 className="adm-title">Transportistas</h1>
      <p className="adm-subtitle">Camioneros verificados y su estado en la plataforma.</p>

      {notice && <p className="adm-success" role="status">{notice}</p>}
      {error && <p className="adm-error" role="alert">{error}</p>}

      <section className="adm-stats adm-carrier-stats" aria-label="Resumen de transportistas">
        <article className="adm-card">
          <h2 className="adm-card-title">Camioneros verificados</h2>
          <p className="adm-card-value">{result?.verificados ?? '—'} <span>de {result?.totalTransportistas ?? '—'} total</span></p>
        </article>
        <article className="adm-card">
          <h2 className="adm-card-title">En ruta ahora</h2>
          <p className="adm-card-value">{result?.activos ?? '—'} <span>fletes activos</span></p>
        </article>
        <article className="adm-card">
          <h2 className="adm-card-title">Calificación promedio</h2>
          <p className="adm-card-value">
            {result ? result.calificacionPromedio.toLocaleString('es-CL', { maximumFractionDigits: 1 }) : '—'}
            <span> de 5</span>
          </p>
        </article>
      </section>

      <div className="adm-toolbar">
        <label className="adm-field adm-search-field">
          <span className="adm-visually-hidden">Buscar por nombre, RUT o patente</span>
          <input
            type="search"
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="Buscar por nombre, RUT o patente"
          />
        </label>
        <label className="adm-field adm-filter-field">
          <span className="adm-visually-hidden">Filtrar por estado</span>
          <select value={estado} onChange={(event) => changeStatusFilter(event.target.value)}>
            {STATUSES.map((status) => <option key={status} value={status}>Estado: {status}</option>)}
          </select>
        </label>
        <button type="button" className="adm-btn adm-btn-primary" onClick={() => {
          setError('');
          setCreating(true);
        }}>
          Nuevo Conductor
        </button>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">RUT</th>
              <th scope="col">Patente</th>
              <th scope="col">Vehículo</th>
              <th scope="col">Estado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(result?.items ?? []).map((carrier) => (
              <tr key={carrier.id}>
                <td>{carrier.nombre}</td>
                <td>{carrier.rut}</td>
                <td>{carrier.patente}</td>
                <td>{carrier.vehiculo}</td>
                <td>
                  <span className={`adm-badge ${carrier.estado === 'Verificado' ? 'adm-badge-ok' : carrier.estado === 'Pendiente' ? 'adm-badge-warn' : 'adm-badge-error'}`}>
                    {carrier.estado}
                  </span>
                </td>
                <td>
                  <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => {
                    setError('');
                    setManaged({ ...carrier });
                  }}>
                    Gestionar
                  </button>
                </td>
              </tr>
            ))}
            {!loading && result?.items.length === 0 && (
              <tr><td colSpan="6" className="adm-table-empty">No hay transportistas que coincidan con la búsqueda.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && <p className="adm-loading" role="status"><span className="adm-spinner" aria-hidden="true" /> Cargando transportistas…</p>}
      {result && (
        <div className="adm-pagination">
          <span className="adm-muted">
            Mostrando {result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1}
            {' '}a {Math.min(result.page * result.pageSize, result.total)} de {result.total} transportistas
          </span>
          <div className="adm-actions">
            <button
              type="button"
              className="adm-btn adm-btn-outline adm-btn-sm"
              onClick={() => {
                setLoading(true);
                setResult(null);
                setPage((current) => Math.max(1, current - 1));
              }}
              disabled={page <= 1 || loading}
            >
              Anterior
            </button>
            <span className="adm-page-count">Página {result.page} de {pages}</span>
            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={() => {
                setLoading(true);
                setResult(null);
                setPage((current) => Math.min(pages, current + 1));
              }}
              disabled={page >= pages || loading}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {creating && (
        <div
          className="adm-overlay"
          onClick={(event) => event.target === event.currentTarget && setCreating(false)}
          onKeyDown={(event) => event.key === 'Escape' && setCreating(false)}
        >
          <form className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-create-title" onSubmit={submitCreate}>
            <button type="button" className="adm-modal-close" aria-label="Cerrar" onClick={() => setCreating(false)}>×</button>
            <h2 id="adm-create-title">Nuevo conductor</h2>
            <p className="adm-muted">El registro de demostración queda guardado en este navegador.</p>
            <div className="adm-form-grid">
              {[
                ['nombre', 'Nombre completo', 'text'],
                ['rut', 'RUT', 'text'],
                ['patente', 'Patente', 'text'],
                ['vehiculo', 'Vehículo', 'text'],
                ['telefono', 'Teléfono', 'tel'],
              ].map(([name, label, type]) => (
                <label className="adm-form-field" key={name}>
                  <span>{label}</span>
                  <input
                    autoComplete="off"
                    required
                    maxLength={name === 'nombre' || name === 'vehiculo' ? 100 : 30}
                    type={type}
                    value={form[name]}
                    onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
                  />
                </label>
              ))}
            </div>
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setCreating(false)}>Cancelar</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Registrar conductor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {managed && (
        <div
          className="adm-overlay"
          onClick={(event) => event.target === event.currentTarget && setManaged(null)}
          onKeyDown={(event) => event.key === 'Escape' && setManaged(null)}
        >
          <form className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-manage-title" onSubmit={submitManage}>
            <button type="button" className="adm-modal-close" aria-label="Cerrar" onClick={() => setManaged(null)}>×</button>
            <h2 id="adm-manage-title">Gestionar a {managed.nombre}</h2>
            <p className="adm-muted">{managed.rut} · {managed.patente} · {managed.vehiculo}</p>
            <label className="adm-form-field">
              <span>Estado del transportista</span>
              <select value={managed.estado} onChange={(event) => setManaged((current) => ({ ...current, estado: event.target.value }))}>
                {STATUSES.filter((status) => status !== 'Todos').map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="adm-form-field">
              <span>Teléfono de contacto</span>
              <input
                type="tel"
                value={managed.telefono}
                maxLength="30"
                onChange={(event) => setManaged((current) => ({ ...current, telefono: event.target.value }))}
              />
            </label>
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setManaged(null)}>Cancelar</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminTransportistas;
