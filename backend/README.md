# Backend de SincroCarga

API REST construida con Express y PostgreSQL.

## Configuración local

1. Copia `.env.example` a `.env` dentro de `backend`.
2. Completa `PGUSER` y `PGPASSWORD` con el usuario local de PostgreSQL. No
   compartas ni subas el archivo `.env`.
3. Desde esta carpeta ejecuta:

   ```bash
   npm install
   npm run db:migrate
   npm run dev
   ```

Las migraciones `001_authentication.sql`, `002_unique_trip_rating.sql`,
`003_simulated_payments.sql` y `004_unique_rut.sql` añaden autenticación,
unicidad de calificaciones, almacenamiento del pago de demostración y unicidad
de RUT. Ejecuta
`npm run db:migrate` una vez después de cargar el esquema base.

4. Comprueba la conexión con `http://localhost:3000/api/health/db`.
5. En otra terminal, inicia el frontend desde `../frontend` con `npm run dev`.
   Vite reenvía las peticiones `/api` al backend local.
6. Registra una cuenta con datos de prueba desde la página «Registrarse».
7. Lista publicaciones en `http://localhost:3000/api/publicaciones` o en la
   sección «Cargas disponibles» del frontend.

La API necesita que la base indicada por `PGDATABASE` tenga cargado el esquema
del proyecto. El endpoint de publicaciones devuelve solo datos de carga, ruta y
tarifa; no incluye datos identificables de clientes.

## Endpoints

- `GET /api/health`: comprueba que la API está activa.
- `GET /api/health/db`: comprueba la conexión con PostgreSQL.
- `GET /api/publicaciones/catalogos`: lista tipos de carga y rutas disponibles.
- `POST /api/publicaciones/cotizacion`: cotiza según la tarifa referencial vigente
  para ruta/tipo, el peso y volumen de la carga; suma el cruce marítimo cuando
  corresponde.
- `POST /api/auth/register`: registra un perfil cliente o empresa/conductor/
  camión, guarda un hash de contraseña y crea una sesión.
- `POST /api/auth/login`: valida correo y contraseña y crea una sesión.
- `GET /api/auth/me`: devuelve la cuenta asociada a la cookie de sesión.
- `POST /api/auth/logout`: invalida la sesión y elimina la cookie.
- `GET /api/publicaciones`: lista publicaciones con estado `Disponible`.
- `GET /api/publicaciones/mine`: lista las publicaciones del cliente autenticado.
- `GET /api/publicaciones/:id`: obtiene una publicación por id.
- `POST /api/publicaciones`: crea una carga y su publicación en una transacción.
- `PUT /api/publicaciones/:id`: reemplaza los datos de una publicación propia que
  siga `Disponible`, en una transacción.
- `POST /api/publicaciones/:id/cancelar`: cancela una publicación propia que siga
  `Disponible` sin eliminar su historial.
- `GET /api/seguimiento/activo`: obtiene el viaje activo del cliente, conductor,
  ruta e historial de cumplimiento.
- `POST /api/seguimiento/:viajeId/incidencias`: registra un problema reportado
  por el cliente en `historial_cumplimiento`.
- `GET /api/seguimiento/revision`: obtiene el viaje más reciente del cliente,
  junto con la calificación ya registrada, si existe.
- `POST /api/seguimiento/:viajeId/confirmar-recepcion`: marca el viaje como
  completado y agrega el evento de recepción al historial.
- `POST /api/seguimiento/:viajeId/calificacion`: guarda una calificación de 1 a
  5 estrellas y sus etiquetas/comentario; es idempotente por viaje y cliente.
- `GET /api/pagos/actual`: devuelve el viaje aceptado, la factura y el estado
  del pago demo del cliente.
- `POST /api/pagos/:viajeId/simular`: inicia el pago de demostración después de
  validar la aceptación de términos.
- `GET /api/pagos/actual`: devuelve tarifa aceptada, costos, facturación y estado
  del pago simulado del viaje del cliente.
- `POST /api/pagos/:viajeId/simular`: registra una simulación de pago si el
  cliente acepta los términos.
- `GET /api/transportista/catalogos`: obtiene rutas y camiones activos propios.
- `GET /api/transportista/cargas`: lista cargas disponibles para la flota del
  transportista autenticado y omite las que ya tienen una postulación propia.
- `POST /api/transportista/cargas/:publicacionId/postular`: registra o vuelve a
  enviar una postulación con tarifa y comentario.
- `GET /api/transportista/postulaciones`: lista postulaciones propias y el viaje
  asociado cuando ya existe.
- `POST /api/transportista/postulaciones/:postulacionId/retirar`: retira una
  postulación propia que siga pendiente.
- `GET /api/transportista/espacios`: lista publicaciones de capacidad propias.
- `POST /api/transportista/espacios`: publica capacidad disponible asociada a un
  camión activo, una ruta y un rango de fechas.
- `POST /api/transportista/espacios/:publicacionId/cancelar`: cancela una
  publicación propia que siga disponible.
- `GET /api/transportista/viajes`: lista los viajes vinculados a postulaciones
  propias, con su estado y recorrido.

Todos los endpoints de `/api/transportista` requieren sesión activa con rol
`camionero`. La API determina el transportista desde la sesión, valida que su
camión tenga capacidad suficiente y que cuente con licencia de conducir vigente
antes de permitir una postulación. Los recorridos de mapa son referenciales: la
base no registra GPS para el camión. La carga de documentos aún no tiene un
endpoint de almacenamiento y la selección desde el frontend permanece local.

