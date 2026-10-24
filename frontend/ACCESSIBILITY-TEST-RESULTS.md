# Resultados de accesibilidad y tablet

Fecha: 24-10-2026

## Revisión local

Se ejecutó axe-core 4.10.3 con las reglas WCAG 2.0/2.1 A y AA en estas vistas:

- Portada (`/`)
- Inicio de sesión (`/login`)
- Acceso administrativo (`/admin/login`)
- Selección de perfil de registro (`/registro`)
- Formulario de registro de transportista
- Formulario de registro de cliente

Las seis vistas se revisaron a 390, 640, 768, 900 y 1024 px de ancho: 30 combinaciones en total.

Se ejecutó axe-core 4.10.3 con las reglas WCAG 2.0/2.1 A y AA en estas vistas:

- Portada (`/`)
- Inicio de sesión (`/login`)
- Acceso administrativo (`/admin/login`)
- Selección de perfil de registro (`/registro`)
- Formulario de registro de transportista
- Formulario de registro de cliente

Las seis vistas se revisaron a 390, 640, 768, 900 y 1024 px de ancho: 30 combinaciones en total. Resultado local final: **0 violaciones axe-core** y **ningún desbordamiento horizontal**.

- Se observó en la captura de 768 px que las tarjetas de métricas de la portada ocupaban demasiada altura. Se ajustó su flex-basis; después del cambio cada tarjeta midió aproximadamente 90 px de alto.
- Se verificaron avisos de éxito y error del inicio de sesión usando respuestas de API simuladas. Ambos avisos se mostraron correctamente; esta prueba no sustituye una autenticación real contra la base de datos.

## Revisión de producción

Frontend: `https://sincro-carga.vercel.app/`

API: `https://sincrocarga-api.onrender.com/`

- `GET /api/health` respondió `200` con `{"status":"ok"}`.
- `GET /api/health/db` respondió `200` con `{"status":"ok","database":"connected"}`.
- `GET /api/publicaciones` respondió `200` y la portada presentó cinco publicaciones consultadas desde la API.
- En la versión desplegada no hubo desbordamiento horizontal a 390, 640, 768, 900 ni 1024 px en portada, acceso, acceso administrativo y selección de perfil.
- axe-core en producción encontró **11 incidencias de contraste en la portada**: dos textos de sección en “Así funciona”, ocho enlaces del pie de página y el copyright. También encontró **2 incidencias** en las descripciones de la pantalla de selección de perfil en `/registro`.
- axe-core no encontró incidencias en `/login`, `/admin/login` ni en los formularios de registro de cliente y transportista después de seleccionar el perfil.
- Los `401` de `/api/auth/me` observados al entrar sin sesión corresponden al usuario no autenticado; no son evidencia de un fallo de conexión de la base de datos.

La instancia publicada todavía muestra esos problemas de contraste, mientras que los ajustes realizados en este workspace no están desplegados en esa URL. Vuelve a desplegar el frontend para que las correcciones locales puedan verificarse en Vercel.

## Pendiente de completar

Las vistas protegidas de cliente, transportista y administración todavía no se recorrieron con sesiones reales. Para verificarlas se requieren cuentas de prueba autorizadas; no se deben enviar sus contraseñas por este informe ni por el chat. Tampoco se validaron en producción las operaciones que modifican información, como publicar, postular, cancelar, pagar o administrar.

Para completar esas pruebas, iniciar sesión en el navegador con los roles de prueba autorizados y repetir axe y la revisión responsive en cada vista autenticada.
