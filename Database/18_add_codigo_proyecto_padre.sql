-- Agregar columna codigo_proyecto_padre a productos_equipos
ALTER TABLE productos_equipos
ADD COLUMN IF NOT EXISTS codigo_proyecto_padre VARCHAR(255);

-- Crear un índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_codigo_proyecto_padre ON productos_equipos (codigo_proyecto_padre);


