# Revisión de `ON DELETE`, `CHECK` y `NOT NULL`

Alcance: las 24 tablas del esquema físico (ver [`diagrama-er.md`](diagrama-er.md)).
Método: se cargó el DDL base + migraciones en PostgreSQL 16, se leyó el catálogo del motor y se contrastó con lo que el backend realmente escribe (`backend/src/models/*.js`). Los cambios están en [`databases/migrations/005_hardening_constraints.sql`](../databases/migrations/005_hardening_constraints.sql) y están cubiertos por pruebas automáticas (`backend/test/schema.integration.test.js`).

## Resumen

| Área | Estado inicial | Resultado |
|---|---|---|
| `ON DELETE` | 31 FK: 11 con `NO ACTION` implícito (el informe define `RESTRICT`); `pago` se borraba en cascada junto con el viaje | 0 `NO ACTION`; `pago` protegido; `postulacion` ya no se pierde al borrar un transportista |
| `NOT NULL` | 14 columnas con `DEFAULT` o llenadas por trigger, pero aceptando `NULL` (fechas de registro, `leido`, espejos de `viaje`) | Las 14 pasan a `NOT NULL` (con relleno previo de `NULL`) |
| `CHECK` | Buena cobertura de dominio y positividad; faltaban reglas de coherencia estado↔fecha y formatos | +8 `CHECK` (validados contra los datos de prueba del DDL) |
| Hallazgos sin corregir | — | 6, requieren decisión del equipo (sección 4) |

## 1. `ON DELETE`

**Criterio.** El sistema usa borrado lógico (`activo`, `estado = 'Cancelada'`; ver [`api-delete.md`](api-delete.md)). Por eso un `DELETE` físico debe fallar cuando destruiría historial o dinero, y solo propagarse cuando el hijo no tiene sentido sin el padre (detalle de pertenencia).

### Cambios aplicados

| FK | Antes | Después | Por qué |
|---|---|---|---|
| `pago.viaje_id → viaje` | `CASCADE` | **`RESTRICT`** | Un registro financiero no puede desaparecer porque se borre un viaje. |
| `postulacion.transportista_id → transportista` | `CASCADE` | **`RESTRICT`** | Borrar un transportista eliminaba en silencio su historial de postulaciones. |
| `pago.cliente_id`, `cliente.tipo_cliente_id`, `ruta.cruce_maritimo_id`, `carga.cliente_id`, `carga.tipo_carga_id`, `publicacion_carga.ruta_id`, `publicacion_transporte.ruta_id`, `match.{postulacion,camion,chofer}_id`, `viaje.match_id` | `NO ACTION` (implícito) | **`RESTRICT`** explícito | El informe define `ON DELETE RESTRICT`; el DDL no lo decía. Comportamiento equivalente, pero ahora lo declarado coincide con lo documentado. |

Comprobado: `DELETE` de un transportista con postulaciones y de un cliente con cargas fallan con violación de FK; el `DELETE` de un viaje con pago falla (`23503`).

### `CASCADE` que se mantienen (y por qué)

| FK | Justificación |
|---|---|
| `usuario.cliente_id/transportista_id`, `usuario_sesion.usuario_id` | La cuenta y las sesiones son dependientes del perfil/usuario. |
| `camion`, `chofer`, `publicacion_transporte → transportista` | Flota y ofertas pertenecen al transportista; si hay `match`, el `RESTRICT` de `match.camion_id/chofer_id` igualmente bloquea el borrado. |
| `camion_tipo_carga → camion/tipo_carga`, `tarifa_referencial → ruta/tipo_carga` | Tablas de detalle/asociación. |
| `publicacion_carga → carga`, `postulacion → publicacion_carga`, `comunicacion → postulacion` | Una oferta sin match puede eliminarse con sus postulaciones; con match, `match.postulacion_id RESTRICT` lo impide. |
| `notificacion → cliente/transportista` | Efímeras, sin valor de auditoría. |

### Decisión pendiente

`calificacion` e `historial_cumplimiento` siguen en `CASCADE` desde `viaje`. Hoy un `DELETE FROM viaje` (sin pago) borra su historial de cumplimiento. Si el historial se considera auditoría, conviene `RESTRICT`; no se cambió porque es una decisión de negocio.

## 2. `NOT NULL`

Se hicieron `NOT NULL` (con `UPDATE … SET col = NOW() WHERE col IS NULL` previo) las columnas que ya tenían `DEFAULT NOW()` pero permitían `NULL`:
`cliente.fecha_registro`, `transportista.fecha_registro`, `carga.fecha_registro`, `publicacion_carga.fecha_publicacion`, `publicacion_transporte.fecha_publicacion`, `postulacion.fecha_postulacion`, `match.fecha_match`, `comunicacion.fecha_envio`, `historial_cumplimiento.fecha_evento`, `notificacion.fecha_envio`, `calificacion.fecha_calificacion`; además `comunicacion.leido` (inconsistente con `notificacion.leida`, que ya era `NOT NULL`) y `viaje.camion_id_actual/chofer_id_actual` (siempre las llena el trigger desde `match`).

