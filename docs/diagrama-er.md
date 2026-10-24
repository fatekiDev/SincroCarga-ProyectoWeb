# Diagrama ER del esquema físico

Esquema real de **PostgreSQL 16** (`bd_grupo2_sincrochiloe`) obtenido cargando `databases/bd_grupo2_sincrochiloe.sql` y las migraciones `001`–`005`, y leyendo el catálogo del motor (`pg_constraint`, `information_schema`). No está dibujado a mano: refleja lo que hay en la base.

**Total: 24 tablas** — 21 del DDL base + `usuario`, `usuario_sesion` y `rut_registrado` (migraciones 001 y 004).

![Diagrama ER](img/diagrama-er.png)

Versión vectorial (zoom sin pérdida): [`img/diagrama-er.svg`](img/diagrama-er.svg). Fuente editable: [`img/diagrama-er.dot`](img/diagrama-er.dot) (Graphviz).

**Cómo leerlo:** cada tabla muestra sus columnas con `PK`/`FK`/`UQ` y `NN` (NOT NULL); debajo, los `CHECK` y `EXCLUDE`. Las líneas usan notación pata de gallo y llevan la acción `ON DELETE` (rojo = `CASCADE`, azul = `RESTRICT`).

## Tablas por dominio

| Dominio | Tablas |
|---|---|
| Catálogos y tarifas | `tipo_cliente`, `tipo_carga`, `cruce_maritimo`, `ruta`, `tarifa_referencial` |
| Actores y flota | `cliente`, `transportista`, `camion`, `chofer`, `camion_tipo_carga` |
| Flujo operativo | `carga`, `publicacion_carga`, `publicacion_transporte`, `postulacion`, `match`, `viaje`, `pago` |
| Interacción e historial | `calificacion`, `comunicacion`, `historial_cumplimiento`, `notificacion` |
| Autenticación y seguridad | `usuario`, `usuario_sesion`, `rut_registrado` |

## Claves foráneas y `ON DELETE` (estado actual, con la migración 005)

| Columna hija | Tabla padre | FK obligatoria | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| `calificacion.viaje_id` | `viaje` | sí | **CASCADE** | CASCADE |
| `camion.transportista_id` | `transportista` | sí | **CASCADE** | CASCADE |
| `camion_tipo_carga.camion_id` | `camion` | sí | **CASCADE** | CASCADE |
| `camion_tipo_carga.tipo_carga_id` | `tipo_carga` | sí | **CASCADE** | CASCADE |
| `carga.cliente_id` | `cliente` | sí | **RESTRICT** | CASCADE |
| `carga.tipo_carga_id` | `tipo_carga` | sí | **RESTRICT** | CASCADE |
| `chofer.transportista_id` | `transportista` | sí | **CASCADE** | CASCADE |
| `cliente.tipo_cliente_id` | `tipo_cliente` | sí | **RESTRICT** | CASCADE |
| `comunicacion.postulacion_id` | `postulacion` | sí | **CASCADE** | CASCADE |
| `historial_cumplimiento.viaje_id` | `viaje` | sí | **CASCADE** | CASCADE |
| `match.camion_id` | `camion` | sí | **RESTRICT** | CASCADE |
| `match.chofer_id` | `chofer` | sí | **RESTRICT** | CASCADE |
| `match.postulacion_id` | `postulacion` | sí | **RESTRICT** | CASCADE |
| `notificacion.cliente_id` | `cliente` | no | **CASCADE** | NO ACTION |
| `notificacion.transportista_id` | `transportista` | no | **CASCADE** | NO ACTION |
| `pago.cliente_id` | `cliente` | sí | **RESTRICT** | CASCADE |
| `pago.viaje_id` | `viaje` | sí | **RESTRICT** | NO ACTION |
| `postulacion.publicacion_id` | `publicacion_carga` | sí | **CASCADE** | CASCADE |
| `postulacion.transportista_id` | `transportista` | sí | **RESTRICT** | CASCADE |
| `publicacion_carga.carga_id` | `carga` | sí | **CASCADE** | CASCADE |
| `publicacion_carga.ruta_id` | `ruta` | sí | **RESTRICT** | CASCADE |
| `publicacion_transporte.camion_id` | `camion` | sí | **CASCADE** | CASCADE |
| `publicacion_transporte.ruta_id` | `ruta` | sí | **RESTRICT** | CASCADE |
| `publicacion_transporte.transportista_id` | `transportista` | sí | **CASCADE** | CASCADE |
| `ruta.cruce_maritimo_id` | `cruce_maritimo` | no | **RESTRICT** | CASCADE |
| `tarifa_referencial.ruta_id` | `ruta` | sí | **CASCADE** | CASCADE |
| `tarifa_referencial.tipo_carga_id` | `tipo_carga` | sí | **CASCADE** | CASCADE |
| `usuario.cliente_id` | `cliente` | no | **CASCADE** | NO ACTION |
| `usuario.transportista_id` | `transportista` | no | **CASCADE** | NO ACTION |
| `usuario_sesion.usuario_id` | `usuario` | sí | **CASCADE** | NO ACTION |
| `viaje.match_id` | `match` | sí | **RESTRICT** | CASCADE |

