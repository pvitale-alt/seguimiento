/**
 * Funciones de carga de datos
 * Seguimiento de Proyectos
 */

// Función para mostrar dashboard cuando no hay producto seleccionado
async function mostrarDashboard() {
    const contenido = document.getElementById('contenido');
    
    // Mostrar loading
    contenido.innerHTML = '<div class="empty-state"><div class="spinner"></div><div class="empty-state-text">Cargando métricas...</div></div>';
    
    try {
        const response = await fetch('/api/dashboard/metricas');
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al cargar métricas');
        }
        
        const metricas = result.data || [];
        
        // Crear un mapa de métricas por producto
        const metricasMap = {};
        metricas.forEach(m => {
            metricasMap[m.producto] = m;
        });
        
        // Orden específico de productos
        const ordenProductos = [
            'Abbaco',
            'Portfolio',
            'Portfolio Cloud',
            'Unitrade',
            'Trading Room',
            'OMS',
            'Pepper'
        ];
        
        // Crear un mapa de productos ordenados
        const productosOrdenados = [];
        ordenProductos.forEach(function(nombreOrdenado) {
            const productoEncontrado = productosEquiposData.find(function(item) {
                const productoNormalizado = item.producto === 'OMS' ? 'Order Management' : item.producto;
                return productoNormalizado === nombreOrdenado || item.producto === nombreOrdenado;
            });
            if (productoEncontrado) {
                productosOrdenados.push(productoEncontrado);
            }
        });
        
        // Agregar productos que no están en el orden específico
        productosEquiposData.forEach(function(item) {
            if (!productosOrdenados.includes(item)) {
                productosOrdenados.push(item);
            }
        });
        
        // Función para convertir hex a rgba
        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
        }
        
        // Función para obtener colores únicos por producto
        function obtenerColoresProducto(producto) {
            const colores = {
                'Abbaco': { primary: '#4285F4', secondary: '#E8F0FE', gradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)' },
                'Portfolio': { primary: '#EA4335', secondary: '#FCE8E6', gradient: 'linear-gradient(135deg, #EA4335 0%, #FBBC04 100%)' },
                'Portfolio Cloud': { primary: '#34A853', secondary: '#E6F4EA', gradient: 'linear-gradient(135deg, #34A853 0%, #4285F4 100%)' },
                'Unitrade': { primary: '#FBBC04', secondary: '#FEF7E0', gradient: 'linear-gradient(135deg, #FBBC04 0%, #EA4335 100%)' },
                'Trading Room': { primary: '#9C27B0', secondary: '#F3E5F5', gradient: 'linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)' },
                'Order Management': { primary: '#00BCD4', secondary: '#E0F7FA', gradient: 'linear-gradient(135deg, #00BCD4 0%, #009688 100%)' },
                'OMS': { primary: '#00BCD4', secondary: '#E0F7FA', gradient: 'linear-gradient(135deg, #00BCD4 0%, #009688 100%)' },
                'Pepper': { primary: '#FF5722', secondary: '#FFEBEE', gradient: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)' }
            };
            return colores[producto] || { primary: '#1A73E8', secondary: '#E8F0FE', gradient: 'linear-gradient(135deg, #1A73E8 0%, #4285F4 100%)' };
        }
        
        let dashboardHTML = '<div style="padding: 32px; position: relative;">';
        dashboardHTML += '<div style="position: relative; z-index: 1; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 28px;">';
        
        productosOrdenados.forEach(function(item) {
            const producto = item.producto;
            const productoNormalizado = producto === 'OMS' ? 'Order Management' : producto;
            const equipos = item.equipos || [];
            const metrica = metricasMap[producto] || { total_equipos: 0, total_clientes: 0, proyectos_en_curso: 0 };
            const colores = obtenerColoresProducto(producto);
            
            // Crear variables rgba para transparencias
            const primaryRgba70 = hexToRgba(colores.primary, 0.7);
            const primaryRgba25 = hexToRgba(colores.primary, 0.25);
            const primaryRgba20 = hexToRgba(colores.primary, 0.2);
            const primaryRgba15 = hexToRgba(colores.primary, 0.15);
            const primaryRgba10 = hexToRgba(colores.primary, 0.10);
            const primaryRgba08 = hexToRgba(colores.primary, 0.08);
            const primaryRgba06 = hexToRgba(colores.primary, 0.06);
            
            // Variables para el header con mayor opacidad
            const headerRgba40 = hexToRgba(colores.primary, 0.4);
            const headerRgba50 = hexToRgba(colores.primary, 0.5);
            const headerRgba15 = hexToRgba(colores.primary, 0.15);
            const headerRgba12 = hexToRgba(colores.primary, 0.12);
            const headerRgba10 = hexToRgba(colores.primary, 0.10);
            
            dashboardHTML += '<div class="dashboard-card" style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; border: 1px solid rgba(0,0,0,0.06);" onmouseover="this.style.transform=\'translateY(-4px)\'; this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)\';" onmouseout="this.style.transform=\'translateY(0)\'; this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)\';">';
            
            // Header con gradiente más oscuro
            dashboardHTML += '<div style="background: linear-gradient(135deg, ' + headerRgba40 + ' 0%, ' + headerRgba50 + ' 100%); padding: 24px 28px; position: relative; overflow: hidden; border-bottom: 1px solid ' + headerRgba15 + ';">';
            dashboardHTML += '<div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: ' + headerRgba12 + '; border-radius: 50%;"></div>';
            dashboardHTML += '<div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: ' + headerRgba10 + '; border-radius: 50%;"></div>';
            dashboardHTML += '<h3 style="font-size: 24px; font-weight: 600; color: ' + colores.primary + '; margin: 0; font-family: \'Google Sans\', \'Roboto\', sans-serif; position: relative; z-index: 1;">' + productoNormalizado + '</h3>';
            dashboardHTML += '</div>';
            
            // Contenido
            dashboardHTML += '<div style="padding: 28px;">';
            
            // Equipos
            if (equipos.length > 0) {
                dashboardHTML += '<div style="margin-bottom: 24px;">';
                dashboardHTML += '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';
                equipos.forEach(function(equipo) {
                    dashboardHTML += '<span style="display: inline-flex; align-items: center; padding: 6px 14px; background: ' + primaryRgba15 + '; color: ' + colores.primary + '; border-radius: 20px; font-size: 12px; font-weight: 500; border: 1px solid rgba(0,0,0,0.06); font-family: \'Google Sans\', \'Roboto\', sans-serif;">' + equipo.equipo + '</span>';
                });
                dashboardHTML += '</div>';
                dashboardHTML += '</div>';
            }
            
            // Métricas
            // Para Abbaco y Pepper, solo mostrar "Proyectos en Curso"
            const mostrarClientes = producto !== 'Abbaco' && producto !== 'Pepper';
            const gridColumns = mostrarClientes ? 'repeat(2, 1fr)' : '1fr';
            
            dashboardHTML += '<div style="display: grid; grid-template-columns: ' + gridColumns + '; gap: 16px;">';
            
            // Métrica: Total Clientes (solo si no es Abbaco ni Pepper)
            if (mostrarClientes) {
                dashboardHTML += '<div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-radius: 16px; padding: 20px; border: 1px solid rgba(0,0,0,0.04); transition: all 0.2s;" onmouseover="this.style.background=\'linear-gradient(135deg, #f1f3f4 0%, #ffffff 100%)\'; this.style.borderColor=\'' + primaryRgba20 + '\';" onmouseout="this.style.background=\'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)\'; this.style.borderColor=\'rgba(0,0,0,0.04)\';">';
                dashboardHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">';
                dashboardHTML += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: ' + primaryRgba70 + ';">';
                dashboardHTML += '<path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
                dashboardHTML += '<path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
                dashboardHTML += '</svg>';
                dashboardHTML += '<div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; font-family: \'Google Sans\', \'Roboto\', sans-serif;">Clientes</div>';
                dashboardHTML += '</div>';
                dashboardHTML += '<div style="font-size: 36px; font-weight: 700; color: ' + primaryRgba70 + '; line-height: 1; font-family: \'Google Sans\', \'Roboto\', sans-serif;">' + parseInt(metrica.total_clientes || 0) + '</div>';
                dashboardHTML += '</div>';
            }
            
            // Métrica: Proyectos en Curso
            dashboardHTML += '<div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-radius: 16px; padding: 20px; border: 1px solid rgba(0,0,0,0.04); transition: all 0.2s;" onmouseover="this.style.background=\'linear-gradient(135deg, #f1f3f4 0%, #ffffff 100%)\'; this.style.borderColor=\'' + primaryRgba20 + '\';" onmouseout="this.style.background=\'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)\'; this.style.borderColor=\'rgba(0,0,0,0.04)\';">';
            dashboardHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">';
            dashboardHTML += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: ' + primaryRgba70 + ';">';
            dashboardHTML += '<path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            dashboardHTML += '<path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            dashboardHTML += '</svg>';
            dashboardHTML += '<div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; font-family: \'Google Sans\', \'Roboto\', sans-serif;">En Curso</div>';
            dashboardHTML += '</div>';
            dashboardHTML += '<div style="font-size: 36px; font-weight: 700; color: ' + primaryRgba70 + '; line-height: 1; font-family: \'Google Sans\', \'Roboto\', sans-serif;">' + parseInt(metrica.proyectos_en_curso || 0) + '</div>';
            dashboardHTML += '</div>';
            
            dashboardHTML += '</div>';
            dashboardHTML += '</div>';
            dashboardHTML += '</div>';
        });
        
        dashboardHTML += '</div>';
        dashboardHTML += '</div>';
        
        contenido.innerHTML = dashboardHTML;
    } catch (error) {
        console.error('Error al cargar métricas:', error);
        contenido.innerHTML = '<div class="empty-state"><div class="empty-state-text">Error al cargar métricas</div><div class="empty-state-subtext">' + error.message + '</div></div>';
    }
}

