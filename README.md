# SincroCarga

**Plataforma web de matching logístico para Chiloé.** Conecta camiones con espacio disponible y empresas con carga por transportar, para reducir los viajes de retorno vacíos, los costos de combustible y peajes (Pargua–Chacao) y la coordinación manual por WhatsApp.

Proyecto Web Integrador · Tecnologías Web y Móviles (6° semestre) · Ingeniería Civil en Informática · Universidad de Los Lagos, Campus Chiloé.

---

## 1. Enlaces y estado

| Elemento | Enlace |
|---|---|
| Repositorio | https://github.com/fatekiDev/SincroCarga-ProyectoWeb |
| Frontend (Vercel) | `[COMPLETAR: URL pública HTTPS]` |
| Backend (Render) | `https://sincrocarga-api.onrender.com` `[CONFIRMAR]` |
| Verificación de la API | `<URL del backend>/api/health/db` → `{ "status": "ok", "database": "connected" }` |
| Base de datos | PostgreSQL 16 gestionado en Neon (la cadena de conexión vive solo en la variable `DATABASE_URL` de Render) |
| Dossier técnico | `docs/` y el PDF de la entrega |

> El backend corre en el plan gratuito de Render: la primera petición tras un período de inactividad puede tardar hasta ~60 s en "despertar" la instancia.

### Equipo

| Integrante | Rol declarado |
|---|---|
| Benjamin Concha Monsalves | Backend y despliegue |
| Francisco Kroff Inzunza | Base de datos y DevOps |
| José Guanel Vera | Frontend |
| Vicente Garin Pereda | QA y documentación |

---

## 2. Alcance real y modo demostración

| Funcionalidad | Estado | Detalle |
|---|---|---|
| Registro, inicio de sesión y roles (cliente, camionero, admin) | Real | Cuentas, sesiones y contraseñas (hash bcrypt) en PostgreSQL |
| Publicar carga, cotizar y postular | Real | Todo persiste en PostgreSQL; la tarifa se calcula en el servidor |
| Panel de administración | Real | Los 9 endpoints `/api/admin/*` consultan y actualizan PostgreSQL |
| Pago | **Demostración** | Pago simulado, sin pasarela: se registra en la tabla `pago` (comisión e IVA) pero no mueve dinero. Está rotulado en la interfaz |
| Seguimiento con mapa | **Demostración** | Sin GPS: la posición del marcador avanza en memoria; los estados del viaje sí vienen de la base de datos |
| Verificación de documentos del conductor | Parcial | Los archivos se eligen en el navegador y no se almacenan; el estado (Pendiente, Verificado, Rechazado) sí se persiste y lo gestiona el administrador |
| Creación de `match` y `viaje` | Parcial | La API los lee y actualiza, pero no los crea; para la demostración se cargan por SQL |
| Tablas `comunicacion` y `notificacion` | Sin uso | Existen en el modelo; el backend aún no las utiliza |

---

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite, React Router 7, Leaflet / react-leaflet, jsPDF, lucide-react, oxlint |
| Backend | Node.js (ES Modules), Express 5, cookie-parser, cors, express-rate-limit, bcryptjs, dotenv, `pg` (pool) |
| Base de datos | PostgreSQL 16, esquema `bd_grupo2_sincrochiloe`, migraciones 001 a 005 |
| Despliegue | Vercel (frontend), Render (backend), Neon (PostgreSQL) |
| Calidad | `node:test` (15 pruebas), GitHub Actions (integración continua y verificación de producción) |

---

## 4. Arquitectura N-capas

El backend es un servidor Express con una responsabilidad por carpeta. El frontend consume la API con `fetch` (`credentials: "include"`) y la sesión viaja en una cookie `HttpOnly`.

