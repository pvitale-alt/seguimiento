/**
 * Funciones de búsqueda y filtros
 * Seguimiento de Proyectos
 */

// Búsqueda
function buscar(event) {
    if (event) event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        busquedaActual = searchInput.value;
        // Ocultar sugerencias al presionar Enter
        const suggestionsContainer = obtenerContenedorSugerencias();
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
        cargarDatos();
    }
}

// Búsqueda con sugerencias - optimizada con debounce más largo
let timeoutSugerencias;
let suggestionsContainerGlobal = null;

// Función para obtener o crear el contenedor de sugerencias en el body
function obtenerContenedorSugerencias() {
    if (!suggestionsContainerGlobal) {
        // Buscar si ya existe en el DOM
        suggestionsContainerGlobal = document.getElementById('searchSuggestions');
        // Si existe pero no está en el body, moverlo al body
        if (suggestionsContainerGlobal && suggestionsContainerGlobal.parentNode !== document.body) {
            suggestionsContainerGlobal.parentNode.removeChild(suggestionsContainerGlobal);
            document.body.appendChild(suggestionsContainerGlobal);
        }
        if (!suggestionsContainerGlobal) {
            // Crear nuevo contenedor y agregarlo al body
            suggestionsContainerGlobal = document.createElement('div');
            suggestionsContainerGlobal.id = 'searchSuggestions';
            suggestionsContainerGlobal.className = 'google-search-suggestions';
            document.body.appendChild(suggestionsContainerGlobal);
        }
    } else if (suggestionsContainerGlobal.parentNode !== document.body) {
        // Si el contenedor global existe pero no está en el body, moverlo
        suggestionsContainerGlobal.parentNode.removeChild(suggestionsContainerGlobal);
        document.body.appendChild(suggestionsContainerGlobal);
    }
    return suggestionsContainerGlobal;
}

async function buscarSugerencias(query) {
    clearTimeout(timeoutSugerencias);
    
    const suggestionsContainer = obtenerContenedorSugerencias();
    if (!suggestionsContainer) return;
    
    // Si se borró el texto (query vacío pero había búsqueda anterior), limpiar búsqueda
    if ((!query || query.length === 0) && busquedaActual && busquedaActual.trim().length > 0) {
        limpiarBusqueda();
        return;
    }
    
    if (!query || query.length < 2) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    timeoutSugerencias = setTimeout(async () => {
        try {
            // Construir endpoint con parámetros de producto, equipo e incluirCerrados
            let endpoint = '/api/proyectos/sugerencias?q=' + encodeURIComponent(query);
            
            if (typeof productoActual !== 'undefined' && productoActual) {
                endpoint += '&producto=' + encodeURIComponent(productoActual);
            }
            
            if (typeof equipoActual !== 'undefined' && equipoActual) {
                endpoint += '&equipo=' + encodeURIComponent(equipoActual);
            }
            
            // Incluir cerrados según el checkbox
            const incluirCerrados = document.getElementById('incluirCerrados')?.checked || false;
            if (incluirCerrados) {
                endpoint += '&incluirCerrados=true';
            }
            
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (data.success && data.sugerencias && data.sugerencias.length > 0) {
                const html = data.sugerencias.map(item => {
                    const estado = item.estado || '';
                    // Capitalizar primera letra del estado
                    const estadoCapitalizado = estado ? estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase() : '';
                    return `
                    <div class="google-suggestion-item" onclick="seleccionarSugerencia('${(item.nombre_proyecto || item.nombre || '').replace(/'/g, "\\'")}')">
                        <div class="suggestion-text">
                            <div class="suggestion-title">${item.nombre_proyecto || item.nombre || 'Sin nombre'}</div>
                            ${estadoCapitalizado ? `<div class="suggestion-subtitle">${estadoCapitalizado}</div>` : ''}
                        </div>
                    </div>
                `;
                }).join('');
                
                suggestionsContainer.innerHTML = html;
                suggestionsContainer.style.display = 'block';
                
                // Posicionar las sugerencias usando position fixed
                const searchBox = document.getElementById('searchBoxContainer');
                if (searchBox && suggestionsContainer) {
                    const rect = searchBox.getBoundingClientRect();
                    suggestionsContainer.style.top = (rect.bottom - 1) + 'px';
                    suggestionsContainer.style.left = rect.left + 'px';
                    suggestionsContainer.style.width = rect.width + 'px';
                }
            } else {
                suggestionsContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Error al obtener sugerencias:', error);
            suggestionsContainer.style.display = 'none';
        }
    }, 200);
}

function actualizarBotonLimpiar(valor) {
    const btnLimpiar = document.getElementById('btnLimpiarBusqueda');
    if (btnLimpiar) {
        btnLimpiar.style.display = valor && valor.trim().length > 0 ? 'flex' : 'none';
        // Si el valor está vacío y había una búsqueda, limpiar
        if ((!valor || valor.trim().length === 0) && busquedaActual && busquedaActual.trim().length > 0) {
            limpiarBusqueda();
        }
    }
}

function limpiarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        searchInput.style.height = 'auto';
        searchInput.style.height = Math.min(searchInput.scrollHeight, 44) + 'px';
        busquedaActual = '';
        actualizarBotonLimpiar('');
        const suggestionsContainer = obtenerContenedorSugerencias();
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
        // Recargar datos sin recargar toda la página
        if (typeof cargarDatos === 'function') {
            cargarDatos();
        }
    }
}