Siguen nullable a propósito: `direccion`, `comuna`, `valor_declarado`, `distancia_km`, `fecha_fin`, `comentario`, `fecha_retenido/liberado`, `cruce_maritimo_id` (rutas sin cruce) y `cliente_id/transportista_id` en `usuario`/`notificacion` (exclusividad garantizada por `CHECK`).

## 3. `CHECK`

**Ya existían y están bien:** dominios cerrados de `estado`/`emisor`/`tipo_evento`/`rol`; positividad de pesos, volúmenes, capacidades y tarifas; rango 1–5 de `puntaje`; coherencia de fechas (`viaje`, `tarifa_referencial`, `publicacion_*`, `usuario_sesion`); `total_cliente = tarifa + comisión + IVA`; perfil/rol de `usuario`; destinatario obligatorio en `notificacion`. Verificado además que todos los valores que escribe el backend (`'Incidencia'`, `'Entrega completada'`, `'Cancelada'`, `'Retenido'`…) caben en esos dominios.

**Agregados (005):**

| Restricción | Regla |
|---|---|
| `chk_viaje_completado_con_fecha_fin` | `estado = 'Completado'` ⇒ `fecha_fin` no nula (el backend ya la fija al confirmar recepción). |
| `chk_pago_fechas_segun_estado` | `Retenido` ⇒ `fecha_retenido`; `Liberado` ⇒ `fecha_liberado`. |
| `chk_cliente_rut_formato`, `chk_transportista_rut_formato`, `chk_chofer_rut_formato` | RUT `12.345.678-5` o `12345678-5` (acepta ambos porque el DDL de ejemplo no usa puntos y la API sí). Valida formato; el dígito verificador lo sigue validando la aplicación. |
| `chk_cliente_email_formato`, `chk_transportista_email_formato`, `chk_usuario_email_formato` | Mismo patrón que la API (`algo@dominio.tld`). |

Se crean como `NOT VALID` y se validan en la misma migración; si en producción hubiera filas antiguas que no cumplan, la migración no falla: deja ese `CHECK` activo solo para filas nuevas y avisa con `NOTICE`.

**Evaluados y descartados:**
- *`Rechazado` ⇒ `motivo_revision` obligatorio:* `PATCH /api/admin/transportistas/:id` puede dejar `Rechazado` sin motivo; el `CHECK` rompería ese camino (ver hallazgo 1).
- *Cota superior de `camion.anio`:* requeriría una función no inmutable o un tope arbitrario.

## 4. Hallazgos abiertos (requieren decisión)

1. **Rechazo sin motivo.** `PATCH /api/admin/transportistas/:id` acepta estado `Rechazado` sin motivo, mientras `PUT …/rechazar` exige 5–500 caracteres. Unificar la regla y, después, añadir el `CHECK`.
2. **Columnas espejo desactualizables.** `viaje.camion_id_actual/chofer_id_actual` solo se sincronizan al insertar o cambiar `match_id`. Comprobado: tras `UPDATE match SET camion_id = …` el espejo queda con el camión anterior y los `EXCLUDE` de no solapamiento validan contra un dato obsoleto. Solución: trigger también en `match` o impedir cambiar `camion_id/chofer_id` de un match con viaje.
3. **El DDL base no es re-ejecutable.** Su bloque `DROP` no incluye `pago` ni `rut_registrado`, y `pago` se crea en el DDL base *y* en la migración 003. Re-ejecutarlo sobre una base ya migrada falla con `relation "pago" already exists` (comprobado). En una base nueva funciona.
4. **Dos migraciones `004`.** `004_unique_rut.sql` y `004_admin_verification.sql`; el orden depende del arreglo en `migrate.js`, y no hay tabla de versiones: se re-ejecutan todas cada vez, por eso deben ser idempotentes (la 005 lo es). No se renombraron para no desalinear la base de producción.
5. **La API no crea `match` ni `viaje`.** Solo los lee/actualiza; `comunicacion`, `notificacion` y `camion_tipo_carga` no se usan en el backend. El flujo de seguimiento, pago y reseña depende de que existan matches/viajes cargados por SQL. Relevante para la demo.
6. **`calificacion`/`historial_cumplimiento` en `CASCADE`** (sección 1).

## 5. Aplicar en producción (Neon)

El README indica que en Render **no** se ejecuta `db:migrate`; las migraciones se pegan en el SQL Editor de Neon. Para la 005:

1. Crear una *branch* o respaldo en Neon antes de empezar.
2. Pegar y ejecutar el contenido de `databases/migrations/005_hardening_constraints.sql` (es idempotente).
3. Revisar si aparece algún `NOTICE … queda NOT VALID`.
4. Ejecutar `scripts/smoke-prod.sh` (ver [`devops-ci.md`](devops-ci.md)).

## 6. Cómo se verificó

```bash
# base nueva → DDL → migraciones (dos veces) → pruebas
psql -f databases/bd_grupo2_sincrochiloe.sql
cd backend && npm run db:migrate && npm run db:migrate && npm test   # 13/13
```
Las mismas etapas corren en `.github/workflows/ci.yml`.