```
React (frontend/src)  →  fetch + cookie
   └─ Middleware global (server.js: origen, CORS, JSON 32 kb, cookie-parser, errores)
       └─ Rutas        backend/src/routes        método + ruta + middlewares de sesión y rol
           └─ Controladores  backend/src/controllers  validan la petición y definen el código HTTP
               └─ Servicios      backend/src/services     reglas de negocio (validación, tarifa, hash, comisión/IVA)
                   └─ Modelos        backend/src/models       SQL parametrizado y transacciones
                       └─ PostgreSQL (pool en backend/src/db)  →  JSON { data } / { error }
```

Diagrama completo del ciclo de una petición (`POST /api/publicaciones`): [`docs/flujo-peticion.md`](docs/flujo-peticion.md) y [`docs/img/flujo-peticion.png`](docs/img/flujo-peticion.png).

![Ciclo de una petición](docs/img/flujo-peticion.png)

> El módulo de administración no tiene capa de servicios propia: su controlador valida los parámetros y llama directamente al modelo.

### Decisiones de seguridad

- **Sesión:** cookie `sincrocarga_session` HttpOnly de 7 días (`Secure` y `SameSite=None` en producción). En la base solo se guarda el hash del token (`usuario_sesion.token_hash`).
- **Contraseñas:** bcrypt con 12 rondas; mínimo 12 caracteres y máximo 72 bytes.
- **Autorización por rol en el servidor** (`requireRole`); el propietario del recurso sale de la sesión, nunca del cuerpo. Las operaciones del camionero exigen cuenta verificada y activa.
- **Límite de intentos:** 10 logins cada 15 minutos (responde 429).
- **CORS:** lista blanca en `FRONTEND_ORIGINS`; en producción un origen no listado recibe 403.
- **Entrada:** cuerpo JSON limitado a 32 kb, validación en servidor y consultas SQL parametrizadas.
- **Errores:** el manejador global traduce errores de PostgreSQL (23505 → 409; 23502/22001/22003/22007/22P02/23514 → 400; 23503 → 404) y responde 500 con mensaje genérico, sin filtrar trazas.
- **Tarifa:** se recalcula siempre en el servidor (peso facturable = máx(peso real, volumen × 250 kg/m³); primer tramo de 1.000 kg; +15 % por tramo adicional; recargo de cruce marítimo aparte). Los parámetros son orientativos y deben calibrarse con costos reales.

---

## 5. Modelo de datos

24 tablas (21 del DDL base + `usuario`, `usuario_sesion` y `rut_registrado`), 31 claves foráneas sin `NO ACTION`. Los registros financieros y de historial usan `ON DELETE RESTRICT`; los hijos puramente dependientes usan `CASCADE`. Hay `CHECK` de estados, positividad y coherencia de fechas, y restricciones `EXCLUDE` que impiden solapar períodos.

![Diagrama ER](docs/img/diagrama-er.png)

- Diagrama completo: [`docs/diagrama-er.md`](docs/diagrama-er.md) y [`docs/img/diagrama-er.svg`](docs/img/diagrama-er.svg) (vectorial).
- Revisión de restricciones y hallazgos abiertos: [`docs/revision-restricciones.md`](docs/revision-restricciones.md).

| Dominio | Tablas |
|---|---|
| Catálogos y tarifas | `tipo_cliente`, `tipo_carga`, `cruce_maritimo`, `ruta`, `tarifa_referencial` |
| Actores y flota | `cliente`, `transportista`, `camion`, `chofer`, `camion_tipo_carga` |
| Flujo operativo | `carga`, `publicacion_carga`, `publicacion_transporte`, `postulacion`, `match`, `viaje`, `pago` |
| Interacción e historial | `calificacion`, `comunicacion`, `historial_cumplimiento`, `notificacion` |
| Autenticación | `usuario`, `usuario_sesion`, `rut_registrado` |

### Migraciones (`databases/migrations`, orden fijado en `backend/src/db/migrate.js`)

| Archivo | Contenido |
|---|---|
| `001_authentication.sql` | `usuario` y `usuario_sesion` |
| `002_unique_trip_rating.sql` | Una calificación por viaje y emisor |
| `003_simulated_payments.sql` | Tabla `pago` (tarifa, comisión, IVA, total) |
| `004_unique_rut.sql` | `rut_registrado`: unicidad del RUT normalizado |
| `004_admin_verification.sql` | Rol admin y estado de verificación del transportista |
| `005_hardening_constraints.sql` | `ON DELETE RESTRICT` explícito, 14 `NOT NULL` y 8 `CHECK` |

