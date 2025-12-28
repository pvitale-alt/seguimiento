const MantenimientoModel = require('../models/MantenimientoModel');
const ProyectosExternosModel = require('../models/ProyectosExternosModel');
const AccionablesProyectoModel = require('../models/AccionablesProyectoModel');
// ProyectosInternosModel ya no se usa - proyectos internos ahora usan ProyectosExternosModel con filtro de categoría
const ProductosEquiposModel = require('../models/ProductosEquiposModel');
const EpicsProyectoModel = require('../models/EpicsProyectoModel');
const SubproyectosModel = require('../models/SubproyectosModel');
const { obtenerEpics, mapearEpic } = require('../services/redmineService');

/**
 * Renderizar página principal de seguimiento
 */
async function index(req, res) {
    try {
        const producto = req.query.producto || null;
        const equipo = req.query.equipo || null;
        const tipo = req.query.tipo || 'mantenimiento';
        const categoriaActual = req.query.categoria || null;
        
        // Obtener productos con equipos
        const productosEquipos = await ProductosEquiposModel.obtenerTodos();
        
        // Obtener nombre del equipo actual si existe
        let equipoNombre = null;
        if (equipo) {
            for (const item of productosEquipos) {
                const equipoEncontrado = item.equipos?.find(e => e.id_equipo_redmine === equipo);
                if (equipoEncontrado) {
                    equipoNombre = equipoEncontrado.equipo;
                    break;
                }
            }
        }
        
        // Obtener categorías disponibles para el equipo (para solapas dinámicas)
        let categoriasEquipo = [];
        if (equipo) {
            categoriasEquipo = await ProyectosExternosModel.obtenerCategoriasEquipo(equipo);
        }
        
        // Verificar si hay proyectos de mantenimiento para este equipo/producto
        let tieneMantenimiento = false;
        if (producto && equipo) {
            const filtrosMantenimiento = {
                producto: producto,
                equipo: equipo
            };
            const mantenimientos = await MantenimientoModel.obtenerTodos(filtrosMantenimiento);
            
            // También verificar proyectos de "On-Site"
            const filtrosOnSite = {
                producto: producto,
                equipo: equipo,
                categoria: 'On-Site'
            };
            const proyectosOnSite = await ProyectosExternosModel.obtenerTodos(filtrosOnSite);
            
            // Si hay al menos un proyecto de mantenimiento u on-site, mostrar la solapa
            tieneMantenimiento = mantenimientos.length > 0 || proyectosOnSite.length > 0;
        }
        
        // Si no hay tipo especificado o el tipo es 'mantenimiento' pero no hay proyectos de mantenimiento, redirigir a proyectos
        if (producto && equipo) {
            // Si no hay tipo o es 'mantenimiento' pero no hay mantenimiento, determinar la primera solapa disponible
            if (!tipo || tipo === 'mantenimiento') {
                if (tieneMantenimiento) {
                    // Si hay mantenimiento y el tipo es 'mantenimiento' o no está especificado, usar mantenimiento
                    if (!tipo) {
                        tipo = 'mantenimiento';
                    }
                } else {
                    // Si no hay mantenimiento, redirigir a proyectos
                    return res.redirect(`/?producto=${encodeURIComponent(producto)}&equipo=${encodeURIComponent(equipo)}&tipo=proyectos`);
                }
            }
        }
        
        res.render('pages/index', {
            title: 'Seguimiento de Proyectos',
            productosEquipos: productosEquipos,
            productoActual: producto,
            equipoActual: equipo,
            equipoNombre: equipoNombre,
            tipoActual: tipo,
            categoriaActual: categoriaActual,
            categoriasEquipo: categoriasEquipo,
            tieneMantenimiento: tieneMantenimiento,
            activeMenu: 'seguimiento',
            isAdmin: req.isAdmin || false
        });
    } catch (error) {
        console.error('Error en index:', error);
        res.status(500).render('pages/error', {
            title: 'Error',
            error: 'Error al cargar la página'
        });
    }
}

/**
 * Obtener datos de mantenimiento
 */
async function obtenerMantenimiento(req, res) {
    try {
        const producto = req.query.producto || null;
        const equipo = req.query.equipo || null;
        const filtros = {
            producto: producto,
            equipo: equipo,
            busqueda: req.query.busqueda || null,
            orden: req.query.orden || 'nombre_proyecto',
            direccion: req.query.direccion || 'asc'
        };
        
        // Obtener proyectos de mantenimiento (Mantenimiento + On-Site)
        const mantenimientos = await MantenimientoModel.obtenerTodos(filtros);
        
        const todosLosProyectos = mantenimientos;
        
        // Aplicar ordenamiento
        const ordenValido = ['nombre_proyecto', 'cliente', 'equipo', 'producto', 'fecha_creacion'];
        const orden = ordenValido.includes(filtros.orden) ? filtros.orden : 'nombre_proyecto';
        const direccion = filtros.direccion === 'asc' ? 'ASC' : 'DESC';
        
        todosLosProyectos.sort((a, b) => {
            const aVal = a[orden] || '';
            const bVal = b[orden] || '';
            if (direccion === 'ASC') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
        
        res.json({
            success: true,
            data: todosLosProyectos
        });
    } catch (error) {
        console.error('Error al obtener mantenimiento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos de mantenimiento'
        });
    }
}

/**
 * Obtener datos de proyectos externos
 */
async function obtenerProyectosExternos(req, res) {
    try {
        const producto = req.query.producto || null;
        const filtros = {
            producto: producto,
            busqueda: req.query.busqueda || null,
            orden: req.query.orden || 'nombre_proyecto',
            direccion: req.query.direccion || 'asc'
        };
        
        const proyectos = await ProyectosExternosModel.obtenerTodos(filtros);
        
        res.json({
            success: true,
            data: proyectos
        });
    } catch (error) {
        console.error('Error al obtener proyectos externos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos de proyectos externos'
        });
    }
}

