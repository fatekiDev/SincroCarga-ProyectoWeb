# Endpoints `DELETE`

## Estado actual: la API expone `DELETE` con borrado lógico

Además de los `POST` originales (que usa el frontend y se conservan), `backend/src/routes` expone cuatro verbos `DELETE`. Reutilizan el mismo controlador y modelo que su `POST` equivalente, por lo que **no borran filas de negocio**: cambian el estado del registro. Responden `200 { "data": … }` (o `{ "message": … }` en el cierre de sesión), `400` si el id es inválido y, según el endpoint, `404` (publicación de carga: no existe, no es del cliente o ya no está `Disponible`) o `409` (postulación o espacio del transportista cuyo estado ya no lo permite). La prueba `backend/test/routes.methods.test.js` verifica que existan.

| Verbo | Equivale a | Rol |
|---|---|---|
| `DELETE /api/publicaciones/:id` | `POST /api/publicaciones/:id/cancelar` | cliente |
| `DELETE /api/transportista/postulaciones/:postulacionId` | `POST …/postulaciones/:postulacionId/retirar` | camionero verificado |
| `DELETE /api/transportista/espacios/:publicacionId` | `POST …/espacios/:publicacionId/cancelar` | camionero verificado |
| `DELETE /api/auth/session` | `POST /api/auth/logout` | sesión |

### Operaciones de "eliminación" que sí existen

| Operación | Endpoint | Rol | Qué hace en la base | Reversible |
|---|---|---|---|---|
| Cancelar publicación de carga | `POST /api/publicaciones/:id/cancelar` | cliente | `UPDATE publicacion_carga SET estado = 'Cancelada'` (solo si está `Disponible` y es del cliente) | No desde la API; el registro se conserva |
| Retirar postulación | `POST /api/transportista/postulaciones/:postulacionId/retirar` | camionero verificado | `UPDATE postulacion` (solo si está pendiente y es propia) | Se puede volver a postular |
| Cancelar publicación de capacidad | `POST /api/transportista/espacios/:publicacionId/cancelar` | camionero verificado | `UPDATE publicacion_transporte SET estado = 'Cancelada'` | No |
| Cerrar sesión | `POST /api/auth/logout` | cualquiera | `DELETE FROM usuario_sesion WHERE token_hash = $1` y borra la cookie | — |
| Suspender / rechazar transportista | `PATCH /api/admin/transportistas/:id`, `PUT /api/admin/solicitudes/:id/rechazar` | admin | `UPDATE transportista` (`activo = FALSE`, `estado_verificacion`) | Sí, vía `PATCH` |

Ninguna operación borra filas de negocio (`carga`, `publicacion_*`, `postulacion`, `viaje`, `pago`). Esto es coherente con las FK `RESTRICT` de la migración 005: un `DELETE` físico sobre datos con historial es rechazado por la base (ver [`revision-restricciones.md`](revision-restricciones.md)).

### Inventario completo de métodos HTTP

| Prefijo | GET | POST | PUT | PATCH | DELETE |
|---|---|---|---|---|---|
| `/api/auth` | `/me` | `/register`, `/login`, `/logout` | — | — | `/session` |
| `/api/publicaciones` | `/`, `/catalogos`, `/mine`, `/:id` | `/`, `/cotizacion`, `/:id/cancelar` | `/:id` | — | `/:id` |
| `/api/seguimiento` | `/activo`, `/revision` | `/:viajeId/incidencias`, `/:viajeId/confirmar-recepcion`, `/:viajeId/calificacion` | — | — | — |
| `/api/pagos` | `/actual` | `/:viajeId/simular` | — | — | — |
| `/api/transportista` | `/catalogos`, `/cargas`, `/postulaciones`, `/espacios`, `/viajes` | `/cargas/:publicacionId/postular`, `/postulaciones/:postulacionId/retirar`, `/espacios`, `/espacios/:publicacionId/cancelar` | — | — | `/postulaciones/:postulacionId`, `/espacios/:publicacionId` |
| `/api/admin` | `/resumen`, `/solicitudes`, `/solicitudes/:id`, `/transportistas`, `/reportes` | — | `/solicitudes/:id/aprobar`, `/solicitudes/:id/rechazar` | `/transportistas/:id` | — |
| `/api` (health) | `/health`, `/health/db` | — | — | — | — |

> Los endpoints `/api/admin/*` no figuran en `backend/README.md`; esta tabla los registra.
