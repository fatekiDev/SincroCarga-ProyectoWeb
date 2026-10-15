// Capa de acceso a datos del módulo Administrador.
// Mientras el backend no tenga los endpoints /api/admin, USE_MOCK = true usa datos de prueba
// con la misma forma que devolverá la API. Para conectar: poner VITE_ADMIN_MOCK=false en el .env
// del frontend. Solo se cambia este archivo; las pantallas no se tocan.
// IMPORTANTE: antes de entregar, la integración real debe estar activa (datos de prueba en el
// frontend en un flujo conectado se penalizan en la rúbrica).

const BASE = import.meta.env.VITE_API_URL || '';
const USE_MOCK = import.meta.env.VITE_ADMIN_MOCK !== 'false';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Error ${res.status}`);
  return data;
}

/* ---------- MOCK TEMPORAL ---------- */
const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms));

let mockSolicitudes = [
  { id: 1, nombre: 'Raúl Soto', rut: '12.345.678-9', patente: 'HXPL-32', vehiculo: 'Camión Sinotruk', documentos: 'completos', faltante: null },
  { id: 2, nombre: 'María Legas', rut: '13.456.789-5', patente: 'KZRT-45', vehiculo: 'Camión 3/4', documentos: 'incompletos', faltante: 'seguro' },
  { id: 3, nombre: 'Pedro Núñez', rut: '14.567.890-1', patente: 'DEDP-12', vehiculo: 'Camión rampla', documentos: 'completos', faltante: null },
];

function mockDocumentos(id) {
  const s = mockSolicitudes.find((x) => x.id === id);
  const seguro = s && s.faltante === 'seguro' ? 'faltante' : 'cargado';
  return [
    { tipo: 'Licencia de conducir', estado: 'cargado', url: null },
    { tipo: 'Permiso de circulación', estado: 'cargado', url: null },
    { tipo: 'Seguro obligatorio', estado: seguro, url: null },
  ];
}

/* ---------- API PÚBLICA ---------- */
export async function getResumen() {
  if (!USE_MOCK) return request('/api/admin/resumen');
  await wait();
  return {
    solicitudesPendientes: mockSolicitudes.length,
    camionerosVerificados: 18,
    fletesActivos: 6,
    pagosRetenidos: 420000,
    verificacionesPendientes: mockSolicitudes.map((s) => ({
      id: s.id, nombre: s.nombre, patente: s.patente, documentos: s.documentos, faltante: s.faltante,
    })),
    actividadReciente: [
      { texto: 'Nueva solicitud de camionero', hace: 'hace 1 h' },
      { texto: 'Flete Ancud → Puerto Montt entregado', hace: 'hace 3 h' },
      { texto: 'Pago liberado a Raúl Soto', hace: 'hace 5 h' },
    ],
  };
}

export async function getSolicitudes() {
  if (!USE_MOCK) return request('/api/admin/solicitudes?estado=pendiente');
  await wait();
  return mockSolicitudes.map((s) => ({ ...s }));
}

export async function getDocumentos(id) {
  if (!USE_MOCK) return request(`/api/admin/solicitudes/${id}`).then((d) => d.documentos || []);
  await wait(250);
  return mockDocumentos(id);
}

export async function aprobarSolicitud(id) {
  if (!USE_MOCK) return request(`/api/admin/solicitudes/${id}/aprobar`, { method: 'PUT' });
  await wait();
  mockSolicitudes = mockSolicitudes.filter((s) => s.id !== id);
  return { ok: true };
}

export async function rechazarSolicitud(id, motivo) {
  if (!USE_MOCK) {
    return request(`/api/admin/solicitudes/${id}/rechazar`, { method: 'PUT', body: JSON.stringify({ motivo }) });
  }
  await wait();
  mockSolicitudes = mockSolicitudes.filter((s) => s.id !== id);
  return { ok: true };
}