---

## 6. API REST

La API usa JSON. Las respuestas exitosas tienen la forma `{ "data": … }` (salvo el cierre de sesión, que también puede devolver `{ "message": … }`); los errores usan `{ "error": "mensaje" }` y pueden incluir `details` cuando hay errores de validación. Códigos principales: 200, 201, 400, 401, 403, 404, 409, 429, 500 y 503. Las rutas protegidas reciben la cookie de sesión `sincrocarga_session`. Los `DELETE` de negocio son borrados lógicos: cambian estados y preservan el historial.

En las tablas, `:id`, `:viajeId`, `:publicacionId` y `:postulacionId` son parámetros de ruta. Las rutas bajo los prefijos indicados se muestran con la ruta completa para que el contrato sea directamente consultable.

### Salud y autenticación

| Método y ruta | Acceso | Especificación |
|---|---|---|
| `GET /api/health` | Público | Confirma que la API está activa. |
| `GET /api/health/db` | Público | Comprueba conexión con PostgreSQL. |
| `POST /api/auth/register` | Público | Registra un perfil de cliente o camionero; almacena el hash de contraseña y crea sesión. |
| `POST /api/auth/login` | Público; máximo 10 intentos cada 15 min | Recibe correo y contraseña; valida credenciales y crea sesión. |
| `GET /api/auth/me` | Sesión | Devuelve la cuenta asociada a la cookie de sesión. |
| `POST /api/auth/logout` | Sesión | Invalida la sesión y elimina la cookie. |
| `DELETE /api/auth/session` | Sesión | Equivalente a `POST /api/auth/logout`. |

### Publicaciones y cotización

| Método y ruta | Acceso | Especificación |
|---|---|---|
| `GET /api/publicaciones` | Público | Lista publicaciones con estado `Disponible`. |
| `GET /api/publicaciones/catalogos` | Público | Devuelve tipos de carga y rutas disponibles. |
| `POST /api/publicaciones/cotizacion` | Público | Cotiza según `tipoCargaId`, `rutaId`, `pesoKg` y `volumenM3`; la tarifa se calcula en el servidor. |
| `GET /api/publicaciones/:id` | Público | Obtiene una publicación por identificador. |
| `GET /api/publicaciones/mine` | Cliente | Lista las publicaciones propias. |
| `POST /api/publicaciones` | Cliente | Crea carga y publicación en una transacción. Recibe `tipoCargaId`, `descripcion`, `pesoKg`, `volumenM3`, `valorDeclarado`, `rutaId` y `fechaLimitePostulacion`; el servidor recalcula la tarifa. |
| `PUT /api/publicaciones/:id` | Cliente | Reemplaza los campos editables de una publicación propia que siga `Disponible`; usa los mismos campos de creación. |
| `POST /api/publicaciones/:id/cancelar` | Cliente | Cancela una publicación propia que siga `Disponible`, sin borrar el registro. |
| `DELETE /api/publicaciones/:id` | Cliente | Equivalente de borrado lógico a `POST …/:id/cancelar`. |

El peso facturable es el mayor entre el peso real y el volumen multiplicado por 250 kg/m³. La tarifa referencial cubre el primer tramo de 1.000 kg; cada tramo adicional iniciado suma 15% de esa tarifa y se agrega el cruce marítimo cuando corresponde. El cuerpo de creación/edición, fechas válidas, validaciones y respuestas se detallan en [`backend/README.md`](backend/README.md).

### Seguimiento y calificaciones

