const ProductosEquiposModel = require('../models/ProductosEquiposModel');
const MapeoProductoProyectoInternoModel = require('../models/MapeoProductoProyectoInternoModel');

/**
 * Renderizar página de administración
 */
async function index(req, res) {
    try {
        const productosEquipos = await ProductosEquiposModel.obtenerTodos();
        
        res.render('pages/admin', {
            title: 'Administración - Productos y Equipos',
            productosEquipos: productosEquipos,
            activeMenu: 'admin'
        });
    } catch (error) {
        console.error('Error en admin index:', error);
        res.status(500).render('pages/error', {
            title: 'Error',
            error: 'Error al cargar la página de administración'
        });
    }
}

/**
 * Obtener todos los productos y equipos
 */
async function obtenerProductosEquipos(req, res) {
    try {
        const productosEquipos = await ProductosEquiposModel.obtenerTodos();
        
        res.json({
            success: true,
            data: productosEquipos
        });
    } catch (error) {
        console.error('Error al obtener productos y equipos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener productos y equipos'
        });
    }
}

/**
 * Obtener productos y equipos únicos para los desplegables
 */
async function obtenerProductosYEquiposUnicos(req, res) {
    try {
        const productos = await ProductosEquiposModel.obtenerProductos();
        const equipos = await ProductosEquiposModel.obtenerEquipos();
        
        res.json({
            success: true,
            data: {
                productos,
                equipos
            }
        });
    } catch (error) {
        console.error('Error al obtener productos y equipos únicos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener productos y equipos únicos'
        });
    }
}

/**
 * Crear nuevo producto/equipo
 */
async function crearProductoEquipo(req, res) {
    try {
        const { producto, equipo, id_equipo_redmine, producto_redmine, codigo_proyecto_padre } = req.body;
        
        if (!producto || !equipo || !id_equipo_redmine) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos requeridos: producto, equipo, id_equipo_redmine'
            });
        }
        
        const resultado = await ProductosEquiposModel.crear({
            producto,
            equipo,
            id_equipo_redmine,
            producto_redmine: producto_redmine || null,
            codigo_proyecto_padre: codigo_proyecto_padre || null
        });
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al crear producto/equipo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear producto/equipo: ' + error.message
        });
    }
}

/**
 * Actualizar producto/equipo
 */
async function actualizarProductoEquipo(req, res) {
    try {
        const { id } = req.params;
        const { producto, equipo, id_equipo_redmine, producto_redmine, codigo_proyecto_padre } = req.body;
        
        const resultado = await ProductosEquiposModel.actualizar(id, {
            producto,
            equipo,
            id_equipo_redmine,
            producto_redmine: producto_redmine || null,
            codigo_proyecto_padre: codigo_proyecto_padre || null
        });
        
        if (!resultado) {
            return res.status(404).json({
                success: false,
                error: 'Producto/equipo no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al actualizar producto/equipo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar producto/equipo: ' + error.message
        });
    }
}

/**
 * Eliminar producto/equipo
 */
async function eliminarProductoEquipo(req, res) {
    try {
        const { id } = req.params;
        
        const eliminado = await ProductosEquiposModel.eliminar(id);
        
        if (!eliminado) {
            return res.status(404).json({
                success: false,
                error: 'Producto/equipo no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Producto/equipo eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar producto/equipo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar producto/equipo: ' + error.message
        });
    }
}

/**
 * Obtener todos los mapeos de productos a proyectos internos
 */
async function obtenerMapeosProyectosInternos(req, res) {
    try {
        const mapeos = await MapeoProductoProyectoInternoModel.obtenerTodos();
        
        res.json({
            success: true,
            data: mapeos
        });
    } catch (error) {
        console.error('Error al obtener mapeos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener mapeos de productos a proyectos internos'
        });
    }
}

/**
 * Crear nuevo mapeo de producto a proyecto interno
 */
async function crearMapeoProyectoInterno(req, res) {
    try {
        const { producto, codigo_proyecto_redmine, activo } = req.body;
        
        if (!producto || !codigo_proyecto_redmine) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos requeridos: producto, codigo_proyecto_redmine'
            });
        }
        
        const resultado = await MapeoProductoProyectoInternoModel.crear({
            producto,
            codigo_proyecto_redmine,
            activo: activo !== undefined ? activo : true
        });
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al crear mapeo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear mapeo: ' + error.message
        });
    }
}

/**
 * Actualizar mapeo de producto a proyecto interno
 */
async function actualizarMapeoProyectoInterno(req, res) {
    try {
        const { id } = req.params;
        const datos = req.body;
        
        const resultado = await MapeoProductoProyectoInternoModel.actualizar(id, datos);
        
        if (!resultado) {
            return res.status(404).json({
                success: false,
                error: 'Mapeo no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al actualizar mapeo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar mapeo: ' + error.message
        });
    }
}

/**
 * Eliminar mapeo de producto a proyecto interno
 */
async function eliminarMapeoProyectoInterno(req, res) {
    try {
        const { id } = req.params;
        
        const eliminado = await MapeoProductoProyectoInternoModel.eliminar(id);
        
        if (!eliminado) {
            return res.status(404).json({
                success: false,
                error: 'Mapeo no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Mapeo eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar mapeo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar mapeo: ' + error.message
        });
    }
}

module.exports = {
    index,
    obtenerProductosEquipos,
    obtenerProductosYEquiposUnicos,
    crearProductoEquipo,
    actualizarProductoEquipo,
    eliminarProductoEquipo,
    obtenerMapeosProyectosInternos,
    crearMapeoProyectoInterno,
    actualizarMapeoProyectoInterno,
    eliminarMapeoProyectoInterno
};



