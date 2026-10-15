// Datos de demostración locales hasta que se implementen los endpoints administrativos.

const BASE = import.meta.env.VITE_API_URL || '';
const USE_MOCK = import.meta.env.VITE_ADMIN_MOCK !== 'false';
const STORAGE_KEYS = {
  carriers: 'sincrocarga_admin_carriers',
  requests: 'sincrocarga_admin_requests',
};

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const responseText = await res.text();
  let data = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      throw new Error(`El servidor devolvió una respuesta no válida (${res.status}).`, { cause: error });
    }
  }
  if (!res.ok) throw new Error(data.error || data.message || `Error ${res.status}`);
  return data;
}

const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms));

const initialRequests = [
  { id: 1, nombre: 'Raúl Soto', rut: '12.345.678-9', patente: 'HXPL-32', vehiculo: 'Camión Sinotruk', documentos: 'completos', faltante: null },
  { id: 2, nombre: 'María Legas', rut: '13.456.789-5', patente: 'KZRT-45', vehiculo: 'Camión 3/4', documentos: 'incompletos', faltante: 'seguro' },
  { id: 3, nombre: 'Pedro Núñez', rut: '14.567.890-1', patente: 'DEDP-12', vehiculo: 'Camión rampla', documentos: 'completos', faltante: null },
];

const carrierNames = [
  ['Raúl Soto', '12.345.678-9', 'HXPL-32', 'Camión Sinotruk', 'Verificado'],
  ['María Legas', '13.456.789-5', 'KZRT-45', 'Camión 3/4', 'Pendiente'],
  ['Pedro Núñez', '14.567.890-1', 'DEDP-12', 'Camión rampla', 'Verificado'],
  ['Camila Barría', '15.678.901-2', 'FGTR-18', 'Camión refrigerado', 'Verificado'],
  ['Jorge Almonacid', '16.789.012-3', 'LMNP-24', 'Camión tolva', 'Verificado'],
  ['Paula Cárdenas', '17.890.123-4', 'QWER-36', 'Camión 3/4', 'Suspendido'],
  ['Diego Oyarzún', '18.901.234-5', 'TYUI-47', 'Camión rampla', 'Verificado'],
  ['Fernanda Vidal', '19.012.345-6', 'ASDF-52', 'Camión refrigerado', 'Verificado'],
  ['Andrés Mansilla', '10.123.456-7', 'GHJK-63', 'Camión plano', 'Pendiente'],
  ['Valentina Soto', '11.234.567-8', 'ZXCV-74', 'Camión 3/4', 'Verificado'],
  ['Cristóbal Vera', '20.345.678-9', 'BNMQ-85', 'Camión rampla', 'Verificado'],
  ['Daniela Ruiz', '21.456.789-0', 'PLKA-96', 'Camión refrigerado', 'Verificado'],
  ['Sebastián Díaz', '22.567.890-1', 'MNBV-17', 'Camión tolva', 'Verificado'],
  ['Francisca León', '23.678.901-2', 'VCXZ-28', 'Camión plano', 'Suspendido'],
  ['Matías Paredes', '24.789.012-3', 'LKJH-39', 'Camión 3/4', 'Verificado'],
  ['Constanza Vidal', '25.890.123-4', 'TREW-40', 'Camión rampla', 'Verificado'],
  ['Felipe Gallardo', '26.901.234-5', 'YUIO-51', 'Camión refrigerado', 'Verificado'],
  ['Antonia Aguilar', '27.012.345-6', 'HGFDS-62', 'Camión plano', 'Verificado'],
].map(([nombre, rut, patente, vehiculo, estado], index) => ({
  id: index + 1,
  nombre,
  rut,
  patente,
  vehiculo,
  telefono: '+56 9 1234 5678',
  estado,
  enRuta: [0, 2, 3, 4, 6, 7].includes(index),
  fechaRegistro: new Date(Date.now() - index * 86400000).toISOString(),
}));

