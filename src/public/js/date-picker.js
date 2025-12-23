/**
 * Date Picker - Componente de selección de fechas
 * Replicado desde calculadoraTIR para mantener consistencia
 */

// Date Picker State
let datePickerState = {
    inputId: null,
    currentDate: new Date(),
    selectedDate: null,
    mostrarSelectorAnio: false,
    rangoAnioInicio: null,
    rangoAnioFin: null
};

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

function abrirDatePicker(inputId) {
    const input = document.getElementById(inputId);
    if (!input) {
        console.warn(`[abrirDatePicker] Input no encontrado: ${inputId}`);
        return;
    }
    
    const popupId = `datePicker${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`;
    let popup = document.getElementById(popupId);
    
    // Cerrar otros date pickers primero
    document.querySelectorAll('.date-picker-popup').forEach(p => {
        if (p.id !== popupId && p.parentNode) {
            p.remove();
        }
    });
    
    if (popup && popup.parentElement !== document.body) {
        popup.remove();
        popup = null;
    }
    
    if (!popup) {
        popup = document.createElement('div');
        popup.id = popupId;
        popup.className = 'date-picker-popup';
        popup.style.zIndex = '99999';
        popup.style.position = 'fixed';
        document.body.appendChild(popup);
    } else {
        popup.style.zIndex = '99999';
        popup.style.position = 'fixed';
    }
    
    // Inicializar estado
    datePickerState.currentDate = new Date();
    
    // Parsear fecha actual del input si existe
    const fechaActual = input.value;
    if (fechaActual && fechaActual.trim()) {
        const partes = fechaActual.trim().split(/[-\/]/);
        if (partes.length === 3) {
            const año = parseInt(partes[2], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const dia = parseInt(partes[0], 10);
            if (!isNaN(año) && !isNaN(mes) && !isNaN(dia) && año >= 1900 && año <= 2100 && mes >= 0 && mes <= 11) {
                datePickerState.selectedDate = new Date(año, mes, dia);
                datePickerState.currentDate = new Date(datePickerState.selectedDate);
            } else {
                datePickerState.selectedDate = null;
            }
        } else {
            datePickerState.selectedDate = null;
        }
    } else {
        datePickerState.selectedDate = null;
    }
    
    datePickerState.inputId = inputId;
    datePickerState.mostrarSelectorAnio = false;
    
    renderizarDatePicker(popup);
    
    // Calcular posición del popup
    const inputRect = input.getBoundingClientRect();
    const popupWidth = 280;
    const popupHeight = 350;
    
    let top = inputRect.bottom + 4;
    let left = inputRect.left;
    
    if (left + popupWidth > window.innerWidth) {
        left = window.innerWidth - popupWidth - 10;
    }
    
    if (inputRect.bottom + popupHeight > window.innerHeight) {
        top = inputRect.top - popupHeight - 4;
        if (top < 0) {
            top = 10;
        }
    }
    
    if (left < 0) {
        left = 10;
    }
    
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.style.display = 'block';
    popup.style.visibility = 'visible';
    popup.style.opacity = '1';
    
    popup.offsetHeight;
    
    let cerrarHandler = null;
    const cerrarPopup = () => {
        if (cerrarHandler) {
            document.removeEventListener('click', cerrarHandler, true);
            document.removeEventListener('scroll', cerrarHandler, true);
            cerrarHandler = null;
        }
        
        if (popup && popup.parentNode) {
            popup.remove();
        }
        
        if (window.datePickerCloseHandlers) {
            window.datePickerCloseHandlers.delete(popupId);
        }
    };
    
    if (window.datePickerCloseHandlers && window.datePickerCloseHandlers.has(popupId)) {
        const oldCerrar = window.datePickerCloseHandlers.get(popupId);
        if (oldCerrar) {
            oldCerrar();
        }
    }
    
    cerrarHandler = (e) => {
        if (!popup || !popup.parentNode) {
            cerrarPopup();
            return;
        }
        
        const target = e.target;
        if (popup.contains(target) || input.contains(target) || target.closest('.date-picker-icon-btn')) {
            return;
        }
        
        cerrarPopup();
    };
    
    if (!window.datePickerCloseHandlers) {
        window.datePickerCloseHandlers = new Map();
    }
    window.datePickerCloseHandlers.set(popupId, cerrarPopup);
    
    setTimeout(() => {
        document.addEventListener('click', cerrarHandler, true);
        document.addEventListener('scroll', cerrarHandler, true);
    }, 10);
}

function renderizarDatePicker(popup) {
    if (!datePickerState.inputId || !datePickerState.currentDate) {
        return;
    }
    
    const año = datePickerState.currentDate.getFullYear();
    const mes = datePickerState.currentDate.getMonth();
    
    if (isNaN(año) || isNaN(mes) || año < 1900 || año > 2100 || mes < 0 || mes > 11) {
        datePickerState.currentDate = new Date();
        return;
    }
    
    if (datePickerState.mostrarSelectorAnio) {
        const añoActual = new Date().getFullYear();
        if (datePickerState.rangoAnioInicio === null || datePickerState.rangoAnioFin === null) {
            datePickerState.rangoAnioInicio = añoActual - 10;
            datePickerState.rangoAnioFin = añoActual + 10;
        }
        const añoInicio = datePickerState.rangoAnioInicio;
        const añoFin = datePickerState.rangoAnioFin;
        
        let html = `
            <div class="date-picker-header">
                <button class="date-picker-nav-btn" onclick="event.stopPropagation(); cambiarRangoAnio(-20);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                </button>
                <div class="date-picker-month-year" style="cursor: pointer;" onclick="event.stopPropagation(); toggleSelectorAnio();">${añoInicio} - ${añoFin}</div>
                <button class="date-picker-nav-btn" onclick="event.stopPropagation(); cambiarRangoAnio(20);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                </button>
            </div>
            <div class="date-picker-years-grid">
        `;
        
        for (let a = añoInicio; a <= añoFin; a++) {
            const esAñoActual = a === año;
            const esAñoHoy = a === añoActual;
            let clases = 'date-picker-year';
            if (esAñoActual) clases += ' selected';
            if (esAñoHoy) clases += ' today';
            
            html += `<button class="${clases}" onclick="event.stopPropagation(); seleccionarAnio(${a});">${a}</button>`;
        }
        
        html += '</div>';
        popup.innerHTML = html;
        return;
    }
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();
    
    let html = `
        <div class="date-picker-header">
            <button class="date-picker-nav-btn" onclick="event.stopPropagation(); cambiarMesDatePicker(-1);" title="Mes anterior">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
            </button>
            <div class="date-picker-month-year" style="cursor: pointer; display: flex; gap: 8px; align-items: center;">
                <span onclick="event.stopPropagation(); toggleSelectorAnio();" style="flex: 1; text-align: center;">${meses[mes]}</span>
                <span onclick="event.stopPropagation(); toggleSelectorAnio();" style="flex: 1; text-align: center; font-weight: 600;">${año}</span>
            </div>
            <button class="date-picker-nav-btn" onclick="event.stopPropagation(); cambiarMesDatePicker(1);" title="Mes siguiente">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
            </button>
        </div>
        <div class="date-picker-weekdays">
            ${diasSemana.map(dia => `<div class="date-picker-weekday">${dia}</div>`).join('')}
        </div>
        <div class="date-picker-days">
    `;
    
    const mesAnterior = new Date(año, mes, 0);
    const diasMesAnterior = mesAnterior.getDate();
    for (let i = diaInicioSemana - 1; i >= 0; i--) {
        const dia = diasMesAnterior - i;
        html += `<button class="date-picker-day other-month" onclick="event.stopPropagation(); seleccionarFecha(${año}, ${mes - 1}, ${dia});">${dia}</button>`;
    }
    
    const hoy = new Date();
    for (let dia = 1; dia <= diasMes; dia++) {
        const fecha = new Date(año, mes, dia);
        let clases = 'date-picker-day';
        
        if (fecha.toDateString() === hoy.toDateString()) {
            clases += ' today';
        }
        
        if (datePickerState.selectedDate && fecha.toDateString() === datePickerState.selectedDate.toDateString()) {
            clases += ' selected';
        }
        
        html += `<button class="${clases}" onclick="event.stopPropagation(); seleccionarFecha(${año}, ${mes}, ${dia});">${dia}</button>`;
    }
    
    const diasRestantes = 42 - (diaInicioSemana + diasMes);
    for (let dia = 1; dia <= diasRestantes; dia++) {
        html += `<button class="date-picker-day other-month" onclick="event.stopPropagation(); seleccionarFecha(${año}, ${mes + 1}, ${dia});">${dia}</button>`;
    }
    
    html += '</div>';
    popup.innerHTML = html;
}

function cambiarMesDatePicker(delta) {
    if (!datePickerState.inputId) return;
    
    const nuevaFecha = new Date(datePickerState.currentDate);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + delta);
    datePickerState.currentDate = nuevaFecha;
    datePickerState.mostrarSelectorAnio = false;
    
    const popupId = `datePicker${datePickerState.inputId.charAt(0).toUpperCase() + datePickerState.inputId.slice(1)}`;
    const popup = document.getElementById(popupId);
    if (popup) {
        renderizarDatePicker(popup);
    }
}

