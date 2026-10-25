ALTER TABLE postulacion DROP CONSTRAINT IF EXISTS chk_postulacion_estado;

ALTER TABLE postulacion
  ADD CONSTRAINT chk_postulacion_estado
  CHECK (estado IN ('Pendiente', 'Aceptada', 'Rechazada', 'Retirada'));