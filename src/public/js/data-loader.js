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
        
        let dashboardHTML = '<div style="padding: 24px; position: relative;">';
        dashboardHTML += '<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url(\'/images/cover.png\'); background-size: cover; background-position: center; background-repeat: no-repeat; opacity: 0.2; pointer-events: none; border-radius: 12px;"></div>';
        dashboardHTML += '<div style="position: relative; z-index: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">';
        
        productosOrdenados.forEach(function(item) {
            const producto = item.producto;
            const productoNormalizado = producto === 'OMS' ? 'Order Management' : producto;
            const equipos = item.equipos || [];
            const metrica = metricasMap[producto] || { total_equipos: 0, total_clientes: 0, proyectos_en_curso: 0 };
            
            dashboardHTML += '<div style="background: linear-gradient(135deg, rgba(239, 246, 255, 0.6) 0%, rgba(255, 255, 255, 0.9) 100%); border-radius: 16px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1); border: 1px solid rgba(26, 115, 232, 0.1); transition: all 0.3s ease; position: relative; overflow: hidden;">';
            dashboardHTML += '<h3 style="font-size: 22px; font-weight: 500; color: var(--text-primary); margin-bottom: 20px; font-family: \'Google Sans\', \'Roboto\', sans-serif; position: relative; z-index: 1;">' + productoNormalizado + '</h3>';
            
            if (equipos.length > 0) {
                dashboardHTML += '<div style="margin-bottom: 20px; position: relative; z-index: 1;">';
                dashboardHTML += '<div style="display: flex; flex-wrap: wrap; gap: 6px;">';
                equipos.forEach(function(equipo) {
                    dashboardHTML += '<span style="display: inline-block; padding: 4px 10px; background: rgba(26, 115, 232, 0.1); color: var(--primary-color); border-radius: 12px; font-size: 12px; font-weight: 500; border: 1px solid rgba(26, 115, 232, 0.3);">' + equipo.equipo + '</span>';
                });
                dashboardHTML += '</div>';
                dashboardHTML += '</div>';
            }
            
            dashboardHTML += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 20px; position: relative; z-index: 1;">';
            
            dashboardHTML += '<div style="padding: 16px; border-radius: 12px;">';
            dashboardHTML += '<div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Total Clientes</div>';
            dashboardHTML += '<div style="font-size: 32px; font-weight: 600; color: var(--primary-color); line-height: 1;">' + parseInt(metrica.total_clientes || 0) + '</div>';
            dashboardHTML += '</div>';
            
            dashboardHTML += '<div style="padding: 16px; border-radius: 12px;">';
            dashboardHTML += '<div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Proyectos en Curso</div>';
            dashboardHTML += '<div style="font-size: 32px; font-weight: 600; color: var(--primary-color); line-height: 1;">' + parseInt(metrica.proyectos_en_curso || 0) + '</div>';
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


