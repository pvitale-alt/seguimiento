-- Agregar columna proyecto_padre a la tabla epics_proyecto
ALTER TABLE epics_proyecto 
ADD COLUMN IF NOT EXISTS proyecto_padre INTEGER;

-- Crear índice para mejorar búsquedas por proyecto_padre
CREATE INDEX IF NOT EXISTS idx_epics_proyecto_proyecto_padre ON epics_proyecto(proyecto_padre);

-- Comentario para documentar
COMMENT ON COLUMN epics_proyecto.proyecto_padre IS 'ID del proyecto padre en Redmine (puede ser diferente al id_proyecto si hay subproyectos)';