function seleccionarSugerencia(texto) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = texto;
        busquedaActual = texto;
        const suggestionsContainer = obtenerContenedorSugerencias();
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
        cargarDatos();
    }
}

// Cerrar sugerencias al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!e.target.closest('.google-search-box')) {
        const suggestions = obtenerContenedorSugerencias();
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }
});

// Reposicionar sugerencias al hacer scroll
window.addEventListener('scroll', () => {
    const suggestions = obtenerContenedorSugerencias();
    const searchBox = document.getElementById('searchBoxContainer');
    if (suggestions && searchBox && suggestions.style.display === 'block') {
        const rect = searchBox.getBoundingClientRect();
        suggestions.style.top = (rect.bottom - 1) + 'px';
        suggestions.style.left = rect.left + 'px';
        suggestions.style.width = rect.width + 'px';
    }
}, true);

// Reposicionar sugerencias al redimensionar la ventana
window.addEventListener('resize', () => {
    const suggestions = obtenerContenedorSugerencias();
    const searchBox = document.getElementById('searchBoxContainer');
    if (suggestions && searchBox && suggestions.style.display === 'block') {
        const rect = searchBox.getBoundingClientRect();
        suggestions.style.top = (rect.bottom - 1) + 'px';
        suggestions.style.left = rect.left + 'px';
        suggestions.style.width = rect.width + 'px';
    }
});

// Toggle filters
function toggleFilterClientes(buttonElement) {
    const dropdown = document.getElementById('filterClientes');
    const estadosDropdown = document.getElementById('filterEstados');
    const categoriasDropdown = document.getElementById('filterCategorias');
    
    if (estadosDropdown) estadosDropdown.style.display = 'none';
    if (categoriasDropdown) categoriasDropdown.style.display = 'none';
    
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        if (isVisible) {
            dropdown.style.display = 'none';
        } else {
            const button = buttonElement || document.querySelector('button[onclick*="toggleFilterClientes"]');
            if (button) {
                const rect = button.getBoundingClientRect();
                dropdown.style.position = 'fixed';
                dropdown.style.top = (rect.bottom + 4) + 'px';
                dropdown.style.left = rect.left + 'px';
                dropdown.style.zIndex = '10000';
                dropdown.style.background = 'white';
            }
            dropdown.style.display = 'block';
        }
    }
}

function toggleFilterCategorias(buttonElement) {
    const dropdown = document.getElementById('filterCategorias');
    const clientesDropdown = document.getElementById('filterClientes');
    const estadosDropdown = document.getElementById('filterEstados');
    
    if (clientesDropdown) clientesDropdown.style.display = 'none';
    if (estadosDropdown) estadosDropdown.style.display = 'none';
    
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        if (isVisible) {
            dropdown.style.display = 'none';
        } else {
            const button = buttonElement || document.querySelector('button[onclick*="toggleFilterCategorias"]');
            if (button) {
                const rect = button.getBoundingClientRect();
                dropdown.style.position = 'fixed';
                dropdown.style.top = (rect.bottom + 4) + 'px';
                dropdown.style.left = rect.left + 'px';
                dropdown.style.zIndex = '10000';
                dropdown.style.background = 'white';
            }
            dropdown.style.display = 'block';
        }
    }
}

