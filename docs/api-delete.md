# Endpoints `DELETE`

## Estado actual: la API no expone ningún `DELETE` HTTP

Revisadas las 6 rutas (`backend/src/routes/*.routes.js`) y el frontend: **no existe ningún `router.delete(...)`** ni `fetch` con `method: 'DELETE'`. La eliminación se resuelve con **borrado lógico** mediante `POST`/`PUT`/`PATCH`, y el único `DELETE` es una sentencia SQL interna.

### Operaciones de "eliminación" que sí existen

| Operación | Endpoint | Rol | Qué hace en la base | Reversible |
|---|---|---|---|---|
| Cancelar publicación de carga | `POST /api/publicaciones/:id/cancelar` | cliente | `UPDATE publicacion_carga SET estado = 'Cancelada'` (solo si está `Disponible` y es del cliente) | No desde la API; el registro se conserva |
| Retirar postulación | `POST /api/transportista/postulaciones/:postulacionId/retirar` | camionero verificado | `UPDATE postulacion` (solo si está pendiente y es propia) | Se puede volver a postular |
| Cancelar publicación de capacidad | `POST /api/transportista/espacios/:publicacionId/cancelar` | camionero verificado | `UPDATE publicacion_transporte SET estado = 'Cancelada'` | No |
| Cerrar sesión | `POST /api/auth/logout` | cualquiera | `DELETE FROM usuario_sesion WHERE token_hash = $1` y borra la cookie | — |
| Suspender / rechazar transportista | `PATCH /api/admin/transportistas/:id`, `PUT /api/admin/solicitudes/:id/rechazar` | admin | `UPDATE transportista` (`activo = FALSE`, `estado_verificacion`) | Sí, vía `PATCH` |

Ninguna operación borra filas de negocio (`carga`, `publicacion_*`, `postulacion`, `viaje`, `pago`). Esto es coherente con las FK `RESTRICT` de la migración 005: un `DELETE` físico sobre datos con historial es rechazado por la base (ver [`revision-restricciones.md`](revision-restricciones.md)).

### Inventario completo de métodos HTTP (para verificar la ausencia de `DELETE`)

| Prefijo | GET | POST | PUT | PATCH | DELETE |
|---|---|---|---|---|---|
| `/api/auth` | `/me` | `/register`, `/login`, `/logout` | — | — | — |
| `/api/publicaciones` | `/`, `/catalogos`, `/mine`, `/:id` | `/`, `/cotizacion`, `/:id/cancelar` | `/:id` | — | — |
| `/api/seguimiento` | `/activo`, `/revision` | `/:viajeId/incidencias`, `/:viajeId/confirmar-recepcion`, `/:viajeId/calificacion` | — | — | — |
| `/api/pagos` | `/actual` | `/:viajeId/simular` | — | — | — |
| `/api/transportista` | `/catalogos`, `/cargas`, `/postulaciones`, `/espacios`, `/viajes` | `/cargas/:publicacionId/postular`, `/postulaciones/:postulacionId/retirar`, `/espacios`, `/espacios/:publicacionId/cancelar` | — | — | — |
| `/api/admin` | `/resumen`, `/solicitudes`, `/solicitudes/:id`, `/transportistas`, `/reportes` | — | `/solicitudes/:id/aprobar`, `/solicitudes/:id/rechazar` | `/transportistas/:id` | — |
| `/api` (health) | `/health`, `/health/db` | — | — | — | — |

> Los endpoints `/api/admin/*` no figuran en `backend/README.md`; esta tabla los registra.

## Si la entrega exige `DELETE` — propuesta (no implementada)

Si la rúbrica pide verbos `DELETE` explícitos, la forma coherente con el diseño actual es exponer los casos de la tabla anterior con la semántica REST correcta, **manteniendo el borrado lógico**:

| Propuesta | Equivale a | Respuestas |
|---|---|---|
| `DELETE /api/publicaciones/:id` | `POST …/:id/cancelar` | `204` sin cuerpo · `404` no existe o no es del cliente · `409` si ya no está `Disponible` |
| `DELETE /api/transportista/postulaciones/:id` | `POST …/retirar` | `204` · `404` · `409` si ya no está pendiente |
| `DELETE /api/transportista/espacios/:id` | `POST …/cancelar` | `204` · `404` · `409` |
| `DELETE /api/auth/session` | `POST /api/auth/logout` | `204` (idempotente) |

Notas técnicas: `cors` ya permite `DELETE` por defecto, no requiere cambios; reutilizan los mismos modelos, por lo que serían alias de pocas líneas por ruta. Para no romper el frontend actual conviene conservar los `POST` existentes y documentar ambos.
