# DevOps: integración continua y verificación de producción

## Workflows (`.github/workflows/`)

### `ci.yml` — se ejecuta en cada `push` a `main`/`master`/`develop` y en cada *pull request*

| Job | Pasos | Falla si… |
|---|---|---|
| **backend** (con servicio `postgres:16`) | `npm ci` → carga `databases/bd_grupo2_sincrochiloe.sql` → `npm run db:migrate` → **segunda** ejecución de `db:migrate` (comprueba idempotencia) → `npm test` → arranca la API y consulta `/api/health` y `/api/health/db` | el DDL o una migración falla, una prueba falla, o la API no conecta a PostgreSQL |
| **frontend** | `npm ci` → `npm run lint` (oxlint) → `npm run build` (Vite) → sube `dist/` como artefacto | hay errores de lint o el build no compila |

Pruebas que ejecuta `npm test` (`node --test`, sin dependencias nuevas):
- `auth.validation.test.js` y `publicaciones.pricing.test.js` — unitarias (8).
- `schema.integration.test.js` — integración contra PostgreSQL (5): 24 tablas, ninguna FK con `NO ACTION`, `pago → viaje` en `RESTRICT`, rechazo por `CHECK`/`NOT NULL`, y que no se puede borrar un viaje con pago. Si no hay `PGHOST`/`DATABASE_URL` se omiten, así que `npm test` también funciona sin base local.

Ejecutarlo en local:

```bash
cd backend
cp .env.example .env            # ajusta PGUSER/PGPASSWORD
npm ci && npm run db:migrate && npm test
cd ../frontend && npm ci && npm run lint && npm run build
```

### `smoke-produccion.yml` — verificación de las URLs desplegadas

Manual (*Actions → Smoke test de producción → Run workflow*) y programado cada lunes. Toma las URLs de las variables del repositorio **`PROD_API_URL`** (Render) y **`PROD_FRONTEND_URL`** (Vercel) — *Settings → Secrets and variables → Actions → Variables* — o de los campos al lanzarlo a mano. Ejecuta `scripts/smoke-prod.sh`:

| Comprobación | Esperado |
|---|---|
| Frontend `GET /` | 200 |
| `GET /api/health` · `GET /api/health/db` | `status: ok` · `database: connected` (Neon accesible) |
| `GET /api/publicaciones/catalogos` · `GET /api/publicaciones` | 200 (la BD tiene datos y el esquema cargado) |
| `GET /api/no-existe` | 404 |
| `GET /api/publicaciones/mine` · `GET /api/admin/resumen` sin sesión | 401 |
| CORS con `Origin` = frontend / con origen ajeno | cabecera `Access-Control-Allow-Origin` / 403 |

También sirve desde tu máquina:

```bash
API_URL=https://<tu-api>.onrender.com FRONTEND_URL=https://<tu-sitio>.vercel.app bash scripts/smoke-prod.sh
```

> El primer request a Render (plan gratuito) puede tardar en "despertar"; el script espera hasta 60 s por petición.

## URLs de producción: estado

El repositorio **no contiene** las URLs publicadas: `README.md`, `backend/README.md` y `frontend/README.md` solo traen marcadores (`https://tu-api.onrender.com`, `https://tu-sitio.vercel.app`). Por eso no se pudo comprobar que estén funcionando desde aquí. Cuando las tengas:

1. Registra las dos URLs en el `README.md` principal (sección *Despliegue*).
2. Define las variables `PROD_API_URL` y `PROD_FRONTEND_URL` y lanza `smoke-produccion.yml`.

Checklist de configuración (tomada de los README del proyecto):

| Dónde | Variable | Valor |
|---|---|---|
| Render (backend) | `NODE_ENV` | `production` |
| Render | `DATABASE_URL` | cadena *pooled* de Neon |
| Render | `FRONTEND_ORIGINS` | origen exacto de Vercel, sin `/` final |
| Vercel (frontend) | *(archivo `frontend/vercel.json`)* | reescribe todas las rutas a `index.html`; sin él, recargar `/login` o `/publish` devuelve 404 (el router usa `BrowserRouter`) |
| Vercel (frontend) | `VITE_API_URL` | origen público del backend en Render, sin `/api` ni `/` final |
| Neon | migraciones | ejecutar `004_unique_rut.sql`, `004_admin_verification.sql` y **`005_hardening_constraints.sql`** en el SQL Editor (Render no ejecuta `db:migrate`) |

Errores típicos que detecta el smoke test: `database: unavailable` (`DATABASE_URL` mal), `403 Origen no permitido` (falta el dominio en `FRONTEND_ORIGINS`), `catalogos` vacío o 500 (esquema/migraciones no aplicados en Neon).

## Auditoría de secretos (criterio 5 y penalización de −15 pts)

Revisión de **todo el historial de Git** (todas las ramas) buscando archivos `.env`, URIs `postgres://usuario:clave@…`, dominios de Neon y contraseñas literales:

- El único archivo de entorno que alguna vez se versionó es `backend/.env.example` (solo marcadores `replace_with_…`).
- No aparecen cadenas de conexión ni contraseñas reales. Las coincidencias son mensajes de validación del formulario y datos ficticios de una prueba unitaria (`very-secure-password`).
- El frontend no contiene referencias a `localhost` (solo el proxy de desarrollo de `vite.config.js`, que no se incluye en el build) ni datos simulados.

Si en algún momento una clave real llegara a subirse, hay que **rotarla** (cambiar la contraseña en Neon), no solo borrar el archivo: el historial la conserva.