function toggleFilterEstados(buttonElement) {
    const dropdown = document.getElementById('filterEstados');
    const clientesDropdown = document.getElementById('filterClientes');
    const categoriasDropdown = document.getElementById('filterCategorias');
    
    if (clientesDropdown) clientesDropdown.style.display = 'none';
    if (categoriasDropdown) categoriasDropdown.style.display = 'none';
    
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        if (isVisible) {
            dropdown.style.display = 'none';
        } else {
            const button = buttonElement || document.querySelector('button[onclick*="toggleFilterEstados"]');
            if (button) {
                const rect = button.getBoundingClientRect();
                dropdown.style.position = 'fixed';
                dropdown.style.top = (rect.bottom + 4) + 'px';
                dropdown.style.left = rect.left + 'px';
                dropdown.style.zIndex = '10000';
                dropdown.style.background = 'white';
            }
            dropdown.style.display = 'block';
        }
    }
}

// Cerrar dropdowns al hacer click fuera
document.addEventListener('click', (e) => {
    const filterClientes = document.getElementById('filterClientes');
    const filterCategorias = document.getElementById('filterCategorias');
    const filterEstados = document.getElementById('filterEstados');
    
    if (filterClientes && !e.target.closest('#filterClientes') && !e.target.closest('button[onclick*="toggleFilterClientes"]')) {
        filterClientes.style.display = 'none';
    }
    
    if (filterCategorias && !e.target.closest('#filterCategorias') && !e.target.closest('button[onclick*="toggleFilterCategorias"]')) {
        filterCategorias.style.display = 'none';
    }
    
    if (filterEstados && !e.target.closest('#filterEstados') && !e.target.closest('button[onclick*="toggleFilterEstados"]')) {
        filterEstados.style.display = 'none';
    }
});

function aplicarFiltrosProyectos() {
    // Asegurar que las variables estén definidas
    if (typeof filtrosClientes === 'undefined') filtrosClientes = [];
    if (typeof filtrosCategorias === 'undefined') filtrosCategorias = [];
    if (typeof filtrosEstados === 'undefined') filtrosEstados = [];
    
    filtrosClientes = Array.from(document.querySelectorAll('.filter-checkbox-cliente:checked')).map(cb => cb.value);
    filtrosCategorias = Array.from(document.querySelectorAll('.filter-checkbox-categoria:checked')).map(cb => cb.value);
    filtrosEstados = Array.from(document.querySelectorAll('.filter-checkbox-estado:checked')).map(cb => cb.value);
    actualizarFiltrosAplicados();
    cargarDatos();
}

