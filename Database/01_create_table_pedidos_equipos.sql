-- Tabla para gestionar pedidos entre equipos
CREATE TABLE IF NOT EXISTS pedidos_equipos (
    id SERIAL PRIMARY KEY,
    equipo_solicitante VARCHAR(255) NOT NULL,
    equipo_responsable VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_planificada_entrega DATE NOT NULL,
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('Pendiente', 'En curso', 'Bloqueado', 'Realizado')),
    comentario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_equipo_solicitante ON pedidos_equipos(equipo_solicitante);
CREATE INDEX IF NOT EXISTS idx_equipo_responsable ON pedidos_equipos(equipo_responsable);
CREATE INDEX IF NOT EXISTS idx_estado ON pedidos_equipos(estado);
CREATE INDEX IF NOT EXISTS idx_fecha_planificada ON pedidos_equipos(fecha_planificada_entrega);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pedidos_equipos_updated_at BEFORE UPDATE ON pedidos_equipos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