/**
 * Obtener datos de proyectos (renombrado desde proyectos externos)
 */
async function obtenerProyectos(req, res) {
    try {
        const producto = req.query.producto || null;
        const equipo = req.query.equipo || null;
        const categoria = req.query.categoria || null;
        const proyecto_padre = req.query.proyecto_padre || null;
        const orden = req.query.orden || 'cliente';
        // Si no se especifica dirección y la columna es 'cliente', usar 'desc' por defecto
        const direccionDefault = (orden === 'cliente' && !req.query.direccion) ? 'desc' : 'asc';
        const incluirCerrados = req.query.incluirCerrados === 'true' || req.query.incluirCerrados === true;
        
        // Si se solicita por proyecto_padre (para obtener subproyectos), filtrar directamente
        if (proyecto_padre) {
            const filtros = {
                producto: producto,
                equipo: equipo,
                categoria: categoria,
                busqueda: req.query.busqueda || null,
                orden: orden,
                direccion: req.query.direccion || direccionDefault,
                incluirCerrados: incluirCerrados,
                proyecto_padre: proyecto_padre
            };
            
            // Obtener solo los subproyectos del proyecto padre especificado, filtrados por producto/equipo
            const subproyectos = await ProyectosExternosModel.obtenerSubproyectosPorPadre(filtros);
            
            return res.json({
                success: true,
                data: subproyectos
            });
        }
        
        const filtros = {
            producto: producto,
            equipo: equipo,
            categoria: categoria,
            busqueda: req.query.busqueda || null,
            orden: orden,
            direccion: req.query.direccion || direccionDefault,
            incluirCerrados: incluirCerrados
        };
        
        // Si no hay categoría específica, excluir mantenimiento y on-site (se muestran en la solapa mantenimiento)
        // Esto permite que la solapa "Proyectos" muestre todas las categorías excepto mantenimiento
        if (!categoria) {
            // No filtrar por categoría, pero excluir mantenimiento y on-site en la query
            filtros.excluirCategorias = ['Mantenimiento', 'On-Site'];
        }
        
        console.log('📊 Obteniendo proyectos con filtros:', {
            producto: filtros.producto,
            equipo: filtros.equipo,
            categoria: filtros.categoria,
            busqueda: filtros.busqueda,
            excluirCategorias: filtros.excluirCategorias
        });
        
        // Obtener proyectos principales (linea_servicio != 'Hereda' o NULL)
        const proyectos = await ProyectosExternosModel.obtenerTodos(filtros);
        
        console.log(`✅ Proyectos obtenidos de BD: ${proyectos.length}`);
        
        // Obtener subproyectos (proyectos con linea_servicio = 'Hereda' y proyecto_padre en los proyectos principales)
        const ids_proyectos = proyectos.map(p => p.id_proyecto);
        const subproyectos = await ProyectosExternosModel.obtenerSubproyectos(ids_proyectos);
        
        // Agrupar subproyectos por proyecto padre (usar comparación como string para evitar problemas de tipos)
        const subproyectosPorPadre = {};
        subproyectos.forEach(sub => {
            const proyectoPadreId = String(sub.proyecto_padre || '');
            if (proyectoPadreId && !subproyectosPorPadre[proyectoPadreId]) {
                subproyectosPorPadre[proyectoPadreId] = [];
            }
            if (proyectoPadreId) {
                subproyectosPorPadre[proyectoPadreId].push(sub);
            }
        });
        
        // Agregar subproyectos a cada proyecto padre
        const proyectosConSubproyectos = proyectos.map(proyecto => {
            const proyectoIdStr = String(proyecto.id_proyecto);
            const subproyectosDelProyecto = subproyectosPorPadre[proyectoIdStr] || [];
            return {
                ...proyecto,
                tiene_subproyectos: subproyectosDelProyecto.length > 0,
                subproyectos: subproyectosDelProyecto
            };
        });
        
        res.json({
            success: true,
            data: proyectosConSubproyectos
        });
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos de proyectos'
        });
    }
}

/**
 * Obtener un proyecto por ID
 */
async function obtenerProyectoPorId(req, res) {
    try {
        const id_proyecto = parseInt(req.params.id_proyecto);
        
        if (!id_proyecto || isNaN(id_proyecto)) {
            return res.status(400).json({
                success: false,
                error: 'ID de proyecto inválido'
            });
        }

        const proyecto = await ProyectosExternosModel.obtenerPorId(id_proyecto);
        
        if (!proyecto) {
            return res.status(404).json({
                success: false,
                error: 'Proyecto no encontrado'
            });
        }

        // Obtener subproyectos si tiene
        const ids_proyectos = [id_proyecto];
        const subproyectos = await ProyectosExternosModel.obtenerSubproyectos(ids_proyectos);
        const subproyectosDelProyecto = subproyectos.filter(sub => String(sub.proyecto_padre) === String(id_proyecto));
        
        // Obtener epics secundarios para detectar si tiene subproyectos
        const epicsSecundarios = await EpicsProyectoModel.obtenerEpicsSecundariosPorProyectos([id_proyecto]);
        const epicsDelProyecto = epicsSecundarios[id_proyecto] || [];
        const proyectosSecundariosUnicos = {};
        epicsDelProyecto.forEach(epic => {
            const proyectoPadre = epic.proyecto_padre;
            if (proyectoPadre && !proyectosSecundariosUnicos[proyectoPadre]) {
                proyectosSecundariosUnicos[proyectoPadre] = true;
            }
        });
        const tieneSubproyectos = Object.keys(proyectosSecundariosUnicos).length > 0 || subproyectosDelProyecto.length > 0;

        const proyectoCompleto = {
            ...proyecto,
            tiene_subproyectos: tieneSubproyectos,
            subproyectos: subproyectosDelProyecto
        };

        res.json({
            success: true,
            data: proyectoCompleto
        });
    } catch (error) {
        console.error('Error al obtener proyecto por ID:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos del proyecto'
        });
    }
}

