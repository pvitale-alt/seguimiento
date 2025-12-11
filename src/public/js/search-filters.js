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
        cargarDatos();
    }
}

// Búsqueda con sugerencias - optimizada con debounce más largo
let timeoutSugerencias;
async function buscarSugerencias(query) {
    clearTimeout(timeoutSugerencias);
    
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (!suggestionsContainer) return;
    
    if (!query || query.length < 2) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    timeoutSugerencias = setTimeout(async () => {
        try {
            const endpoint = '/api/proyectos/sugerencias?q=' + encodeURIComponent(query);
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (data.success && data.sugerencias && data.sugerencias.length > 0) {
                const html = data.sugerencias.map(item => `
                    <div class="google-suggestion-item" onclick="seleccionarSugerencia('${item.nombre_proyecto || item.nombre || ''}')">
                        <div class="suggestion-icon">${(item.nombre_proyecto || item.nombre || '?').substring(0, 1).toUpperCase()}</div>
                        <div class="suggestion-text">
                            <div class="suggestion-title">${item.nombre_proyecto || item.nombre || 'Sin nombre'}</div>
                            <div class="suggestion-subtitle">${item.cliente || item.producto || ''}</div>
                        </div>
                    </div>
                `).join('');
                
                suggestionsContainer.innerHTML = html;
                suggestionsContainer.style.display = 'block';
            } else {
                suggestionsContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Error al obtener sugerencias:', error);
            suggestionsContainer.style.display = 'none';
        }
    }, 500);
}

function actualizarBotonLimpiar(valor) {
    const btnLimpiar = document.getElementById('btnLimpiarBusqueda');
    if (btnLimpiar) {
        btnLimpiar.style.display = valor && valor.trim().length > 0 ? 'flex' : 'none';
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
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
        window.location.reload();
    }
}

function seleccionarSugerencia(texto) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = texto;
        busquedaActual = texto;
        document.getElementById('searchSuggestions').style.display = 'none';
        cargarDatos();
    }
}

// Cerrar sugerencias al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!e.target.closest('.google-search-box')) {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }
});

// Toggle filters
function toggleFilterClientes(buttonElement) {
    const dropdown = document.getElementById('filterClientes');
    const estadosDropdown = document.getElementById('filterEstados');
    
    if (estadosDropdown) estadosDropdown.style.display = 'none';
    
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

function toggleFilterEstados(buttonElement) {
    const dropdown = document.getElementById('filterEstados');
    const clientesDropdown = document.getElementById('filterClientes');
    
    if (clientesDropdown) clientesDropdown.style.display = 'none';
    
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
    const filterEstados = document.getElementById('filterEstados');
    
    if (filterClientes && !e.target.closest('#filterClientes') && !e.target.closest('button[onclick*="toggleFilterClientes"]')) {
        filterClientes.style.display = 'none';
    }
    
    if (filterEstados && !e.target.closest('#filterEstados') && !e.target.closest('button[onclick*="toggleFilterEstados"]')) {
        filterEstados.style.display = 'none';
    }
});

function aplicarFiltrosProyectos() {
    filtrosClientes = Array.from(document.querySelectorAll('.filter-checkbox-cliente:checked')).map(cb => cb.value);
    filtrosEstados = Array.from(document.querySelectorAll('.filter-checkbox-estado:checked')).map(cb => cb.value);
    actualizarFiltrosAplicados();
    cargarDatos();
}

function actualizarFiltrosAplicados() {
    const filtrosAplicados = document.getElementById('filtrosAplicados');
    if (!filtrosAplicados) return;
    
    const tieneFiltros = filtrosClientes.length > 0 || filtrosEstados.length > 0;
    
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
    
    filtrosEstados.forEach(estado => {
        html += '<div class="filter-chip" style="display: inline-flex; align-items: center; background: #fef7e0; color: #f9ab00; padding: 6px 12px; border-radius: 16px; font-size: 13px; font-weight: 500; gap: 8px;"><span>Estado: ' + estado + '</span><button onclick="removerFiltroEstado(\'' + estado.replace(/'/g, "\\'") + '\')" style="background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; color: #f9ab00;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>';
    });
    
    if (tieneFiltros) {
        html += '<button onclick="limpiarFiltrosProyectos()" style="background: rgb(241, 243, 244); border: none; color: var(--text-secondary); font-size: 13px; cursor: pointer; padding: 6px 12px; border-radius: 16px; transition: background 0.2s;" onmouseover="this.style.background=\'#e8eaed\'" onmouseout="this.style.background=\'rgb(241, 243, 244)\'">Borrar filtros</button>';
    }
    
    filtrosAplicados.innerHTML = html;
}

function removerFiltroCliente(cliente) {
    filtrosClientes = filtrosClientes.filter(c => c !== cliente);
    const checkbox = document.querySelector('.filter-checkbox-cliente[value="' + cliente + '"]');
    if (checkbox) checkbox.checked = false;
    actualizarFiltrosAplicados();
    cargarDatos();
}

function removerFiltroEstado(estado) {
    filtrosEstados = filtrosEstados.filter(e => e !== estado);
    const checkbox = document.querySelector('.filter-checkbox-estado[value="' + estado + '"]');
    if (checkbox) checkbox.checked = false;
    actualizarFiltrosAplicados();
    cargarDatos();
}

function limpiarFiltrosProyectos() {
    filtrosClientes = [];
    filtrosEstados = [];
    document.querySelectorAll('.filter-checkbox-cliente, .filter-checkbox-estado').forEach(cb => cb.checked = false);
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