| Método y ruta | Acceso | Especificación |
|---|---|---|
| `GET /api/seguimiento/activo` | Cliente | Obtiene el viaje activo, su ruta y el historial de cumplimiento. |
| `GET /api/seguimiento/revision` | Cliente | Obtiene el viaje más reciente y la calificación registrada, si existe. |
| `POST /api/seguimiento/:viajeId/incidencias` | Cliente | Registra una incidencia del viaje en el historial de cumplimiento. |
| `POST /api/seguimiento/:viajeId/confirmar-recepcion` | Cliente | Confirma la recepción, completa el viaje y registra el evento en el historial. |
| `POST /api/seguimiento/:viajeId/calificacion` | Cliente | Registra una calificación de 1 a 5 estrellas; es idempotente por viaje y cliente. |

El estado del viaje y el historial provienen de PostgreSQL. La posición del marcador del mapa es solo demostrativa; no hay seguimiento GPS.

### Pagos de demostración

| Método y ruta | Acceso | Especificación |
|---|---|---|
| `GET /api/pagos/actual` | Cliente | Devuelve el viaje aceptado, la tarifa, la factura y el estado del pago simulado. |
| `POST /api/pagos/:viajeId/simular` | Cliente | Registra la simulación de pago si el cliente acepta los términos. |

No se conecta con una pasarela ni se mueve dinero real. La comisión demo es 10% por defecto (configurable con `SINCROCARGA_COMMISSION_PERCENT`) y el IVA demo es 19% sobre la comisión.

### Operaciones del transportista

Todas las rutas requieren sesión con rol `camionero`; para operar, el transportista debe estar verificado y activo.

| Método y ruta | Especificación |
|---|---|
| `GET /api/transportista/catalogos` | Devuelve rutas y camiones activos propios. |
| `GET /api/transportista/cargas` | Lista cargas disponibles para la flota y omite aquellas con postulación propia. |
| `POST /api/transportista/cargas/:publicacionId/postular` | Registra o reenvía una postulación con tarifa propuesta y comentario. |
| `GET /api/transportista/postulaciones` | Lista postulaciones propias y el viaje asociado, si existe. |
| `POST /api/transportista/postulaciones/:postulacionId/retirar` | Retira una postulación propia pendiente. |
| `DELETE /api/transportista/postulaciones/:postulacionId` | Equivalente de borrado lógico a retirar la postulación. |
| `GET /api/transportista/espacios` | Lista publicaciones propias de capacidad disponible. |
| `POST /api/transportista/espacios` | Publica capacidad asociada a un camión activo, una ruta y un rango de fechas. |
| `POST /api/transportista/espacios/:publicacionId/cancelar` | Cancela una publicación propia de capacidad disponible. |
| `DELETE /api/transportista/espacios/:publicacionId` | Equivalente de borrado lógico a cancelar la publicación de capacidad. |
| `GET /api/transportista/viajes` | Lista viajes asociados a postulaciones propias, con estado y recorrido. |

La API comprueba capacidad del camión y vigencia de la licencia antes de aceptar postulaciones. Los recorridos son referenciales; la base no almacena coordenadas GPS. Los campos y reglas de validación de cada cuerpo se especifican en [`backend/README.md`](backend/README.md).

### Administración

Todas las rutas requieren sesión con rol `admin`.

| Método y ruta | Especificación |
|---|---|
| `GET /api/admin/resumen` | Devuelve métricas de solicitudes, transportistas, fletes y pagos. |
| `GET /api/admin/fletes-activos` | Lista viajes en progreso. |
| `GET /api/admin/solicitudes` | Lista solicitudes de verificación de transportistas. |
| `GET /api/admin/solicitudes/:id` | Obtiene el detalle de una solicitud. |
| `PUT /api/admin/solicitudes/:id/aprobar` | Aprueba una solicitud de verificación. |
| `PUT /api/admin/solicitudes/:id/rechazar` | Rechaza una solicitud; recibe `{ "motivo": "…" }`. |
| `GET /api/admin/transportistas` | Lista transportistas; admite búsqueda, estado, página y tamaño de página. |
| `PATCH /api/admin/transportistas/:id` | Actualiza el estado de verificación y/o teléfono. |
| `GET /api/admin/reportes` | Devuelve reportes por período (`7d`, `30d`, `90d`, `365d` o `all`). |

