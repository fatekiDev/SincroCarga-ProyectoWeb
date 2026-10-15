# Frontend de SincroCarga

Aplicación web de SincroCarga construida con React y Vite.

## Instalación y ejecución

Desde la carpeta raíz del repositorio:

```bash
cd frontend
npm install
npm run dev
```

Vite mostrará en la terminal la dirección local de la aplicación. Mantén esa
terminal abierta mientras trabajas en el frontend.

## Otros comandos

```bash
npm run build
npm run lint
```

## Autenticación local

El registro y el inicio de sesión usan la API de Express del directorio
`../backend`. Las contraseñas se envían al backend por HTTPS en producción y se
guardan como hash; la sesión usa una cookie `HttpOnly`. En desarrollo, Vite
reenvía `/api` a `http://localhost:3000`.

Inicia primero el backend y aplica la migración descrita en
`../backend/README.md`. Esta configuración todavía es para desarrollo local;
antes de desplegarla hay que configurar el dominio permitido, HTTPS, CORS y
cookies para el hosting, y revisar las obligaciones de protección de los datos
personales recopilados.

## Panel de administración

Con una sesión iniciada, visita `/admin`. Las pestañas de Solicitudes,
Transportistas y Reportes incluyen vista previa de documentos, revisión de
conductores, búsqueda/filtros/paginación, métricas por período y descarga CSV.
El modo actual es de demostración: los registros de transportistas y solicitudes
se guardan en el almacenamiento local del navegador, y los documentos y reportes
son datos de ejemplo; no se escriben en PostgreSQL ni se almacenan archivos.

No configures `VITE_ADMIN_MOCK=false` esperando persistencia real: los endpoints
administrativos aún no están implementados en el backend. La aplicación deberá
añadir autorización administrativa y almacenamiento seguro de documentos antes
de usar estas vistas con datos reales.

## Despliegue en Vercel

Configura `VITE_API_URL` como el origen público del backend de Render, por
ejemplo `https://tu-api.onrender.com` (sin `/api` ni `/` final), antes de
construir el frontend. Añade el origen exacto de Vercel a `FRONTEND_ORIGINS` en
Render. El backend usa cookies `HttpOnly`, `Secure` y `SameSite=None` en
producción para permitir la sesión entre dominios.