function actualizarFiltrosAplicados() {
    const filtrosAplicados = document.getElementById('filtrosAplicados');
    if (!filtrosAplicados) return;
    
    // Asegurar que las variables estén definidas
    if (typeof filtrosClientes === 'undefined') filtrosClientes = [];
    if (typeof filtrosCategorias === 'undefined') filtrosCategorias = [];
    if (typeof filtrosEstados === 'undefined') filtrosEstados = [];
    
    const tieneFiltros = filtrosClientes.length > 0 || filtrosCategorias.length > 0 || filtrosEstados.length > 0;
    
    if (!tieneFiltros) {
        filtrosAplicados.style.display = 'none';
        filtrosAplicados.innerHTML = '';
        return;
    }
    
    filtrosAplicados.style.display = 'flex';
    let html = '';
    
    filtrosClientes.forEach(cliente => {
        html += '<div class="filter-chip" style="display: inline-flex; align-items: center; background: #e8f0fe; color: var(--primary-color); padding: 6px 12px; border-radius: 16px; font-size: 13px; font-weight: 500; gap: 8px;"><span>Cliente: ' + cliente + '</span><button onclick="removerFiltroCliente(\'' + cliente.replace(/'/g, "\\'") + '\')" style="background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; color: var(--primary-color);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>';
    });
    
    filtrosCategorias.forEach(categoria => {
        html += '<div class="filter-chip" style="display: inline-flex; align-items: center; background: #e6f4ea; color: #1e8e3e; padding: 6px 12px; border-radius: 16px; font-size: 13px; font-weight: 500; gap: 8px;"><span>Categoría: ' + categoria + '</span><button onclick="removerFiltroCategoria(\'' + categoria.replace(/'/g, "\\'") + '\')" style="background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; color: #1e8e3e;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>';
    });
    
    filtrosEstados.forEach(estado => {
        html += '<div class="filter-chip" style="display: inline-flex; align-items: center; background: #fef7e0; color: #f9ab00; padding: 6px 12px; border-radius: 16px; font-size: 13px; font-weight: 500; gap: 8px;"><span>Estado: ' + estado + '</span><button onclick="removerFiltroEstado(\'' + estado.replace(/'/g, "\\'") + '\')" style="background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; color: #f9ab00;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>';
    });
    
    if (tieneFiltros) {
        html += '<button onclick="limpiarFiltrosProyectos()" style="background: rgb(241, 243, 244); border: none; color: var(--text-secondary); font-size: 13px; cursor: pointer; padding: 6px 12px; border-radius: 16px; transition: background 0.2s;" onmouseover="this.style.background=\'#e8eaed\'" onmouseout="this.style.background=\'rgb(241, 243, 244)\'">Borrar filtros</button>';
    }
    
    filtrosAplicados.innerHTML = html;
}

function removerFiltroCliente(cliente) {
    if (typeof filtrosClientes === 'undefined') filtrosClientes = [];
    filtrosClientes = filtrosClientes.filter(c => c !== cliente);
    const checkbox = document.querySelector('.filter-checkbox-cliente[value="' + cliente + '"]');
    if (checkbox) checkbox.checked = false;
    actualizarFiltrosAplicados();
    cargarDatos();
}

function removerFiltroCategoria(categoria) {
    if (typeof filtrosCategorias === 'undefined') filtrosCategorias = [];
    filtrosCategorias = filtrosCategorias.filter(c => c !== categoria);
    const checkbox = document.querySelector('.filter-checkbox-categoria[value="' + categoria + '"]');
    if (checkbox) checkbox.checked = false;
    actualizarFiltrosAplicados();
    cargarDatos();
}

function removerFiltroEstado(estado) {
    if (typeof filtrosEstados === 'undefined') filtrosEstados = [];
    filtrosEstados = filtrosEstados.filter(e => e !== estado);
    const checkbox = document.querySelector('.filter-checkbox-estado[value="' + estado + '"]');
    if (checkbox) checkbox.checked = false;
    actualizarFiltrosAplicados();
    cargarDatos();
}

function limpiarFiltrosProyectos() {
    filtrosClientes = [];
    filtrosCategorias = [];
    filtrosEstados = [];
    document.querySelectorAll('.filter-checkbox-cliente, .filter-checkbox-categoria, .filter-checkbox-estado').forEach(cb => cb.checked = false);
    actualizarFiltrosAplicados();
    cargarDatos();
}

function seleccionarTodosClientes() {
    document.querySelectorAll('.filter-checkbox-cliente').forEach(cb => cb.checked = true);
    aplicarFiltrosProyectos();
}

function deseleccionarTodosClientes() {
    document.querySelectorAll('.filter-checkbox-cliente').forEach(cb => cb.checked = false);
    aplicarFiltrosProyectos();
}

function seleccionarTodosCategorias() {
    document.querySelectorAll('.filter-checkbox-categoria').forEach(cb => cb.checked = true);
    aplicarFiltrosProyectos();
}

function deseleccionarTodosCategorias() {
    document.querySelectorAll('.filter-checkbox-categoria').forEach(cb => cb.checked = false);
    aplicarFiltrosProyectos();
}

function seleccionarTodosEstados() {
    document.querySelectorAll('.filter-checkbox-estado').forEach(cb => cb.checked = true);
    aplicarFiltrosProyectos();
}

function deseleccionarTodosEstados() {
    document.querySelectorAll('.filter-checkbox-estado').forEach(cb => cb.checked = false);
    aplicarFiltrosProyectos();
}

// Variables para ordenamiento
let ordenActual = { columna: 'cliente', direccion: 'desc' };
const ordenEstados = ['sin comenzar', 'en curso', 'Testing', 'Entregado', 'Cerrado', 'Rework', 'Bloqueado'];

function ordenarPor(columna) {
    if (ordenActual.columna === columna) {
        ordenActual.direccion = ordenActual.direccion === 'asc' ? 'desc' : 'asc';
    } else {
        ordenActual.columna = columna;
        // Si es cliente, usar 'desc' por defecto, sino 'asc'
        ordenActual.direccion = columna === 'cliente' ? 'desc' : 'asc';
    }
    cargarDatos();
}





