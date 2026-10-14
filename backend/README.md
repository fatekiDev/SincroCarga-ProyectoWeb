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

La migración `../databases/migrations/001_authentication.sql` es aditiva: añade
las tablas de usuarios/sesiones y el tipo de vehículo sin eliminar los datos
existentes. Ejecuta `npm run db:migrate` una vez después de cargar el esquema
base.

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
- `POST /api/auth/register`: registra un perfil cliente o empresa/conductor/
  camión, guarda un hash de contraseña y crea una sesión.
- `POST /api/auth/login`: valida correo y contraseña y crea una sesión.
- `GET /api/auth/me`: devuelve la cuenta asociada a la cookie de sesión.
- `POST /api/auth/logout`: invalida la sesión y elimina la cookie.
- `GET /api/publicaciones`: lista publicaciones con estado `Disponible`.
- `GET /api/publicaciones/:id`: obtiene una publicación por id.
- `POST /api/publicaciones`: crea una carga y su publicación en una transacción.
- `PUT /api/publicaciones/:id`: reemplaza los datos editables de la carga y
  publicación asociadas en una transacción.

El registro de cliente solicita tipo, nombre/razón social, RUT, teléfono,
correo y contraseña. El de camionero solicita datos de la empresa, conductor,
licencia y camión. El correo de acceso debe ser único. La contraseña debe tener
al menos 12 caracteres.

`POST /api/publicaciones` y `PUT /api/publicaciones/:id` requieren una sesión
activa con rol cliente. La API obtiene el cliente propietario desde la sesión;
el cliente no puede elegir otro propietario en el cuerpo. `PUT` solo modifica
publicaciones que pertenecen a esa cuenta.

`POST` requiere `tipoCargaId`, `descripcion`, `pesoKg`, `volumenM3`,
`valorDeclarado` (número o `null`), `rutaId`, `fechaLimitePostulacion`
(`YYYY-MM-DD`) y `tarifaOfrecida`. `PUT` requiere esos datos y además `estado`.

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
el SQL Editor.

La API exige HTTPS para cookies seguras y solo permite los orígenes indicados en
`FRONTEND_ORIGINS`. La URL del backend debe usarse en `VITE_API_URL` al compilar
el frontend en Vercel.
