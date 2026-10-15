CREATE TABLE IF NOT EXISTS pago (
  id_pago BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  viaje_id INTEGER NOT NULL UNIQUE REFERENCES viaje(id_viaje) ON DELETE CASCADE,
  cliente_id INTEGER NOT NULL REFERENCES cliente(id_cliente),
  tarifa_propuesta NUMERIC NOT NULL CHECK (tarifa_propuesta > 0),
  comision_porcentaje NUMERIC NOT NULL CHECK (comision_porcentaje >= 0),
  comision NUMERIC NOT NULL CHECK (comision >= 0),
  iva_porcentaje NUMERIC NOT NULL CHECK (iva_porcentaje >= 0),
  iva NUMERIC NOT NULL CHECK (iva >= 0),
  total_cliente NUMERIC NOT NULL CHECK (total_cliente > 0),
  estado VARCHAR(20) NOT NULL DEFAULT 'Procesando'
    CHECK (estado IN ('Procesando', 'Retenido', 'Liberado', 'Reembolsado', 'Fallido')),
  modo VARCHAR(20) NOT NULL DEFAULT 'Demostracion'
    CHECK (modo = 'Demostracion'),
  terminos_aceptados_en TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_retenido TIMESTAMP,
  fecha_liberado TIMESTAMP,
  CONSTRAINT chk_pago_total_cliente
    CHECK (total_cliente = tarifa_propuesta + comision + iva)
);

CREATE INDEX IF NOT EXISTS ix_pago_cliente_estado
  ON pago (cliente_id, estado);