function toggleSelectorAnio() {
    if (!datePickerState.inputId) return;
    
    datePickerState.mostrarSelectorAnio = !datePickerState.mostrarSelectorAnio;
    
    if (datePickerState.mostrarSelectorAnio) {
        const añoActual = datePickerState.currentDate.getFullYear();
        datePickerState.rangoAnioInicio = añoActual - 10;
        datePickerState.rangoAnioFin = añoActual + 10;
    }
    
    const popupId = `datePicker${datePickerState.inputId.charAt(0).toUpperCase() + datePickerState.inputId.slice(1)}`;
    const popup = document.getElementById(popupId);
    if (popup) {
        renderizarDatePicker(popup);
    }
}

function seleccionarAnio(añoSeleccionado) {
    if (!datePickerState.inputId) return;
    
    datePickerState.currentDate.setFullYear(añoSeleccionado);
    datePickerState.mostrarSelectorAnio = false;
    
    const popupId = `datePicker${datePickerState.inputId.charAt(0).toUpperCase() + datePickerState.inputId.slice(1)}`;
    const popup = document.getElementById(popupId);
    if (popup) {
        renderizarDatePicker(popup);
    }
}

function cambiarRangoAnio(delta) {
    if (!datePickerState.inputId) return;
    
    if (datePickerState.rangoAnioInicio === null || datePickerState.rangoAnioFin === null) {
        const añoActual = new Date().getFullYear();
        datePickerState.rangoAnioInicio = añoActual - 10;
        datePickerState.rangoAnioFin = añoActual + 10;
    }
    
    const rango = datePickerState.rangoAnioFin - datePickerState.rangoAnioInicio;
    datePickerState.rangoAnioInicio += delta;
    datePickerState.rangoAnioFin = datePickerState.rangoAnioInicio + rango;
    
    const popupId = `datePicker${datePickerState.inputId.charAt(0).toUpperCase() + datePickerState.inputId.slice(1)}`;
    const popup = document.getElementById(popupId);
    if (popup) {
        renderizarDatePicker(popup);
    }
}

