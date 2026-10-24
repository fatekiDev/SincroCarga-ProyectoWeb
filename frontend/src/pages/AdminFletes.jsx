import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getFletesActivos } from '../admin/adminApi';

function AdminFletes({ onLogout, session }) {
  const [fletes, setFletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getFletesActivos()
      .then((items) => {
        if (!cancelled) setFletes(items);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || 'No se pudieron cargar los fletes activos.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminLayout onLogout={onLogout} userName={session?.name || session?.email}>
      <h1 className="adm-title">Fletes activos</h1>
      <p className="adm-subtitle">Viajes que actualmente están en progreso.</p>

      {loading && <p className="adm-loading" role="status"><span className="adm-spinner" aria-hidden="true" /> Cargando fletes activos…</p>}
      {error && <p className="adm-error" role="alert">{error}</p>}

      {!loading && !error && fletes.length === 0 && (
        <p className="adm-empty">No hay fletes activos en este momento.</p>
      )}

      {!loading && fletes.length > 0 && (
        <>
          <p className="adm-muted">{fletes.length} {fletes.length === 1 ? 'flete activo' : 'fletes activos'}.</p>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th scope="col">Flete</th>
                  <th scope="col">Ruta</th>
                  <th scope="col">Carga</th>
                  <th scope="col">Transportista</th>
                  <th scope="col">Conductor</th>
                  <th scope="col">Patente</th>
                  <th scope="col">Inicio</th>
                </tr>
              </thead>
              <tbody>
                {fletes.map((flete) => (
                  <tr key={flete.id}>
                    <td>#{flete.id}</td>
                    <td>{flete.origen} → {flete.destino}</td>
                    <td>{flete.carga}</td>
                    <td>{flete.transportista}</td>
                    <td>{flete.chofer}</td>
                    <td>{flete.patente}</td>
                    <td>{new Date(flete.fechaInicio).toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

export default AdminFletes;