> Total: 31 claves foráneas. Ver el análisis y los cambios en [`revision-restricciones.md`](revision-restricciones.md).

## Restricciones que no son PK/FK/UNIQUE simples

- **`EXCLUDE` (btree_gist):** `tarifa_referencial` impide vigencias solapadas por ruta + tipo de carga; `viaje` impide que un mismo camión o chofer tenga viajes solapados (salvo cancelados).
- **Trigger `sync_actores_viaje()`:** copia `camion_id`/`chofer_id` desde `match` a `viaje.camion_id_actual/chofer_id_actual` para poder construir esos `EXCLUDE`.
- **Índices únicos parciales/funcionales:** `uq_usuario_email_lower` (correo sin distinguir mayúsculas), `uq_calificacion_viaje_emisor` (una calificación por viaje y emisor).
- **`rut_registrado`:** tabla de unicidad global de RUT normalizado (cliente, empresa transportista y chofer comparten espacio de RUT); no tiene FK por diseño.

## Versión Mermaid (se renderiza en GitHub)

<details>
<summary>Ver diagrama Mermaid</summary>

```mermaid
erDiagram
  calificacion {
    integer id_calificacion PK
    integer viaje_id FK
    varchar emisor
    integer puntaje
    varchar comentario
    timestamp fecha_calificacion
  }
  camion {
    integer id_camion PK
    integer transportista_id FK
    varchar patente UK
    varchar marca
    varchar modelo
    integer anio
    numeric capacidad_kg
    numeric capacidad_m3
    boolean activo
    varchar tipo_vehiculo
  }
  camion_tipo_carga {
    integer camion_id PK,FK
    integer tipo_carga_id PK,FK
  }
  carga {
    integer id_carga PK
    integer cliente_id FK
    integer tipo_carga_id FK
    varchar descripcion
    numeric peso_kg
    numeric volumen_m3
    numeric valor_declarado
    timestamp fecha_registro
  }
  chofer {
    integer id_chofer PK
    integer transportista_id FK
    varchar rut UK
    varchar nombre_completo
    varchar licencia_conducir
    date fecha_vencimiento_licencia
    varchar telefono
    boolean activo
  }
  cliente {
    integer id_cliente PK
    integer tipo_cliente_id FK
    varchar rut UK
    varchar nombre_razon_social
    varchar email UK
    varchar telefono
    varchar direccion
    varchar comuna
    timestamp fecha_registro
    boolean activo
  }
  comunicacion {
    integer id_comunicacion PK
    integer postulacion_id FK
    varchar emisor
    varchar mensaje
    timestamp fecha_envio
    boolean leido
  }
  cruce_maritimo {
    integer id_cruce PK
    varchar nombre
    varchar empresa_naviera
    integer duracion_estimada_min
    numeric tarifa_cruce
  }
  historial_cumplimiento {
    integer id_historial PK
    integer viaje_id FK
    varchar tipo_evento
    varchar descripcion
    timestamp fecha_evento
  }
  match {
    integer id_match PK
    integer postulacion_id FK,UK
    integer camion_id FK
    integer chofer_id FK
    timestamp fecha_match
    varchar estado
  }
  notificacion {
    integer id_notificacion PK
    integer cliente_id FK
    integer transportista_id FK
    varchar tipo_notificacion
    varchar mensaje
    timestamp fecha_envio
    boolean leida
  }
  pago {
    bigint id_pago PK
    integer viaje_id FK,UK
    integer cliente_id FK
    numeric tarifa_propuesta
    numeric comision_porcentaje
    numeric comision
    numeric iva_porcentaje
    numeric iva
    numeric total_cliente
    varchar estado
    varchar modo
    timestamp terminos_aceptados_en
    timestamp fecha_creacion
    timestamp fecha_actualizacion
    timestamp fecha_retenido
    timestamp fecha_liberado
  }
  postulacion {
    integer id_postulacion PK
    integer publicacion_id FK
    integer transportista_id FK
    timestamp fecha_postulacion
    numeric tarifa_propuesta
    varchar estado
    varchar comentario
  }
  publicacion_carga {
    integer id_publicacion PK
    integer carga_id FK,UK
    integer ruta_id FK
    timestamp fecha_publicacion
    date fecha_limite_postulacion
    numeric tarifa_ofrecida
    varchar estado
  }
  publicacion_transporte {
    integer id_publicacion_transporte PK
    integer transportista_id FK
    integer camion_id FK
    integer ruta_id FK
    timestamp fecha_publicacion
    date fecha_disponible_desde
    date fecha_disponible_hasta
    numeric capacidad_disponible_kg
    numeric capacidad_disponible_m3
    numeric tarifa_referencial_ofrecida
    varchar estado
  }
  rut_registrado {
    text rut_normalizado PK
  }
  ruta {
    integer id_ruta PK
    varchar origen
    varchar destino
    numeric distancia_km
    integer cruce_maritimo_id FK
  }
  tarifa_referencial {
    integer id_tarifa PK
    integer ruta_id FK
    integer tipo_carga_id FK
    numeric valor
    date fecha_vigencia_desde
    date fecha_vigencia_hasta
  }
  tipo_carga {
    integer id_tipo_carga PK
    varchar nombre UK
    boolean requiere_refrigeracion
    boolean es_peligrosa
    varchar descripcion
  }
  tipo_cliente {
    integer id_tipo_cliente PK
    varchar nombre_tipo UK
    varchar descripcion
  }
  transportista {
    integer id_transportista PK
    varchar rut_empresa UK
    varchar razon_social
    varchar email UK
    varchar telefono
    varchar direccion
    timestamp fecha_registro
    boolean activo
    varchar estado_verificacion
    varchar motivo_revision
    timestamp fecha_revision
  }
  usuario {
    integer id_usuario PK
    varchar email
    text password_hash
    varchar rol
    integer cliente_id FK,UK
    integer transportista_id FK,UK
    timestamp fecha_registro
    boolean activo
    varchar nombre_mostrar
  }
  usuario_sesion {
    bigint id_sesion PK
    integer usuario_id FK
    char token_hash UK
    timestamp fecha_creacion
    timestamp fecha_expiracion
  }
  viaje {
    integer id_viaje PK
    integer match_id FK,UK
    timestamp fecha_inicio
    timestamp fecha_fin
    varchar estado
    numeric tarifa_final
    integer camion_id_actual
    integer chofer_id_actual
  }
  viaje ||--o{ calificacion : "viaje_id (DEL CASCADE)"
  transportista ||--o{ camion : "transportista_id (DEL CASCADE)"
  camion ||--o{ camion_tipo_carga : "camion_id (DEL CASCADE)"
  tipo_carga ||--o{ camion_tipo_carga : "tipo_carga_id (DEL CASCADE)"
  cliente ||--o{ carga : "cliente_id (DEL RESTRICT)"
  tipo_carga ||--o{ carga : "tipo_carga_id (DEL RESTRICT)"
  transportista ||--o{ chofer : "transportista_id (DEL CASCADE)"
  tipo_cliente ||--o{ cliente : "tipo_cliente_id (DEL RESTRICT)"
  postulacion ||--o{ comunicacion : "postulacion_id (DEL CASCADE)"
  viaje ||--o{ historial_cumplimiento : "viaje_id (DEL CASCADE)"
  camion ||--o{ match : "camion_id (DEL RESTRICT)"
  chofer ||--o{ match : "chofer_id (DEL RESTRICT)"
  postulacion ||--|o match : "postulacion_id (DEL RESTRICT)"
  cliente |o--o{ notificacion : "cliente_id (DEL CASCADE)"
  transportista |o--o{ notificacion : "transportista_id (DEL CASCADE)"
  cliente ||--o{ pago : "cliente_id (DEL RESTRICT)"
  viaje ||--|o pago : "viaje_id (DEL RESTRICT)"
  publicacion_carga ||--o{ postulacion : "publicacion_id (DEL CASCADE)"
  transportista ||--o{ postulacion : "transportista_id (DEL RESTRICT)"
  carga ||--|o publicacion_carga : "carga_id (DEL CASCADE)"
  ruta ||--o{ publicacion_carga : "ruta_id (DEL RESTRICT)"
  camion ||--o{ publicacion_transporte : "camion_id (DEL CASCADE)"
  ruta ||--o{ publicacion_transporte : "ruta_id (DEL RESTRICT)"
  transportista ||--o{ publicacion_transporte : "transportista_id (DEL CASCADE)"
  cruce_maritimo |o--o{ ruta : "cruce_maritimo_id (DEL RESTRICT)"
  ruta ||--o{ tarifa_referencial : "ruta_id (DEL CASCADE)"
  tipo_carga ||--o{ tarifa_referencial : "tipo_carga_id (DEL CASCADE)"
  cliente |o--|o usuario : "cliente_id (DEL CASCADE)"
  transportista |o--|o usuario : "transportista_id (DEL CASCADE)"
  usuario ||--o{ usuario_sesion : "usuario_id (DEL CASCADE)"
  match ||--|o viaje : "match_id (DEL RESTRICT)"
```

</details>