El registro de cliente solicita tipo, nombre/razón social, RUT en formato
`XX.XXX.XXX-X` con dígito verificador válido, teléfono,
correo y contraseña. El de camionero solicita datos de la empresa, conductor,
licencia y camión. El correo de acceso debe ser único. La contraseña debe tener
al menos 12 caracteres.

`POST /api/publicaciones`, `GET /api/publicaciones/mine`,
`PUT /api/publicaciones/:id` y `POST /api/publicaciones/:id/cancelar` requieren
una sesión activa con rol cliente. La API obtiene el cliente propietario desde
la sesión; el cliente no puede elegir otro propietario en el cuerpo. La edición
y cancelación solo se permiten mientras la publicación siga `Disponible`.

`POST` y `PUT` requieren `tipoCargaId`, `descripcion`, `pesoKg`, `volumenM3`,
`valorDeclarado` (número o `null`), `rutaId`, `fechaLimitePostulacion`
(`YYYY-MM-DD`, actual o futura), `pesoKg` y `volumenM3`. La cotización usa la
tarifa referencial vigente para la combinación de ruta y tipo de carga. Calcula
el peso facturable como el mayor entre el peso real y el volumen multiplicado
por 250 kg/m³; la tarifa referencial cubre el primer tramo de 1.000 kg y cada
tramo adicional iniciado suma un 15% de esa tarifa. Al final agrega la tarifa
del cruce si la ruta tiene uno e informa el peso facturable y la distancia.
El servidor recalcula este importe al crear o editar la publicación; no confía
en el valor de `tarifaOfrecida` enviado por el navegador.

El seguimiento requiere una sesión de cliente y devuelve solo un viaje con estado
`En Progreso` que pertenezca a esa cuenta. El historial se lee de
`historial_cumplimiento`. La base actual no almacena coordenadas GPS; por eso la
posición y las etapas del mapa llevan la etiqueta «Modo demostración». El marcador
avanza en memoria y la UI consulta el endpoint cada cinco segundos. Cuando la ruta
tiene cruce, «Esperando barcaza» es una etapa propia y muestra
`cruce_maritimo.duracion_estimada_min`; esos tiempos se muestran como referencia,
no como ubicación en vivo.

El cierre y la reseña requieren sesión de cliente y comprueban la propiedad del
viaje. La confirmación se protege con bloqueo transaccional; la migración añade
un índice único por viaje/emisor para impedir duplicados incluso tras recargar.
El importe parte de `postulacion.tarifa_propuesta`; la comisión demo es 10% por
defecto y se configura con `SINCROCARGA_COMMISSION_PERCENT`. El IVA demo (19%) se
calcula sobre la comisión. Confirma ambos porcentajes con negocio/contabilidad
antes de facturar clientes reales.

Los estados de pago demo son `Procesando`, `Retenido` y `Liberado`; el backend
avanza a `Retenido` tras dos segundos y la confirmación de recepción lo cambia a
`Liberado`. No existe una pasarela ni movimiento bancario real, y el esquema no
respalda un reembolso automático del 100%. La UI y el comprobante lo indican.
La tarifa base se toma de `postulacion.tarifa_propuesta`; la comisión es 10% por
defecto (`SINCROCARGA_COMMISSION_PERCENT`) y el IVA demo es 19% sobre la comisión.
Valida ambos criterios con negocio/contabilidad antes de emitir facturas reales.

Ejemplo de cuerpo para `POST`:

```json
{
  "tipoCargaId": 1,
  "descripcion": "Carga de prueba",
  "pesoKg": 600,
  "volumenM3": 4,
  "valorDeclarado": null,
  "rutaId": 1,
  "fechaLimitePostulacion": "2027-12-31",
  "tarifaOfrecida": 75000
}
```

El `PUT /api/publicaciones/:id` reemplaza los campos editables de la carga y
publicación asociadas; no cambia el cliente propietario.

Aunque las rutas de escritura y autenticación ya están implementadas, el
despliegue sigue siendo solo local. Antes de producción configura HTTPS, origen
permitido y cookies para los dominios de frontend/backend; añade verificación
de correo y recuperación de contraseña, y confirma las medidas de privacidad
para RUT, teléfonos y licencias.

## Despliegue del backend en Render

Crear un Web Service conectado al repositorio con:

- **Root Directory:** `backend`
- **Build Command:** `npm ci`
- **Start Command:** `npm start`

Configurar estas variables en Render (no guardarlas en el repositorio):

- `NODE_ENV`: `production`
- `DATABASE_URL`: cadena de conexión **pooled** de Neon para
  `bd_grupo2_sincrochiloe` (incluir SSL tal como la entrega Neon)
- `FRONTEND_ORIGINS`: origen exacto del frontend publicado, por ejemplo
  `https://tu-sitio.vercel.app`; separar con comas los dominios adicionales
  autorizados, sin rutas ni `/` final

Render proporciona `PORT` automáticamente. No hace falta configurar `PGHOST`,
`PGUSER` ni `PGPASSWORD` cuando se usa `DATABASE_URL`. No ejecutar
`npm run db:migrate` en Render: la migración se aplica una sola vez a Neon desde
el SQL Editor. Antes de habilitar registros en producción, ejecuta allí el
contenido de `../databases/migrations/004_unique_rut.sql`.

La API exige HTTPS para cookies seguras y solo permite los orígenes indicados en
`FRONTEND_ORIGINS`. La URL del backend debe usarse en `VITE_API_URL` al compilar
el frontend en Vercel.