async function cargarClientesParaFiltro() {
    actualizarFiltroClientesDesdeTabla();
}

function actualizarFiltroClientesDesdeTabla() {
    try {
        const clientes = [...new Set(datosTablaActual.map(p => p.cliente).filter(c => c))].sort();
        const filterClientes = document.getElementById('filterClientes');
        if (filterClientes) {
            let html = '<div style="padding: 8px 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">';
            html += '<button onclick="seleccionarTodosClientes()" style="background: none; border: none; color: var(--primary-color); font-size: 13px; font-weight: 500; cursor: pointer; padding: 4px 8px;">Todos</button>';
            html += '<button onclick="deseleccionarTodosClientes()" style="background: none; border: none; color: var(--text-secondary); font-size: 13px; cursor: pointer; padding: 4px 8px;">Borrar todos</button>';
            html += '</div>';
            html += clientes.map(cliente => `
                <label style="display: flex; align-items: center; padding: 10px 16px; cursor: pointer; transition: background 0.2s;" 
                       onmouseover="this.style.background='#f1f3f4'" 
                       onmouseout="this.style.background='white'">
                    <input type="checkbox" class="filter-checkbox-cliente" value="${cliente}" style="margin-right: 8px; cursor: pointer;" onchange="aplicarFiltrosProyectos()" />
                    <span style="font-size: 13px;">${cliente}</span>
                </label>
            `).join('');
            filterClientes.innerHTML = html;
        }
    } catch (error) {
        console.error('Error al actualizar filtro de clientes:', error);
    }
}

