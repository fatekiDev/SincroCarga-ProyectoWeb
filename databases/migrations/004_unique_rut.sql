CREATE TABLE IF NOT EXISTS rut_registrado (
  rut_normalizado TEXT NOT NULL,
  CONSTRAINT uq_rut_registrado PRIMARY KEY (rut_normalizado)
);

INSERT INTO rut_registrado (rut_normalizado)
SELECT rut_normalizado
FROM (
  SELECT regexp_replace(upper(rut), '[^0-9K]', '', 'g') AS rut_normalizado
  FROM cliente
  WHERE rut IS NOT NULL
  UNION ALL
  SELECT regexp_replace(upper(rut_empresa), '[^0-9K]', '', 'g')
  FROM transportista
  WHERE rut_empresa IS NOT NULL
  UNION ALL
  SELECT regexp_replace(upper(rut), '[^0-9K]', '', 'g')
  FROM chofer
  WHERE rut IS NOT NULL
) AS ruts_existentes
WHERE rut_normalizado <> ''
ON CONFLICT (rut_normalizado) DO NOTHING;
