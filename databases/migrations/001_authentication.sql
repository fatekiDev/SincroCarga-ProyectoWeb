ALTER TABLE camion
  ADD COLUMN IF NOT EXISTS tipo_vehiculo VARCHAR(50);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  password_hash TEXT NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('cliente', 'camionero')),
  cliente_id INTEGER UNIQUE REFERENCES cliente(id_cliente) ON DELETE CASCADE,
  transportista_id INTEGER UNIQUE REFERENCES transportista(id_transportista) ON DELETE CASCADE,
  fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_usuario_perfil_rol CHECK (
    (rol = 'cliente' AND cliente_id IS NOT NULL AND transportista_id IS NULL)
    OR
    (rol = 'camionero' AND cliente_id IS NULL AND transportista_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_email_lower
  ON usuario (LOWER(email));

CREATE TABLE IF NOT EXISTS usuario_sesion (
  id_sesion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_expiracion TIMESTAMP NOT NULL,
  CONSTRAINT chk_usuario_sesion_expiracion
    CHECK (fecha_expiracion > fecha_creacion)
);

CREATE INDEX IF NOT EXISTS ix_usuario_sesion_expiracion
  ON usuario_sesion (fecha_expiracion);
