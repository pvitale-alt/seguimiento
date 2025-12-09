const { pool } = require('../config/database');

class ProyectosInternosModel {
    /**
     * Obtener todos los proyectos internos con datos completos (vista)
     * @param {Object} filtros - Filtros de búsqueda
     * @returns {Promise<Array>} - Array de proyectos internos
     */
    static async obtenerTodos(filtros = {}) {
        try {
            let query = `
                SELECT * FROM v_proyectos_internos_completo
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
            const ordenValido = ['nombre_proyecto', 'cliente', 'equipo', 'producto', 'fecha_creacion', 'fecha_inicio', 'fecha_fin'];
            const orden = ordenValido.includes(filtros.orden) ? filtros.orden : 'nombre_proyecto';
            const direccion = filtros.direccion === 'asc' ? 'ASC' : 'DESC';
            query += ` ORDER BY ${orden} ${direccion} NULLS LAST`;

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener proyectos internos:', error);
            throw error;
        }
    }

    /**
     * Obtener proyecto interno por ID de proyecto
     * @param {number} id_proyecto - ID del proyecto en Redmine
     * @returns {Promise<Object|null>} - Proyecto interno o null
     */
    static async obtenerPorId(id_proyecto) {
        try {
            const query = `
                SELECT * FROM v_proyectos_internos_completo
                WHERE id_proyecto = $1
            `;
            const result = await pool.query(query, [id_proyecto]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error al obtener proyecto interno:', error);
            throw error;
        }
    }

    /**
     * Actualizar datos editables de proyecto interno
     * @param {number} id_proyecto - ID del proyecto en Redmine
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>} - Proyecto interno actualizado
     */
    static async actualizar(id_proyecto, datos) {
        try {
            // Construir dinámicamente el query solo con los campos que se envían
            const camposPermitidos = ['estado', 'overall', 'alcance', 'costo', 'plazos', 'avance', 'fecha_inicio', 'fecha_fin', 'win', 'riesgos'];
            const camposActualizar = [];
            const values = [];
            let paramCount = 1;
            
            for (const campo of camposPermitidos) {
                if (datos.hasOwnProperty(campo)) {
                    camposActualizar.push(`${campo} = $${paramCount}`);
                    // El campo 'costo' ahora es VARCHAR(50) (igual que overall, alcance, plazos)
                    // Guardamos valores como 'verde', 'amarillo', 'rojo'
                    if (campo === 'avance' && datos[campo] !== null && datos[campo] !== undefined && datos[campo] !== '') {
                        values.push(parseInt(datos[campo]));
                    } else {
                        // Para todos los demás campos (incluyendo costo), guardar como string o null
                        values.push(datos[campo] || null);
                    }
                    paramCount++;
                }
            }
            
            if (camposActualizar.length === 0) {
                throw new Error('No se proporcionaron campos para actualizar');
            }
            
            // Agregar updated_at
            camposActualizar.push(`updated_at = CURRENT_TIMESTAMP`);
            
            // Agregar id_proyecto al final
            values.push(id_proyecto);
            
            const query = `
                UPDATE proyectos_internos
                SET ${camposActualizar.join(', ')}
                WHERE id_proyecto = $${paramCount}
                RETURNING *
            `;
            
            const result = await pool.query(query, values);
            
            if (!result.rows[0]) {
                return null;
            }
            
            return await this.obtenerPorId(id_proyecto);
        } catch (error) {
            console.error('Error al actualizar proyecto interno:', error);
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
                FROM redmine_proyectos_internos 
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
                FROM redmine_proyectos_internos 
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
                FROM redmine_proyectos_internos 
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

module.exports = ProyectosInternosModel;