async function cargarDatos() {
    const contenido = document.getElementById('contenido');
    contenido.innerHTML = '<div class="empty-state"><div class="spinner"></div><div class="empty-state-text">Cargando datos...</div></div>';

    try {
        if (typeof productoActual === 'undefined' || !productoActual) {
            throw new Error('productoActual no está definido. No se puede cargar datos sin especificar el producto.');
        }
        
        let endpoint = '';
        let params = 'producto=' + encodeURIComponent(productoActual);
        if (typeof equipoActual !== 'undefined' && equipoActual) {
            params += '&equipo=' + encodeURIComponent(equipoActual);
        }
        if (typeof busquedaActual !== 'undefined' && busquedaActual) {
            params += '&busqueda=' + encodeURIComponent(busquedaActual);
        }
        
        if (typeof tipoActual === 'undefined') {
            throw new Error('tipoActual no está definido. No se puede cargar datos sin especificar el tipo.');
        }
        
        if (tipoActual === 'mantenimiento') {
            endpoint = '/api/mantenimiento?' + params;
        } else if (tipoActual === 'proyectos') {
            endpoint = '/api/proyectos?' + params;
        } else if (tipoActual === 'proyectos-internos') {
            endpoint = '/api/proyectos-internos?' + params;
        } else {
            throw new Error('Tipo de datos no válido: ' + tipoActual);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let response;
        try {
            response = await fetch(endpoint, { signal: controller.signal });
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                throw new Error('La solicitud tardó demasiado tiempo. Verifica tu conexión a internet o el estado del servidor.');
            } else if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
                throw new Error('Error de conexión con el servidor. Verifica tu conexión a internet o que el servidor esté funcionando.');
            } else {
                throw new Error('Error al conectar con el servidor: ' + fetchError.message);
            }
        }
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Error del servidor';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorMessage;
            } catch (e) {
                errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error al obtener los datos');
        }

        if (!result.data) {
            throw new Error('No se recibieron datos del servidor');
        }

        if (result.data.length > 0) {
            let datosFiltrados = result.data;
            
            if (tipoActual === 'proyectos') {
                if (typeof datosOriginales !== 'undefined') {
                    datosOriginales = result.data;
                }
                const incluirCerrados = document.getElementById('incluirCerrados')?.checked || false;
                let datosParaFiltro = [...result.data];
                if (!incluirCerrados) {
                    datosParaFiltro = datosParaFiltro.filter(d => (d.estado || '').toLowerCase() !== 'cerrado');
                }
                if (typeof datosTablaActual !== 'undefined') {
                    datosTablaActual = datosParaFiltro;
                }
                if (typeof actualizarFiltroClientesDesdeTabla === 'function') {
                    actualizarFiltroClientesDesdeTabla();
                }
            }
            
            if (tipoActual === 'proyectos') {
                if (typeof filtrosClientes !== 'undefined' && filtrosClientes.length > 0) {
                    datosFiltrados = datosFiltrados.filter(d => filtrosClientes.includes(d.cliente));
                }
                if (typeof filtrosEstados !== 'undefined' && filtrosEstados.length > 0) {
                    datosFiltrados = datosFiltrados.filter(d => filtrosEstados.includes(d.estado));
                }
                const incluirCerrados = document.getElementById('incluirCerrados')?.checked || false;
                if (!incluirCerrados) {
                    datosFiltrados = datosFiltrados.filter(d => (d.estado || '').toLowerCase() !== 'cerrado');
                }
                if (typeof actualizarFiltrosAplicados === 'function') {
                    actualizarFiltrosAplicados();
                }
            }
            
            if (tipoActual === 'proyectos' && typeof ordenActual !== 'undefined' && ordenActual && ordenActual.columna === 'cliente' && ordenActual.direccion === 'asc') {
                datosFiltrados.sort((a, b) => {
                    const clienteA = (a.cliente || '').toLowerCase();
                    const clienteB = (b.cliente || '').toLowerCase();
                    if (clienteA !== clienteB) {
                        return clienteA < clienteB ? -1 : 1;
                    }
                    const ordenEstadosArray = typeof ordenEstados !== 'undefined' ? ordenEstados : [];
                    const indexA = ordenEstadosArray.indexOf((a.estado || '').toLowerCase());
                    const indexB = ordenEstadosArray.indexOf((b.estado || '').toLowerCase());
                    const estadoA = indexA === -1 ? 999 : indexA;
                    const estadoB = indexB === -1 ? 999 : indexB;
                    return estadoA - estadoB;
                });
            }
            
            if (typeof renderizarTabla === 'function') {
                renderizarTabla(datosFiltrados);
            } else {
                console.warn('renderizarTabla no está definido');
            }
        } else {
            if (typeof datosTablaActual !== 'undefined') {
                datosTablaActual = [];
            }
            if (typeof datosOriginales !== 'undefined') {
                datosOriginales = [];
            }
            contenido.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No hay datos disponibles</div><div class="empty-state-subtext">Haz clic en "Actualizar" para sincronizar</div></div>';
            if (tipoActual === 'proyectos') {
                if (typeof actualizarFiltroClientesDesdeTabla === 'function') {
                    actualizarFiltroClientesDesdeTabla();
                }
                const contadorProyectos = document.getElementById('contadorProyectos');
                if (contadorProyectos) {
                    contadorProyectos.textContent = 'total proyectos: 0';
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        
        let mensajeError = 'Error al cargar datos';
        let mensajeDetalle = error.message || 'Error desconocido';
        
        if (mensajeDetalle.includes('conexión') || mensajeDetalle.includes('connection') || 
            mensajeDetalle.includes('ECONNREFUSED') || mensajeDetalle.includes('timeout') ||
            mensajeDetalle.includes('NetworkError') || mensajeDetalle.includes('Failed to fetch')) {
            mensajeError = 'Error de conexión';
            mensajeDetalle = 'No se pudo conectar con el servidor. Verifica que el servidor esté funcionando y tu conexión a internet.';
        } else if (mensajeDetalle.includes('base de datos') || mensajeDetalle.includes('database') ||
                   mensajeDetalle.includes('relation') || mensajeDetalle.includes('does not exist')) {
            mensajeError = 'Error de base de datos';
            mensajeDetalle = 'Error al conectar con la base de datos. Contacta al administrador del sistema.';
        }
        
        contenido.innerHTML = '<div class="empty-state">' +
            '<div class="empty-state-icon">❌</div>' +
            '<div class="empty-state-text">' + mensajeError + '</div>' +
            '<div class="empty-state-subtext">' + mensajeDetalle + '</div>' +
            '<button class="button" onclick="cargarDatos()" style="margin-top: 16px;">Reintentar</button>' +
            '</div>';
        
        if (tipoActual === 'proyectos') {
            const contadorProyectos = document.getElementById('contadorProyectos');
            if (contadorProyectos) {
                contadorProyectos.textContent = 'total proyectos: 0';
            }
        }
        
        if (typeof datosTablaActual !== 'undefined') {
            datosTablaActual = [];
        }
        if (typeof datosOriginales !== 'undefined') {
            datosOriginales = [];
        }
    }
}