function readStored(key, fallback) {
  const value = localStorage.getItem(key);
  if (value == null) return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error(`No se pudieron leer los datos de demostración (${key}):`, error);
    return fallback;
  }
}

let mockSolicitudes = readStored(STORAGE_KEYS.requests, initialRequests);
let mockTransportistas = readStored(STORAGE_KEYS.carriers, carrierNames);

function saveMock(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function mockDocumentos(id) {
  const s = mockSolicitudes.find((x) => x.id === id);
  const seguro = s && s.faltante === 'seguro' ? 'faltante' : 'cargado';
  return [
    { tipo: 'Licencia de conducir', estado: 'cargado', url: null, numero: `LIC-${id}-2026` },
    { tipo: 'Permiso de circulación', estado: 'cargado', url: null, numero: `PC-${id}-2026` },
    { tipo: 'Seguro obligatorio', estado: seguro, url: null, numero: `SOAP-${id}-2026` },
  ];
}

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
  const requestItem = mockSolicitudes.find((item) => item.id === id);
  if (requestItem && !mockTransportistas.some((item) => item.rut === requestItem.rut)) {
    mockTransportistas = [{
      id: Math.max(0, ...mockTransportistas.map((item) => Number(item.id))) + 1,
      nombre: requestItem.nombre,
      rut: requestItem.rut,
      patente: requestItem.patente,
      vehiculo: requestItem.vehiculo,
      telefono: '+56 9 1234 5678',
      estado: 'Verificado',
      fechaRegistro: new Date().toISOString(),
    }, ...mockTransportistas];
    saveMock(STORAGE_KEYS.carriers, mockTransportistas);
  }
  mockSolicitudes = mockSolicitudes.filter((s) => s.id !== id);
  saveMock(STORAGE_KEYS.requests, mockSolicitudes);
  return { ok: true };
}

export async function rechazarSolicitud(id, motivo) {
  if (!USE_MOCK) {
    return request(`/api/admin/solicitudes/${id}/rechazar`, { method: 'PUT', body: JSON.stringify({ motivo }) });
  }
  await wait();
  mockSolicitudes = mockSolicitudes.filter((s) => s.id !== id);
  saveMock(STORAGE_KEYS.requests, mockSolicitudes);
  return { ok: true };
}

