-- Agregar columna nombre_proyecto_padre a la tabla epics_proyecto
ALTER TABLE epics_proyecto 
ADD COLUMN IF NOT EXISTS nombre_proyecto_padre VARCHAR(500);

-- Crear índice para mejorar búsquedas por nombre_proyecto_padre
CREATE INDEX IF NOT EXISTS idx_epics_proyecto_nombre_proyecto_padre ON epics_proyecto(nombre_proyecto_padre);

-- Comentario para documentar
COMMENT ON COLUMN epics_proyecto.nombre_proyecto_padre IS 'Nombre del proyecto padre en Redmine';