/**
 * Actualizar datos editables de mantenimiento
 */
async function actualizarMantenimiento(req, res) {
    try {
        const { id_proyecto } = req.params;
        const datos = req.body;
        
        const resultado = await MantenimientoModel.actualizar(id_proyecto, datos);
        
        if (!resultado) {
            return res.status(404).json({
                success: false,
                error: 'Mantenimiento no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al actualizar mantenimiento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar mantenimiento'
        });
    }
}

/**
 * Actualizar datos editables de proyecto externo
 */
async function actualizarProyectoExterno(req, res) {
    try {
        const { id_proyecto } = req.params;
        const datos = req.body;
        
        const resultado = await ProyectosExternosModel.actualizar(id_proyecto, datos);
        
        if (!resultado) {
            return res.status(404).json({
                success: false,
                error: 'Proyecto externo no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al actualizar proyecto externo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar proyecto externo'
        });
    }
}

/**
 * Actualizar datos editables de proyecto
 */
async function actualizarProyecto(req, res) {
    try {
        const { id_proyecto } = req.params;
        const datos = req.body;
        
        const resultado = await ProyectosExternosModel.actualizar(id_proyecto, datos);
        
        if (!resultado) {
            return res.status(404).json({
                success: false,
                error: 'Proyecto no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al actualizar proyecto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar proyecto'
        });
    }
}

// Funciones para accionables (mantener compatibilidad con código antiguo)
async function actualizarAccionables(req, res) {
    try {
        const { id_proyecto } = req.params;
        const { accionables, fecha_accionable, asignado_accionable } = req.body;
        
        const datosActualizar = {};
        if ('accionables' in req.body) {
            datosActualizar.accionables = accionables || null;
        }
        if ('fecha_accionable' in req.body) {
            datosActualizar.fecha_accionable = fecha_accionable || null;
        }
        if ('asignado_accionable' in req.body) {
            datosActualizar.asignado_accionable = asignado_accionable || null;
        }
        
        const resultado = await ProyectosExternosModel.actualizar(id_proyecto, datosActualizar);
        
        if (!resultado) {
            return res.status(404).json({
                success: false,
                error: 'Proyecto no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al actualizar accionables:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Obtener todos los accionables de un proyecto
async function obtenerAccionablesProyecto(req, res) {
    try {
        const { id_proyecto } = req.params;
        const accionables = await AccionablesProyectoModel.obtenerPorProyecto(id_proyecto);
        
        res.json({
            success: true,
            data: accionables
        });
    } catch (error) {
        console.error('Error al obtener accionables:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Crear un nuevo accionable
async function crearAccionable(req, res) {
    try {
        const { id_proyecto } = req.params;
        const { fecha_accionable, asignado_accionable, accionable } = req.body;
        
        const nuevoAccionable = await AccionablesProyectoModel.crear(id_proyecto, {
            fecha_accionable: fecha_accionable || null,
            asignado_accionable: asignado_accionable || null,
            accionable: accionable || null
        });
        
        res.json({
            success: true,
            data: nuevoAccionable
        });
    } catch (error) {
        console.error('Error al crear accionable:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Actualizar un accionable
async function actualizarAccionable(req, res) {
    try {
        const { id } = req.params;
        const { fecha_accionable, asignado_accionable, accionable } = req.body;
        
        const datosActualizar = {};
        if ('fecha_accionable' in req.body) {
            datosActualizar.fecha_accionable = fecha_accionable || null;
        }
        if ('asignado_accionable' in req.body) {
            datosActualizar.asignado_accionable = asignado_accionable || null;
        }
        if ('accionable' in req.body) {
            datosActualizar.accionable = accionable || null;
        }
        
        const accionableActualizado = await AccionablesProyectoModel.actualizar(id, datosActualizar);
        
        if (!accionableActualizado) {
            return res.status(404).json({
                success: false,
                error: 'Accionable no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: accionableActualizado
        });
    } catch (error) {
        console.error('Error al actualizar accionable:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Eliminar un accionable
async function eliminarAccionable(req, res) {
    try {
        const { id } = req.params;
        const eliminado = await AccionablesProyectoModel.eliminar(id);
        
        if (!eliminado) {
            return res.status(404).json({
                success: false,
                error: 'Accionable no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Accionable eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar accionable:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Obtener sugerencias de búsqueda para mantenimiento
 */
async function obtenerSugerenciasMantenimiento(req, res) {
    try {
        const query = req.query.q || '';
        
        if (!query || query.length < 2) {
            return res.json({
                success: true,
                sugerencias: []
            });
        }
        
        const filtros = {
            producto: req.query.producto || null,
            equipo: req.query.equipo || null,
            busqueda: query
        };
        
        const mantenimientos = await MantenimientoModel.obtenerTodos(filtros);
        
        // Limitar a 8 sugerencias
        const sugerencias = mantenimientos.slice(0, 8).map(item => ({
            id_proyecto: item.id_proyecto,
            nombre_proyecto: item.nombre_proyecto || 'Sin nombre',
            cliente: item.cliente || '',
            producto: item.producto || ''
        }));
        
        res.json({
            success: true,
            sugerencias
        });
    } catch (error) {
        console.error('Error al obtener sugerencias de mantenimiento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener sugerencias'
        });
    }
}

/**
 * Obtener sugerencias de búsqueda para proyectos
 */
async function obtenerSugerenciasProyectos(req, res) {
    try {
        const query = req.query.q || '';
        
        if (!query || query.length < 2) {
            return res.json({
                success: true,
                sugerencias: []
            });
        }
        
        const filtros = {
            producto: req.query.producto || null,
            equipo: req.query.equipo || null,
            busqueda: query,
            incluirCerrados: req.query.incluirCerrados === 'true'
        };
        
        const proyectos = await ProyectosExternosModel.obtenerTodos(filtros);
        
        // Limitar a 8 sugerencias
        const sugerencias = proyectos.slice(0, 8).map(item => ({
            id_proyecto: item.id_proyecto,
            nombre_proyecto: item.nombre_proyecto || 'Sin nombre',
            cliente: item.cliente || '',
            producto: item.producto || '',
            estado: item.estado || ''
        }));
        
        res.json({
            success: true,
            sugerencias
        });
    } catch (error) {
        console.error('Error al obtener sugerencias de proyectos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener sugerencias'
        });
    }
}

/**
 * Sincronizar epics de un proyecto
 */
async function sincronizarEpics(req, res) {
    try {
        const { id_proyecto, codigo_proyecto } = req.body;
        
        if (!id_proyecto || !codigo_proyecto) {
            return res.status(400).json({
                success: false,
                error: 'ID de proyecto y código son requeridos'
            });
        }
        
        // Obtener epics de Redmine
        const epics = await obtenerEpics(codigo_proyecto);
        
        // Mapear epics
        const epicsMapeados = epics.map(mapearEpic);
        
        // Guardar en base de datos
        const resultado = await EpicsProyectoModel.guardarEpics(id_proyecto, epicsMapeados);
        
        // Obtener totales actualizados
        const totales = await EpicsProyectoModel.obtenerTotalesPorProyecto(id_proyecto);
        
        // Actualizar fechas del proyecto si hay epics (sin actualizar updated_at)
        if (totales.total_epics > 0) {
            await ProyectosExternosModel.actualizar(id_proyecto, {
                fecha_inicio: totales.fecha_inicio_minima,
                fecha_fin: totales.fecha_fin_maxima
            }, false); // false = no actualizar updated_at
        }
        
        res.json({
            success: true,
            data: {
                insertados: resultado.insertados,
                actualizados: resultado.actualizados,
                total: resultado.total,
                horas_estimadas: totales.horas_estimadas,
                horas_realizadas: totales.horas_realizadas,
                fecha_inicio: totales.fecha_inicio_minima,
                fecha_fin: totales.fecha_fin_maxima
            }
        });
    } catch (error) {
        console.error('Error al sincronizar epics:', error);
        res.status(500).json({
            success: false,
            error: 'Error al sincronizar epics: ' + error.message
        });
    }
}

/**
 * Obtener epics de un proyecto desde la base de datos
 */
async function obtenerEpicsProyecto(req, res) {
    try {
        const id_proyecto = parseInt(req.params.id_proyecto);
        
        if (!id_proyecto) {
            return res.status(400).json({
                success: false,
                error: 'ID de proyecto es requerido'
            });
        }
        
        const epics = await EpicsProyectoModel.obtenerPorProyecto(id_proyecto);
        
        res.json({
            success: true,
            data: epics
        });
    } catch (error) {
        console.error('Error al obtener epics:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener epics'
        });
    }
}

/**
 * Obtener métricas del dashboard
 */
async function obtenerMetricasDashboard(req, res) {
    try {
        const metricas = await ProyectosExternosModel.obtenerMetricasDashboard();
        
        res.json({
            success: true,
            data: metricas
        });
    } catch (error) {
        console.error('Error al obtener métricas del dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener métricas del dashboard'
        });
    }
}

/**
 * Obtener subproyectos de un proyecto específico (carga lazy - optimizado)
 */
// Función obtenerSubproyectos eliminada - ahora los subproyectos se obtienen directamente en obtenerProyectos

/**
 * Actualizar datos editables de subproyecto
 */
async function actualizarSubproyecto(req, res) {
    try {
        const { id_subproyecto } = req.params;
        const datos = req.body;
        
        console.log('📝 actualizarSubproyecto - id_subproyecto:', id_subproyecto, 'datos:', datos);
        
        // Validar que id_subproyecto es un número
        const idSubproyectoNum = parseInt(id_subproyecto);
        if (isNaN(idSubproyectoNum)) {
            return res.status(400).json({
                success: false,
                error: 'ID de subproyecto inválido'
            });
        }
        
        const resultado = await SubproyectosModel.actualizar(idSubproyectoNum, datos);
        
        if (!resultado) {
            return res.status(404).json({
                success: false,
                error: 'Subproyecto no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al actualizar subproyecto:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al actualizar subproyecto'
        });
    }
}

/**
 * Renderizar página de proyectos internos
 */
async function proyectosInternos(req, res) {
    try {
        const producto = req.query.producto || null;
        
        // Obtener productos con equipos
        const productosEquipos = await ProductosEquiposModel.obtenerTodos();
        
        res.render('pages/proyectos-internos', {
            title: 'Proyectos Internos',
            productosEquipos: productosEquipos,
            productoActual: producto,
            activeMenu: 'proyectos-internos',
            isAdmin: req.isAdmin || false
        });
    } catch (error) {
        console.error('Error en proyectosInternos:', error);
        res.status(500).render('pages/error', {
            title: 'Error',
            error: 'Error al cargar la página de proyectos internos'
        });
    }
}

/**
 * Obtener datos de proyectos internos
 * Usa la misma tabla que proyectos externos pero con filtro de categoría "Proyectos Internos"
 */
async function obtenerProyectosInternos(req, res) {
    try {
        const producto = req.query.producto || null;
        const filtros = {
            producto: producto,
            categoria: 'Proyectos Internos', // Filtro específico para proyectos internos
            busqueda: req.query.busqueda || null,
            orden: req.query.orden || 'nombre_proyecto',
            direccion: req.query.direccion || 'asc'
        };
        
        // Usar ProyectosExternosModel con filtro de categoría
        const proyectos = await ProyectosExternosModel.obtenerTodos(filtros);
        
        // Obtener epics secundarios para detectar si tiene subproyectos (igual que en obtenerProyectos)
        const ids_proyectos = proyectos.map(p => p.id_proyecto);
        const epicsSecundarios = await EpicsProyectoModel.obtenerEpicsSecundariosPorProyectos(ids_proyectos);
        
        // Marcar si tiene subproyectos (carga lazy)
        const proyectosConInfoSubproyectos = proyectos.map(proyecto => {
            const epicsDelProyecto = epicsSecundarios[proyecto.id_proyecto] || [];
            // Agrupar epics por proyecto_padre para contar subproyectos únicos
            const proyectosSecundariosUnicos = {};
            epicsDelProyecto.forEach(epic => {
                const proyectoPadre = epic.proyecto_padre;
                if (proyectoPadre && !proyectosSecundariosUnicos[proyectoPadre]) {
                    proyectosSecundariosUnicos[proyectoPadre] = true;
                }
            });
            const tieneSubproyectos = Object.keys(proyectosSecundariosUnicos).length > 0;
            
            return {
                ...proyecto,
                tiene_subproyectos: tieneSubproyectos,
                subproyectos: [] // No cargar todavía, se cargarán bajo demanda
            };
        });
        
        res.json({
            success: true,
            data: proyectosConInfoSubproyectos
        });
    } catch (error) {
        console.error('Error al obtener proyectos internos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos de proyectos internos'
        });
    }
}

/**
 * Actualizar datos editables de proyecto interno
 */
async function actualizarProyectoInterno(req, res) {
    try {
        const { id_proyecto } = req.params;
        const datos = req.body;
        
        const idProyectoNum = parseInt(id_proyecto);
        if (isNaN(idProyectoNum)) {
            return res.status(400).json({
                success: false,
                error: 'ID de proyecto inválido'
            });
        }
        
        // Usar ProyectosExternosModel (misma tabla que proyectos)
        const resultado = await ProyectosExternosModel.actualizar(idProyectoNum, datos);
        
        if (!resultado) {
            return res.status(404).json({
                success: false,
                error: 'Proyecto interno no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al actualizar proyecto interno:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al actualizar proyecto interno'
        });
    }
}

/**
 * Obtener sugerencias de búsqueda para proyectos internos
 * Usa la misma tabla que proyectos externos pero con filtro de categoría "Proyectos Internos"
 */
async function obtenerSugerenciasProyectosInternos(req, res) {
    try {
        const query = req.query.q || '';
        
        if (!query || query.length < 2) {
            return res.json({
                success: true,
                sugerencias: []
            });
        }
        
        const filtros = {
            categoria: 'Proyectos Internos', // Filtro específico para proyectos internos
            busqueda: query
        };
        
        // Usar ProyectosExternosModel con filtro de categoría
        const proyectos = await ProyectosExternosModel.obtenerTodos(filtros);
        
        const sugerencias = proyectos.slice(0, 10).map(proyecto => ({
            nombre_proyecto: proyecto.nombre_proyecto,
            cliente: proyecto.cliente,
            producto: proyecto.producto
        }));
        
        res.json({
            success: true,
            sugerencias: sugerencias
        });
    } catch (error) {
        console.error('Error al obtener sugerencias de proyectos internos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener sugerencias'
        });
    }
}

/**
 * Sincronizar epics masivamente para todos los proyectos no cerrados de un equipo/producto
 * Usa Server-Sent Events para enviar actualizaciones en tiempo real
 */
async function sincronizarEpicsMasivo(req, res) {
    try {
        const { producto, equipo } = req.body;

        if (!producto) {
            return res.status(400).json({
                success: false,
                error: 'Producto es requerido'
            });
        }

        console.log('🔄 Iniciando sincronización masiva de epics...');
        console.log('   Producto:', producto);
        console.log('   Equipo:', equipo || 'todos');

        // Configurar Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Deshabilitar buffering en nginx

        // Función helper para verificar si la conexión está cerrada
        // IMPORTANTE: En SSE, el request puede cerrarse normalmente después de leer el body,
        // pero el response sigue activo. Solo debemos verificar el response.
        const esConexionCerrada = () => {
            // Solo verificar el response, no el request (el request puede cerrarse normalmente en SSE)
            return res.closed || res.destroyed || res.finished;
        };

        // Escuchar el evento de cierre de conexión del RESPONSE (no del request)
        let conexionCerrada = false;
        res.on('close', () => {
            conexionCerrada = true;
            console.log('⚠️ Cliente cerró la conexión. Cancelando sincronización...');
        });
        
        // Escuchar errores en el response
        res.on('error', (error) => {
            if (error.code === 'EPIPE' || error.code === 'ECONNRESET') {
                conexionCerrada = true;
            }
        });

        // Función helper para enviar eventos
        const enviarEvento = (tipo, datos) => {
            // Verificar si la conexión está cerrada antes de enviar
            if (conexionCerrada || esConexionCerrada()) {
                return;
            }
            try {
                res.write(`event: ${tipo}\n`);
                res.write(`data: ${JSON.stringify(datos)}\n\n`);
            } catch (error) {
                // Si hay error al escribir (conexión cerrada), marcar como cerrada
                if (error.code === 'EPIPE' || error.code === 'ECONNRESET') {
                    conexionCerrada = true;
                }
            }
        };

        // Aplicar los mismos filtros que se usan en la vista "Proyectos"
        const categoria = req.body.categoria || null;
        const incluirCerrados = req.body.incluirCerrados === true || req.body.incluirCerrados === 'true';
        
        const filtros = {
            producto: producto,
            equipo: equipo && equipo !== '*' && equipo !== 'null' ? equipo : null,
            categoria: categoria,
            incluirCerrados: incluirCerrados
        };

        // Si no hay categoría específica, excluir mantenimiento y on-site
        if (!categoria) {
            filtros.excluirCategorias = ['Mantenimiento', 'On-Site'];
        }

        const proyectos = await ProyectosExternosModel.obtenerTodos(filtros);

        if (!proyectos || proyectos.length === 0) {
            enviarEvento('completado', {
                success: true,
                data: {
                    procesados: 0,
                    exitosos: 0,
                    errores: 0,
                    proyectos: []
                }
            });
            res.end();
            return;
        }

        // Incluir todos los proyectos que tengan código (incluyendo proyectos padre)
        const proyectosParaSincronizar = proyectos.filter(p => p.codigo_proyecto);
        
        console.log(`   Total proyectos encontrados: ${proyectos.length}`);
        console.log(`   Proyectos a sincronizar: ${proyectosParaSincronizar.length}`);

        // Enviar información inicial
        enviarEvento('inicio', {
            totalProyectos: proyectosParaSincronizar.length
        });

        const resultados = {
            procesados: 0,
            exitosos: 0,
            errores: 0,
            proyectos: []
        };

        // Procesar secuencialmente con delay reducido
        const delayEntreProyectos = 100; // Reducido de 500ms a 100ms para optimizar velocidad

        for (let i = 0; i < proyectosParaSincronizar.length; i++) {
            // Verificar si la conexión está cerrada antes de procesar cada proyecto
            if (conexionCerrada || esConexionCerrada()) {
                console.log(`\n⚠️ Sincronización cancelada por el cliente en el proyecto ${i + 1}/${proyectosParaSincronizar.length}`);
                break;
            }

            const proyecto = proyectosParaSincronizar[i];
            resultados.procesados++;

            try {
                console.log(`\n📦 [${i + 1}/${proyectosParaSincronizar.length}] Sincronizando epics para proyecto: ${proyecto.nombre_proyecto} (${proyecto.codigo_proyecto})`);

                // Enviar evento de inicio de proyecto
                enviarEvento('proyecto_inicio', {
                    index: i + 1,
                    total: proyectosParaSincronizar.length,
                    nombre: proyecto.nombre_proyecto,
                    codigo: proyecto.codigo_proyecto
                });

                // Verificar si es proyecto padre (tiene subproyectos)
                const subproyectosFiltros = {
                    proyecto_padre: proyecto.id_proyecto,
                    producto: filtros.producto,
                    equipo: filtros.equipo,
                    incluirCerrados: false // Solo subproyectos no cerrados
                };
                const subproyectos = await ProyectosExternosModel.obtenerSubproyectosPorPadre(subproyectosFiltros);
                const esProyectoPadre = subproyectos && subproyectos.length > 0;

                let epicsMapeados = [];
                let totalEpicsInsertados = 0;
                let totalEpicsActualizados = 0;
                let totalEpics = 0;

                if (esProyectoPadre) {
                    // Si es proyecto padre, obtener epics de todos sus subproyectos no cerrados
                    // IMPORTANTE: Los epics se guardan con el id_proyecto del subproyecto, NO del proyecto padre
                    console.log(`   🔍 Proyecto padre detectado. Obteniendo epics de ${subproyectos.length} subproyectos no cerrados...`);
                    
                    for (const subproyecto of subproyectos) {
                        // Verificar si la conexión está cerrada antes de procesar cada subproyecto
                        if (conexionCerrada || esConexionCerrada()) {
                            console.log(`   ⚠️ Sincronización cancelada. Deteniendo procesamiento de subproyectos...`);
                            break;
                        }

                        if (!subproyecto.codigo_proyecto) {
                            console.log(`   ⚠️ Subproyecto ${subproyecto.nombre_proyecto} no tiene código, saltando...`);
                            continue;
                        }

                        try {
                            console.log(`   📋 Obteniendo epics de subproyecto: ${subproyecto.nombre_proyecto} (${subproyecto.codigo_proyecto})`);
                            
                            // Enviar evento de inicio de subproyecto
                            enviarEvento('subproyecto_inicio', {
                                index: i + 1,
                                proyectoNombre: proyecto.nombre_proyecto,
                                subproyectoNombre: subproyecto.nombre_proyecto,
                                subproyectoCodigo: subproyecto.codigo_proyecto
                            });
                            
                            // Verificar cancelación antes de obtener epics
                            if (conexionCerrada || esConexionCerrada()) {
                                console.log(`   ⚠️ Sincronización cancelada antes de obtener epics del subproyecto ${subproyecto.nombre_proyecto}`);
                                break;
                            }

                            // Obtener epics del subproyecto
                            const epicsSubproyecto = await obtenerEpicsConProgreso(subproyecto.codigo_proyecto, (epicsObtenidos, totalEstimado) => {
                                // Verificar cancelación en el callback de progreso
                                if (conexionCerrada || esConexionCerrada()) {
                                    return;
                                }
                                enviarEvento('epics_progreso', {
                                    index: i + 1,
                                    nombre: `${proyecto.nombre_proyecto} > ${subproyecto.nombre_proyecto}`,
                                    epicsObtenidos: epicsObtenidos,
                                    totalEstimado: totalEstimado
                                });
                            });

                            // Verificar cancelación después de obtener epics
                            if (conexionCerrada || esConexionCerrada()) {
                                console.log(`   ⚠️ Sincronización cancelada después de obtener epics del subproyecto ${subproyecto.nombre_proyecto}`);
                                break;
                            }

                            // Mapear epics del subproyecto
                            const epicsMapeadosSub = epicsSubproyecto.map(epic => mapearEpic(epic));

                            // Guardar epics con el id_proyecto del subproyecto (NO del proyecto padre)
                            if (epicsMapeadosSub.length > 0) {
                                const resultadoSub = await EpicsProyectoModel.guardarEpics(subproyecto.id_proyecto, epicsMapeadosSub);
                                
                                // Actualizar fechas del subproyecto basándose en sus epics
                                const totalesSub = await EpicsProyectoModel.obtenerTotalesPorProyecto(subproyecto.id_proyecto);
                                if (totalesSub.total_epics > 0) {
                                    await ProyectosExternosModel.actualizar(subproyecto.id_proyecto, {
                                        fecha_inicio: totalesSub.fecha_inicio_minima,
                                        fecha_fin: totalesSub.fecha_fin_maxima
                                    }, false);
                                }
                                
                                totalEpicsInsertados += resultadoSub.insertados;
                                totalEpicsActualizados += resultadoSub.actualizados;
                                totalEpics += resultadoSub.total;
                                
                                // Enviar evento de subproyecto completado
                                enviarEvento('subproyecto_completado', {
                                    index: i + 1,
                                    proyectoNombre: proyecto.nombre_proyecto,
                                    subproyectoNombre: subproyecto.nombre_proyecto,
                                    epics: epicsMapeadosSub.length,
                                    insertados: resultadoSub.insertados,
                                    actualizados: resultadoSub.actualizados
                                });
                                
                                console.log(`   ✅ ${epicsMapeadosSub.length} epics obtenidos del subproyecto ${subproyecto.nombre_proyecto} (${resultadoSub.insertados} insertados, ${resultadoSub.actualizados} actualizados)`);
                            } else {
                                // Enviar evento de subproyecto sin epics
                                enviarEvento('subproyecto_completado', {
                                    index: i + 1,
                                    proyectoNombre: proyecto.nombre_proyecto,
                                    subproyectoNombre: subproyecto.nombre_proyecto,
                                    epics: 0,
                                    insertados: 0,
                                    actualizados: 0
                                });
                                
                                console.log(`   ℹ️ No se encontraron epics en el subproyecto ${subproyecto.nombre_proyecto}`);
                            }
                        } catch (error) {
                            console.error(`   ⚠️ Error al obtener epics del subproyecto ${subproyecto.nombre_proyecto}:`, error.message);
                            // Continuar con el siguiente subproyecto
                        }
                    }
                } else {
                    // Verificar cancelación antes de obtener epics
                    if (conexionCerrada || esConexionCerrada()) {
                        console.log(`   ⚠️ Sincronización cancelada antes de obtener epics del proyecto ${proyecto.nombre_proyecto}`);
                        break;
                    }

                    // Si no es proyecto padre, obtener epics normalmente
                    const epics = await obtenerEpicsConProgreso(proyecto.codigo_proyecto, (epicsObtenidos, totalEstimado) => {
                        // Verificar cancelación en el callback de progreso
                        if (conexionCerrada || esConexionCerrada()) {
                            return;
                        }
                        enviarEvento('epics_progreso', {
                            index: i + 1,
                            nombre: proyecto.nombre_proyecto,
                            epicsObtenidos: epicsObtenidos,
                            totalEstimado: totalEstimado
                        });
                    });

                    // Verificar cancelación después de obtener epics
                    if (conexionCerrada || esConexionCerrada()) {
                        console.log(`   ⚠️ Sincronización cancelada después de obtener epics del proyecto ${proyecto.nombre_proyecto}`);
                        break;
                    }

                    // Mapear epics
                    epicsMapeados = epics.map(mapearEpic);

                    // Guardar en base de datos
                    const resultado = await EpicsProyectoModel.guardarEpics(proyecto.id_proyecto, epicsMapeados);
                    totalEpicsInsertados = resultado.insertados;
                    totalEpicsActualizados = resultado.actualizados;
                    totalEpics = resultado.total;
                }

                // Actualizar fechas del proyecto
                if (esProyectoPadre) {
                    // Para proyectos padre, obtener fechas de todos los subproyectos
                    const fechasInicio = [];
                    const fechasFin = [];
                    
                    for (const subproyecto of subproyectos) {
                        const totalesSub = await EpicsProyectoModel.obtenerTotalesPorProyecto(subproyecto.id_proyecto);
                        if (totalesSub.fecha_inicio_minima) {
                            fechasInicio.push(totalesSub.fecha_inicio_minima);
                        }
                        if (totalesSub.fecha_fin_maxima) {
                            fechasFin.push(totalesSub.fecha_fin_maxima);
                        }
                    }
                    
                    // Actualizar proyecto padre con fechas mínimas/máximas de subproyectos
                    if (fechasInicio.length > 0 || fechasFin.length > 0) {
                        const fechaInicioMin = fechasInicio.length > 0 ? fechasInicio.sort()[0] : null;
                        const fechaFinMax = fechasFin.length > 0 ? fechasFin.sort().reverse()[0] : null;
                        
                        await ProyectosExternosModel.actualizar(proyecto.id_proyecto, {
                            fecha_inicio: fechaInicioMin,
                            fecha_fin: fechaFinMax
                        }, false);
                    }
                } else {
                    // Para proyectos normales, obtener totales de sus propios epics
                    const totales = await EpicsProyectoModel.obtenerTotalesPorProyecto(proyecto.id_proyecto);
                    
                    // Actualizar fechas del proyecto si hay epics
                    if (totales.total_epics > 0) {
                        await ProyectosExternosModel.actualizar(proyecto.id_proyecto, {
                            fecha_inicio: totales.fecha_inicio_minima,
                            fecha_fin: totales.fecha_fin_maxima
                        }, false);
                    }
                }

                resultados.exitosos++;
                resultados.proyectos.push({
                    id_proyecto: proyecto.id_proyecto,
                    nombre_proyecto: proyecto.nombre_proyecto,
                    codigo_proyecto: proyecto.codigo_proyecto,
                    success: true,
                    epics: totalEpics,
                    insertados: totalEpicsInsertados,
                    actualizados: totalEpicsActualizados,
                    esProyectoPadre: esProyectoPadre,
                    subproyectosProcesados: esProyectoPadre ? subproyectos.length : 0
                });

                console.log(`   ✅ Sincronizado: ${totalEpics} epics (${totalEpicsInsertados} insertados, ${totalEpicsActualizados} actualizados)${esProyectoPadre ? ` desde ${subproyectos.length} subproyectos` : ''}`);

                // Enviar evento de proyecto completado
                enviarEvento('proyecto_completado', {
                    index: i + 1,
                    total: proyectosParaSincronizar.length,
                    nombre: proyecto.nombre_proyecto,
                    epics: totalEpics,
                    insertados: totalEpicsInsertados,
                    actualizados: totalEpicsActualizados,
                    success: true,
                    esProyectoPadre: esProyectoPadre
                });

            } catch (error) {
                console.error(`   ❌ Error al sincronizar epics para proyecto ${proyecto.nombre_proyecto}:`, error.message);
                resultados.errores++;
                resultados.proyectos.push({
                    id_proyecto: proyecto.id_proyecto,
                    nombre_proyecto: proyecto.nombre_proyecto,
                    codigo_proyecto: proyecto.codigo_proyecto,
                    success: false,
                    error: error.message
                });

                // Enviar evento de error
                enviarEvento('proyecto_completado', {
                    index: i + 1,
                    total: proyectosParaSincronizar.length,
                    nombre: proyecto.nombre_proyecto,
                    success: false,
                    error: error.message
                });
            }

            // Verificar si la conexión está cerrada antes del delay
            if (conexionCerrada || esConexionCerrada()) {
                console.log(`\n⚠️ Sincronización cancelada por el cliente`);
                break;
            }

            // Delay entre proyectos (excepto el último)
            if (i < proyectosParaSincronizar.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delayEntreProyectos));
            }
        }

        // Si la conexión fue cerrada, no enviar el evento de finalización
        if (conexionCerrada || esConexionCerrada()) {
            console.log(`\n⚠️ Sincronización cancelada. Procesados: ${resultados.procesados} proyectos antes de la cancelación`);
            res.end();
            return;
        }

        console.log(`\n✅ Sincronización masiva completada:`);
        console.log(`   Procesados: ${resultados.procesados}`);
        console.log(`   Exitosos: ${resultados.exitosos}`);
        console.log(`   Errores: ${resultados.errores}`);

        // Enviar evento de finalización
        enviarEvento('completado', {
            success: true,
            data: resultados
        });

        res.end();
    } catch (error) {
        console.error('Error al sincronizar epics masivamente:', error);
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({
            success: false,
            error: 'Error al sincronizar epics masivamente: ' + error.message
        })}\n\n`);
        res.end();
    }
}

// Función auxiliar para obtener epics con progreso
async function obtenerEpicsConProgreso(projectId, onProgress = null) {
    const { obtenerEpics } = require('../services/redmineService');
    
    // Obtener epics de forma paginada para poder enviar progreso
    const REDMINE_URL = process.env.REDMINE_URL;
    const REDMINE_TOKEN = process.env.REDMINE_TOKEN;
    
    const epics = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let totalEstimado = null;

    while (hasMore) {
        const url = new URL(`${REDMINE_URL}/issues.json`);
        url.searchParams.set('project_id', projectId.toString());
        url.searchParams.set('tracker_id', '19');
        url.searchParams.set('limit', limit.toString());
        url.searchParams.set('offset', offset.toString());
        url.searchParams.set('status_id', '*');

        const urlString = url.toString();
        const urlLog = urlString.replace(/key=[^&]+/, 'key=***').replace(/X-Redmine-API-Key=[^&]+/, 'X-Redmine-API-Key=***');
        console.log(`🔍 Consultando epics de Redmine: ${urlLog}`);

        const response = await fetch(urlString, {
            headers: {
                'X-Redmine-API-Key': REDMINE_TOKEN
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener epics: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const items = data.issues || [];
        epics.push(...items);

        // Obtener total estimado de la primera respuesta
        if (totalEstimado === null && data.total_count !== undefined) {
            totalEstimado = data.total_count;
        }

        // Llamar callback de progreso si está disponible
        if (onProgress && typeof onProgress === 'function') {
            onProgress(epics.length, totalEstimado || epics.length);
        }

        const totalCount = data.total_count || items.length;
        hasMore = totalCount > (offset + limit);
        offset += limit;

        if (!hasMore) {
            break;
        }

        // Pausa reducida entre requests (optimización)
        if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 50)); // Reducido de 200ms a 50ms
        }
    }

    return epics;
}

module.exports = {
    index,
    obtenerMantenimiento,
    obtenerProyectos,
    obtenerProyectoPorId,
    obtenerEpics: obtenerEpicsProyecto,
    actualizarMantenimiento,
    actualizarProyecto,
    actualizarAccionables,
    actualizarSubproyecto,
    obtenerSugerenciasMantenimiento,
    obtenerSugerenciasProyectos,
    sincronizarEpics,
    sincronizarEpicsMasivo,
    obtenerMetricasDashboard,
    proyectosInternos,
    obtenerProyectosInternos,
    actualizarProyectoInterno,
    obtenerSugerenciasProyectosInternos,
    obtenerAccionablesProyecto,
    crearAccionable,
    actualizarAccionable,
    eliminarAccionable
};