export async function getTransportistas({ search = '', estado = 'Todos', page = 1, pageSize = 5 } = {}) {
  if (!USE_MOCK) {
    const params = new URLSearchParams({ search, estado, page: String(page), pageSize: String(pageSize) });
    return request(`/api/admin/transportistas?${params}`);
  }

  await wait(250);
  const normalizedSearch = search.trim().toLocaleLowerCase('es-CL');
  const filtered = mockTransportistas.filter((carrier) => {
    const matchesSearch = !normalizedSearch || [carrier.nombre, carrier.rut, carrier.patente]
      .some((value) => value.toLocaleLowerCase('es-CL').includes(normalizedSearch));
    return matchesSearch && (estado === 'Todos' || carrier.estado === estado);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  return {
    items: filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    page: currentPage,
    pageSize,
    total: filtered.length,
    totalPages,
    totalTransportistas: mockTransportistas.length,
    verificados: mockTransportistas.filter((item) => item.estado === 'Verificado').length,
    activos: mockTransportistas.filter((item) => item.enRuta && item.estado === 'Verificado').length,
    calificacionPromedio: 4.8,
  };
}

export async function createTransportista(data) {
  if (!USE_MOCK) {
    return request('/api/admin/transportistas', { method: 'POST', body: JSON.stringify(data) });
  }

  await wait();
  const rut = data.rut.trim();
  const patente = data.patente.trim().toUpperCase();
  if (mockTransportistas.some((item) => item.rut === rut || item.patente === patente)) {
    throw new Error('Ya existe un transportista con ese RUT o patente.');
  }

  const carrier = {
    id: Math.max(0, ...mockTransportistas.map((item) => Number(item.id))) + 1,
    ...data,
    nombre: data.nombre.trim(),
    rut,
    patente,
    vehiculo: data.vehiculo.trim(),
    telefono: data.telefono.trim(),
    estado: 'Pendiente',
    enRuta: false,
    fechaRegistro: new Date().toISOString(),
  };
  mockTransportistas = [carrier, ...mockTransportistas];
  saveMock(STORAGE_KEYS.carriers, mockTransportistas);
  return carrier;
}

export async function updateTransportista(id, changes) {
  if (!USE_MOCK) {
    return request(`/api/admin/transportistas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    });
  }

  await wait();
  const index = mockTransportistas.findIndex((item) => item.id === id);
  if (index < 0) throw new Error('No se encontró el transportista.');

  mockTransportistas = mockTransportistas.map((item) => (
    item.id === id ? { ...item, ...changes } : item
  ));
  saveMock(STORAGE_KEYS.carriers, mockTransportistas);
  return mockTransportistas[index];
}

const ROUTES = [
  'Ancud → Puerto Montt',
  'Castro → Puerto Montt',
  'Quellón → Castro',
  'Dalcahue → Castro',
];

const reportRecords = Array.from({ length: 80 }, (_, index) => {
  const daysAgo = (index * 7) % 120;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const fare = 85000 + (index % 9) * 12500;
  const commission = Math.round(fare * 0.1);
  return {
    fecha: date.toISOString().slice(0, 10),
    viajeId: 1000 + index,
    ruta: ROUTES[index % ROUTES.length],
    transportista: carrierNames[index % carrierNames.length][0],
    tarifa: fare,
    comision: commission,
    estadoPago: index % 3 === 0 ? 'Retenido' : 'Liberado',
    calificacion: 3.8 + (index % 13) / 10,
  };
});

function periodDays(period) {
  return { '7d': 7, '30d': 30, '90d': 90, '365d': 365, all: Infinity }[period] ?? 30;
}

export async function getReportes(period = '30d') {
  if (!USE_MOCK) {
    return request(`/api/admin/reportes?periodo=${encodeURIComponent(period)}`);
  }

  await wait(250);
  const days = periodDays(period);
  const today = new Date();
  const startDate = Number.isFinite(days) ? new Date(today) : new Date(0);
  if (Number.isFinite(days)) startDate.setDate(startDate.getDate() - days);
  const current = reportRecords.filter((record) => new Date(`${record.fecha}T00:00:00`) >= startDate);
  const previousStart = new Date(startDate);
  previousStart.setDate(previousStart.getDate() - (Number.isFinite(days) ? days : 120));
  const previous = reportRecords.filter((record) => {
    const date = new Date(`${record.fecha}T00:00:00`);
    return date >= previousStart && date < startDate;
  });
  const total = (records, key) => records.reduce((sum, record) => sum + record[key], 0);
  const weekly = Array.from({ length: 4 }, (_, index) => {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (3 - index) * 7 - 6);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - (3 - index) * 7 + 1);
    const records = current.filter((record) => {
      const date = new Date(`${record.fecha}T00:00:00`);
      return date >= weekStart && date < weekEnd;
    });
    return { semana: `Sem ${index + 1}`, cantidad: records.length };
  });
  const routeCounts = new Map();
  current.forEach(({ ruta }) => routeCounts.set(ruta, (routeCounts.get(ruta) || 0) + 1));

  return {
    periodo: period,
    fletesCompletados: current.length,
    cambioFletes: Number.isFinite(days) ? current.length - previous.length : null,
    pagosRetenidos: total(current.filter((record) => record.estadoPago === 'Retenido'), 'tarifa'),
    comisiones: total(current, 'comision'),
    calificacionPromedio: current.length
      ? current.reduce((sum, record) => sum + record.calificacion, 0) / current.length
      : 0,
    fletesPorSemana: weekly,
    rutasFrecuentes: [...routeCounts.entries()]
      .map(([ruta, cantidad]) => ({ ruta, cantidad }))
      .sort((left, right) => right.cantidad - left.cantidad)
      .slice(0, 4),
    registros: current,
  };
}
