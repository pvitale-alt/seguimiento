const { pool } = require('../config/database');

class MantenimientoModel {
    /**
     * Obtener todos los mantenimientos con datos completos (vista)
     * @param {Object} filtros - Filtros de búsqueda
     * @returns {Promise<Array>} - Array de mantenimientos
     */
    static async obtenerTodos(filtros = {}) {
        try {
            let query = `
                SELECT * FROM v_mantenimiento_completo
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            // Filtro por producto
            if (filtros.producto) {
                query += ` AND producto = $${paramCount}`;
                params.push(filtros.producto);
                paramCount++;
            }

            // Filtro por cliente
            if (filtros.cliente) {
                query += ` AND cliente = $${paramCount}`;
                params.push(filtros.cliente);
                paramCount++;
            }

            // Filtro por equipo
            if (filtros.equipo) {
                query += ` AND equipo = $${paramCount}`;
                params.push(filtros.equipo);
                paramCount++;
            }

            // Filtro por búsqueda
            if (filtros.busqueda) {
                query += ` AND (
                    nombre_proyecto ILIKE $${paramCount} OR 
                    cliente ILIKE $${paramCount} OR 
                    linea_servicio ILIKE $${paramCount}
                )`;
                params.push(`%${filtros.busqueda}%`);
                paramCount++;
            }

            // Ordenamiento
            const ordenValido = ['nombre_proyecto', 'cliente', 'equipo', 'producto', 'fecha_creacion'];
            const orden = ordenValido.includes(filtros.orden) ? filtros.orden : 'nombre_proyecto';
            const direccion = filtros.direccion === 'asc' ? 'ASC' : 'DESC';
            query += ` ORDER BY ${orden} ${direccion} NULLS LAST`;

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener mantenimientos:', error);
            throw error;
        }
    }

    /**
     * Obtener mantenimiento por ID de proyecto
     * @param {number} id_proyecto - ID del proyecto en Redmine
     * @returns {Promise<Object|null>} - Mantenimiento o null
     */
    static async obtenerPorId(id_proyecto) {
        try {
            const query = `
                SELECT * FROM v_mantenimiento_completo
                WHERE id_proyecto = $1
            `;
            const result = await pool.query(query, [id_proyecto]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error al obtener mantenimiento:', error);
            throw error;
        }
    }

    /**
     * Actualizar datos editables de mantenimiento
     * @param {number} id_proyecto - ID del proyecto en Redmine
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>} - Mantenimiento actualizado
     */
    static async actualizar(id_proyecto, datos) {
        try {
            // Construir dinámicamente los campos a actualizar usando EXCLUDED
            const campos = [];
            
            // Solo incluir campos que están presentes en datos
            if ('estado' in datos) {
                campos.push(`estado = EXCLUDED.estado`);
            }
            if ('demanda' in datos) {
                campos.push(`demanda = EXCLUDED.demanda`);
            }
            if ('estabilidad' in datos) {
                campos.push(`estabilidad = EXCLUDED.estabilidad`);
            }
            if ('satisfaccion' in datos) {
                campos.push(`satisfaccion = EXCLUDED.satisfaccion`);
            }
            if ('win' in datos) {
                campos.push(`win = EXCLUDED.win`);
            }
            
            if (campos.length === 0) {
                return await this.obtenerPorId(id_proyecto);
            }
            
            // Construir valores para INSERT (todos los campos, usando los valores de datos o null)
            const insertValores = [
                id_proyecto,
                'estado' in datos ? (datos.estado || null) : null,
                'demanda' in datos ? (datos.demanda || null) : null,
                'estabilidad' in datos ? (datos.estabilidad || null) : null,
                'satisfaccion' in datos ? (datos.satisfaccion || null) : null,
                'win' in datos ? (datos.win || null) : null
            ];
            
            // Usar UPSERT (INSERT ... ON CONFLICT DO UPDATE) para crear o actualizar
            const query = `
                INSERT INTO mantenimiento (id_proyecto, estado, demanda, estabilidad, satisfaccion, win, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (id_proyecto) 
                DO UPDATE SET
                    ${campos.join(', ')},
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            `;
            
            const result = await pool.query(query, insertValores);
            
            if (!result.rows[0]) {
                return null;
            }
            
            // Obtener los datos completos del proyecto y añadir updated_at del resultado
            const proyectoCompleto = await this.obtenerPorId(id_proyecto);
            if (proyectoCompleto && result.rows[0].updated_at) {
                proyectoCompleto.updated_at = result.rows[0].updated_at;
            }
            return proyectoCompleto;
        } catch (error) {
            console.error('Error al actualizar mantenimiento:', error);
            throw error;
        }
    }

    /**
     * Obtener productos únicos
     * @returns {Promise<Array>} - Array de productos
     */
    static async obtenerProductos() {
        try {
            const query = `
                SELECT DISTINCT producto 
                FROM redmine_mantenimiento 
                WHERE producto IS NOT NULL 
                ORDER BY producto
            `;
            const result = await pool.query(query);
            return result.rows.map(row => row.producto);
        } catch (error) {
            console.error('Error al obtener productos:', error);
            throw error;
        }
    }

    /**
     * Obtener clientes únicos
     * @returns {Promise<Array>} - Array de clientes
     */
    static async obtenerClientes() {
        try {
            const query = `
                SELECT DISTINCT cliente 
                FROM redmine_mantenimiento 
                WHERE cliente IS NOT NULL 
                ORDER BY cliente
            `;
            const result = await pool.query(query);
            return result.rows.map(row => row.cliente);
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            throw error;
        }
    }

    /**
     * Obtener equipos únicos
     * @returns {Promise<Array>} - Array de equipos
     */
    static async obtenerEquipos() {
        try {
            const query = `
                SELECT DISTINCT equipo 
                FROM redmine_mantenimiento 
                WHERE equipo IS NOT NULL 
                ORDER BY equipo
            `;
            const result = await pool.query(query);
            return result.rows.map(row => row.equipo);
        } catch (error) {
            console.error('Error al obtener equipos:', error);
            throw error;
        }
    }
}

module.exports = MantenimientoModel;