function seleccionarFecha(año, mes, dia) {
    if (!datePickerState.inputId) return;
    
    const fecha = new Date(año, mes, dia);
    datePickerState.selectedDate = fecha;
    datePickerState.currentDate = new Date(fecha);
    
    const diaStr = String(dia).padStart(2, '0');
    const mesStr = String(mes + 1).padStart(2, '0');
    const añoStr = String(año);
    const fechaFormateada = `${diaStr}-${mesStr}-${añoStr}`;
    
    const input = document.getElementById(datePickerState.inputId);
    if (input) {
        input.value = fechaFormateada;
        // Disparar eventos para que los listeners se ejecuten
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Si el input es de un accionable, actualizar el check
        if (input.id.startsWith('fechaAccionable_')) {
            const idAccionable = input.id.replace('fechaAccionable_', '');
            if (typeof actualizarAccionableIndividual === 'function') {
                setTimeout(() => actualizarAccionableIndividual(parseInt(idAccionable)), 100);
            }
        }
        // Si el input es de un pedido, actualizar la fecha y el texto visible
        if (input.id.startsWith('fechaPedido_')) {
            const idPedido = input.id.replace('fechaPedido_', '');
            // Convertir DD-MM-YYYY a DD/MM/YYYY para mostrar
            const fechaMostrar = fechaFormateada.replace(/-/g, '/');
            // Actualizar el texto visible en la celda
            const celda = input.closest('.modern-table-cell');
            if (celda) {
                const spanTexto = celda.querySelector('span');
                if (spanTexto) {
                    spanTexto.textContent = fechaMostrar;
                }
            }
            if (typeof actualizarFechaPedido === 'function') {
                setTimeout(() => actualizarFechaPedido(parseInt(idPedido), fechaFormateada), 100);
            }
        }
    }
    
    const popupId = `datePicker${datePickerState.inputId.charAt(0).toUpperCase() + datePickerState.inputId.slice(1)}`;
    const popup = document.getElementById(popupId);
    
    const cerrarPopupAhora = () => {
        if (window.datePickerCloseHandlers && window.datePickerCloseHandlers.has(popupId)) {
            const cerrarPopup = window.datePickerCloseHandlers.get(popupId);
            try {
                cerrarPopup();
            } catch (e) {
                if (popup && popup.parentNode) {
                    popup.remove();
                }
                window.datePickerCloseHandlers.delete(popupId);
            }
        } else {
            if (popup && popup.parentNode) {
                popup.remove();
            }
        }
    };
    
    cerrarPopupAhora();
}

// Función para obtener fecha de hoy en formato DD-MM-AAAA
function obtenerFechaHoy() {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const año = hoy.getFullYear();
    return `${dia}-${mes}-${año}`;
}

