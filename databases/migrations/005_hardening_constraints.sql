-- 005_hardening_constraints.sql
-- Revisión de ON DELETE, NOT NULL y CHECK (ver docs/revision-restricciones.md).
-- Idempotente: se puede ejecutar más de una vez.

-- ---------------------------------------------------------------------------
-- 1. ON DELETE
--    a) Registros financieros / historial no deben borrarse en cascada.
--    b) El informe define ON DELETE RESTRICT, pero el DDL usaba NO ACTION
--       (valor por defecto); se hace explícito.
-- ---------------------------------------------------------------------------
DO $m$
DECLARE
  fk RECORD;
  cur "char";
BEGIN
  FOR fk IN
    SELECT * FROM (VALUES
      ('pago',             'pago_viaje_id_fkey',          'viaje_id',         'viaje',         'id_viaje',         'RESTRICT', 'NO ACTION'),
      ('pago',             'pago_cliente_id_fkey',        'cliente_id',       'cliente',       'id_cliente',       'RESTRICT', 'CASCADE'),
      ('postulacion',      'fk_postulacion_transportista','transportista_id', 'transportista', 'id_transportista', 'RESTRICT', 'CASCADE'),
      ('cliente',          'fk_cliente_tipo_cliente',     'tipo_cliente_id',  'tipo_cliente',  'id_tipo_cliente',  'RESTRICT', 'CASCADE'),
      ('ruta',             'fk_ruta_cruce_maritimo',      'cruce_maritimo_id','cruce_maritimo','id_cruce',         'RESTRICT', 'CASCADE'),
      ('carga',            'fk_carga_cliente',            'cliente_id',       'cliente',       'id_cliente',       'RESTRICT', 'CASCADE'),
      ('carga',            'fk_carga_tipo_carga',         'tipo_carga_id',    'tipo_carga',    'id_tipo_carga',    'RESTRICT', 'CASCADE'),
      ('publicacion_carga','fk_publicacion_ruta',         'ruta_id',          'ruta',          'id_ruta',          'RESTRICT', 'CASCADE'),
      ('publicacion_transporte','fk_publicaciontransporte_ruta','ruta_id',    'ruta',          'id_ruta',          'RESTRICT', 'CASCADE'),
      ('match',            'fk_match_postulacion',        'postulacion_id',   'postulacion',   'id_postulacion',   'RESTRICT', 'CASCADE'),
      ('match',            'fk_match_camion',             'camion_id',        'camion',        'id_camion',        'RESTRICT', 'CASCADE'),
      ('match',            'fk_match_chofer',             'chofer_id',        'chofer',        'id_chofer',        'RESTRICT', 'CASCADE'),
      ('viaje',            'fk_viaje_match',              'match_id',         'match',         'id_match',         'RESTRICT', 'CASCADE')
    ) AS v(tbl, cname, col, reftbl, refcol, ondel, onupd)
  LOOP
    SELECT confdeltype INTO cur FROM pg_constraint
      WHERE conname = fk.cname AND conrelid = fk.tbl::regclass;
    IF cur IS DISTINCT FROM 'r' THEN
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', fk.tbl, fk.cname);
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE %s ON UPDATE %s',
        fk.tbl, fk.cname, fk.col, fk.reftbl, fk.refcol, fk.ondel, fk.onupd);
    END IF;
  END LOOP;
END
$m$;

-- ---------------------------------------------------------------------------
-- 2. NOT NULL en columnas con DEFAULT que aceptaban NULL
-- ---------------------------------------------------------------------------
DO $m$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT * FROM (VALUES
      ('cliente','fecha_registro'), ('transportista','fecha_registro'),
      ('carga','fecha_registro'), ('publicacion_carga','fecha_publicacion'),
      ('publicacion_transporte','fecha_publicacion'), ('postulacion','fecha_postulacion'),
      ('match','fecha_match'), ('comunicacion','fecha_envio'),
      ('historial_cumplimiento','fecha_evento'), ('notificacion','fecha_envio'),
      ('calificacion','fecha_calificacion')
    ) AS v(tbl, col)
  LOOP
    EXECUTE format('UPDATE %I SET %I = NOW() WHERE %I IS NULL', c.tbl, c.col, c.col);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET NOT NULL', c.tbl, c.col);
  END LOOP;
END
$m$;

UPDATE comunicacion SET leido = FALSE WHERE leido IS NULL;
ALTER TABLE comunicacion ALTER COLUMN leido SET NOT NULL;

-- Columnas espejo que mantiene el trigger sync_actores_viaje()
UPDATE viaje v SET camion_id_actual = m.camion_id, chofer_id_actual = m.chofer_id
  FROM match m WHERE m.id_match = v.match_id
  AND (v.camion_id_actual IS NULL OR v.chofer_id_actual IS NULL);
ALTER TABLE viaje ALTER COLUMN camion_id_actual SET NOT NULL;
ALTER TABLE viaje ALTER COLUMN chofer_id_actual SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. CHECK nuevos (se crean NOT VALID y se validan; si hubiera filas
--    antiguas que no cumplen, queda NOT VALID y solo rige para filas nuevas)
-- ---------------------------------------------------------------------------
DO $m$
DECLARE k RECORD;
BEGIN
  FOR k IN
    SELECT * FROM (VALUES
      ('viaje',  'chk_viaje_completado_con_fecha_fin',
         $$estado <> 'Completado' OR fecha_fin IS NOT NULL$$),
      ('pago',   'chk_pago_fechas_segun_estado',
         $$(estado <> 'Retenido' OR fecha_retenido IS NOT NULL) AND (estado <> 'Liberado' OR fecha_liberado IS NOT NULL)$$),
      ('cliente','chk_cliente_rut_formato',
         $$rut ~ '^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9Kk]$'$$),
      ('transportista','chk_transportista_rut_formato',
         $$rut_empresa ~ '^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9Kk]$'$$),
      ('chofer', 'chk_chofer_rut_formato',
         $$rut ~ '^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9Kk]$'$$),
      ('cliente','chk_cliente_email_formato',
         $$email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'$$),
      ('transportista','chk_transportista_email_formato',
         $$email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'$$),
      ('usuario','chk_usuario_email_formato',
         $$email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'$$)
    ) AS v(tbl, cname, expr)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conname = k.cname AND conrelid = k.tbl::regclass) THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s) NOT VALID', k.tbl, k.cname, k.expr);
    END IF;
    BEGIN
      EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', k.tbl, k.cname);
    EXCEPTION WHEN check_violation THEN
      RAISE NOTICE 'La restricción % queda NOT VALID: hay filas antiguas que no la cumplen', k.cname;
    END;
  END LOOP;
END
$m$;