La especificación complementaria de cuerpos, parámetros, validaciones y códigos HTTP está en [`backend/README.md`](backend/README.md). Las equivalencias de `DELETE` y el comportamiento de borrado lógico están en [`docs/api-delete.md`](docs/api-delete.md).

---

## 7. Puesta en marcha local

Requisitos: Node.js 20 o superior y PostgreSQL.

1. Crear la base `bd_grupo2_sincrochiloe` y cargar `databases/bd_grupo2_sincrochiloe.sql` (pgAdmin o `psql`).
2. Backend: `cd backend`, copiar `.env.example` a `.env`, completar `PGUSER` y `PGPASSWORD` locales y ejecutar `npm install`.
3. Aplicar migraciones: `npm run db:migrate` (001 a 005, idempotentes).
4. Crear el administrador (opcional): definir `ADMIN_EMAIL`, `ADMIN_NAME` y `ADMIN_PASSWORD` solo en el entorno de la terminal y ejecutar `npm run admin:create`. Ingreso en `/admin/login`.
5. Levantar la API: `npm run dev` (puerto 3000) y comprobar `http://localhost:3000/api/health/db`.
6. Frontend, en otra terminal: `cd frontend`, `npm install`, `npm run dev` (puerto 5173; Vite reenvía `/api` al backend).
7. Pruebas del backend: `cd backend && npm test`.

### Variables de entorno

Documentadas en [`backend/.env.example`](backend/.env.example): `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `FRONTEND_ORIGINS`, `PORT`, `SINCROCARGA_COMMISSION_PERCENT` y `ADMIN_*`. En producción se usa `DATABASE_URL` y `NODE_ENV=production`. El frontend usa `VITE_API_URL` (URL pública del backend, sin `/` final). Los archivos `.env` están en `.gitignore`; nunca se suben credenciales reales.

---

## 8. Despliegue

| Servicio | Configuración |
|---|---|
| Neon (PostgreSQL) | Cadena *pooled* en `DATABASE_URL`. Render **no** ejecuta `db:migrate`: las migraciones se aplican en el editor SQL de Neon (con una branch de respaldo antes) |
| Render (backend) | `NODE_ENV=production`, `DATABASE_URL`, `FRONTEND_ORIGINS` = origen exacto de Vercel sin `/` final |
| Vercel (frontend) | `VITE_API_URL` = URL pública del backend; `frontend/vercel.json` reescribe las rutas a `index.html` (SPA con `BrowserRouter`) |

---

## 9. Calidad e integración continua

- `.github/workflows/ci.yml`: en cada push y pull request levanta PostgreSQL 16, instala dependencias (`npm ci`), carga el esquema base, aplica las migraciones dos veces (idempotencia), corre las pruebas, verifica los health checks y hace lint y build del frontend.
- `.github/workflows/smoke-produccion.yml` y `scripts/smoke-prod.sh`: comprueban las URLs desplegadas (`PROD_API_URL`, `PROD_FRONTEND_URL`).
- Pruebas (15): validación de registro y RUT, cálculo de tarifa, verbos HTTP de las rutas y 5 pruebas de integración de esquema (se omiten si no hay PostgreSQL configurado; en CI sí se ejecutan).

---

## 10. Documentación técnica adicional

| Documento | Contenido |
|---|---|
| [`docs/diagrama-er.md`](docs/diagrama-er.md) | ER del esquema físico |
| [`docs/revision-restricciones.md`](docs/revision-restricciones.md) | `ON DELETE`, `CHECK`, `NOT NULL` y hallazgos abiertos |
| [`docs/flujo-peticion.md`](docs/flujo-peticion.md) | React → ruta → servicio → modelo → SQL → JSON |
| [`docs/api-delete.md`](docs/api-delete.md) | Verbos `DELETE` y borrado lógico |
| [`docs/devops-ci.md`](docs/devops-ci.md) | Workflows y verificación de producción |
| [`backend/README.md`](backend/README.md) · [`frontend/README.md`](frontend/README.md) | Guías por módulo |
