CREATE UNIQUE INDEX IF NOT EXISTS uq_calificacion_viaje_emisor
  ON calificacion (viaje_id, emisor);