ALTER TABLE usuario
  DROP CONSTRAINT IF EXISTS chk_usuario_perfil_rol,
  DROP CONSTRAINT IF EXISTS usuario_rol_check;

ALTER TABLE usuario
  ADD COLUMN IF NOT EXISTS nombre_mostrar VARCHAR(120);

ALTER TABLE transportista
  ADD COLUMN IF NOT EXISTS estado_verificacion VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  ADD COLUMN IF NOT EXISTS motivo_revision VARCHAR(500),
  ADD COLUMN IF NOT EXISTS fecha_revision TIMESTAMP;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_usuario_perfil_rol'
      AND conrelid = 'usuario'::regclass
  ) THEN
    ALTER TABLE usuario
      ADD CONSTRAINT chk_usuario_perfil_rol CHECK (
        (rol = 'cliente' AND cliente_id IS NOT NULL AND transportista_id IS NULL)
        OR
        (rol = 'camionero' AND cliente_id IS NULL AND transportista_id IS NOT NULL)
        OR
        (rol = 'admin' AND cliente_id IS NULL AND transportista_id IS NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_usuario_rol'
      AND conrelid = 'usuario'::regclass
  ) THEN
    ALTER TABLE usuario
      ADD CONSTRAINT chk_usuario_rol CHECK (rol IN ('cliente', 'camionero', 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_transportista_estado_verificacion'
      AND conrelid = 'transportista'::regclass
  ) THEN
    ALTER TABLE transportista
      ADD CONSTRAINT chk_transportista_estado_verificacion
        CHECK (estado_verificacion IN ('Pendiente', 'Verificado', 'Rechazado'));
  END IF;
END
$migration$;

CREATE INDEX IF NOT EXISTS ix_transportista_verificacion
  ON transportista (estado_verificacion, fecha_registro DESC);
