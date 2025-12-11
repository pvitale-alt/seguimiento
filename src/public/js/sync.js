/**
 * Funciones de sincronización con Redmine
 * Seguimiento de Proyectos
 */

let progresoSincronizacion = 0;
let intervaloProgreso = null;

async function sincronizar() {
    if (!productoActual) {
        alert('Por favor selecciona un producto primero');
        return;
    }
    
    console.log('🔄 Iniciando sincronización...');
    console.log('   Producto:', productoActual);
    console.log('   Equipo:', equipoActual || 'todos');
    console.log('   Tipo:', tipoActual);
    
    mostrarPopupSincronizacion();
    
    const btnSincronizar = document.getElementById('btnSincronizar');
    let textoOriginal = null;
    if (btnSincronizar) {
        textoOriginal = btnSincronizar.innerHTML;
        btnSincronizar.disabled = true;
        btnSincronizar.innerHTML = '<div class="spinner"></div> <span>Sincronizando...</span>';
    }

    try {
        let endpoint = '';
        const bodyData = {
            producto: productoActual,
            equipo: equipoActual || null
        };
        
        if (tipoActual === 'mantenimiento') {
            endpoint = '/api/sincronizar/mantenimiento';
        } else {
            // Todas las demás categorías usan el endpoint de sincronización de proyectos
            endpoint = '/api/sincronizar/proyectos';
        }

        console.log('📡 Llamando a:', endpoint);
        console.log('📦 Datos enviados:', bodyData);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(bodyData)
        });

        console.log('📥 Respuesta recibida, status:', response.status);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Resultado de sincronización:', result);
        
        actualizarProgresoSincronizacion(100);
        
        setTimeout(() => {
            ocultarPopupSincronizacion();
            if (result.success) {
                console.log('✅ Sincronización exitosa, recargando datos...');
                cargarDatos();
            } else {
                console.error('❌ Error en sincronización:', result.error);
                alert('Error en la sincronización: ' + (result.error || 'Error desconocido'));
            }
        }, 500);
    } catch (error) {
        console.error('❌ Error al sincronizar:', error);
        console.error('   Stack:', error.stack);
        ocultarPopupSincronizacion();
        alert('Error al sincronizar: ' + error.message);
    } finally {
        if (btnSincronizar && textoOriginal) {
            btnSincronizar.disabled = false;
            btnSincronizar.innerHTML = textoOriginal;
        }
    }
}

function mostrarPopupSincronizacion() {
    progresoSincronizacion = 0;
    
    const overlay = document.createElement('div');
    overlay.id = 'syncOverlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;';
    
    const popup = document.createElement('div');
    popup.id = 'syncPopup';
    popup.style.cssText = 'background: white; border-radius: 12px; padding: 24px; min-width: 320px; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
    
    popup.innerHTML = '<div style="text-align: center;"><div style="font-size: 16px; font-weight: 500; color: #202124; margin-bottom: 16px; font-family: \'Google Sans\', \'Roboto\', sans-serif;">Sincronizando</div><div style="width: 100%; height: 8px; background: #f1f3f4; border-radius: 4px; overflow: hidden; margin-bottom: 8px;"><div id="syncProgressBar" style="height: 100%; background: #0D5AA2; width: 0%; transition: width 0.3s ease; border-radius: 4px;"></div></div><div id="syncProgressText" style="font-size: 13px; color: #5f6368; font-family: \'Roboto\', sans-serif;">0%</div></div>';
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    intervaloProgreso = setInterval(() => {
        const incremento = 1 + Math.random() * 2;
        progresoSincronizacion += incremento;
        if (progresoSincronizacion > 90) {
            progresoSincronizacion = 90;
        }
        actualizarProgresoSincronizacion(progresoSincronizacion);
    }, 300);
}

function actualizarProgresoSincronizacion(porcentaje) {
    porcentaje = Math.max(0, Math.min(100, porcentaje));
    progresoSincronizacion = porcentaje;
    
    const progressBar = document.getElementById('syncProgressBar');
    const progressText = document.getElementById('syncProgressText');
    
    if (progressBar) {
        progressBar.style.width = porcentaje + '%';
    }
    if (progressText) {
        progressText.textContent = Math.round(porcentaje) + '%';
    }
    
    if (porcentaje >= 100 && intervaloProgreso) {
        clearInterval(intervaloProgreso);
        intervaloProgreso = null;
    }
}

function ocultarPopupSincronizacion() {
    if (intervaloProgreso) {
        clearInterval(intervaloProgreso);
        intervaloProgreso = null;
    }
    const overlay = document.getElementById('syncOverlay');
    if (overlay) {
        overlay.remove();
    }
    progresoSincronizacion = 0;
}

// Sincronizar epics desde el modal
async function sincronizarEpicsDesdeModal(id_proyecto, codigo_proyecto, btnElement) {
    const btn = btnElement || (typeof event !== 'undefined' && event?.target?.closest('button'));
    if (!btn) {
        console.error('No se encontró el botón');
        return;
    }
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div> <span>Sincronizando...</span>';
    
    try {
        const response = await fetch('/api/sincronizar/epics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                id_proyecto: id_proyecto,
                codigo_proyecto: codigo_proyecto
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Epics sincronizados:', result.data);
            const linkProyecto = document.querySelector('a[data-item][onclick*="' + id_proyecto + '"]');
            if (linkProyecto) {
                const itemDataJson = linkProyecto.getAttribute('data-item');
                if (itemDataJson) {
                    const itemData = JSON.parse(itemDataJson.replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
                    itemData.horas_estimadas = parseFloat(result.data.horas_estimadas) || 0;
                    itemData.horas_realizadas = parseFloat(result.data.horas_realizadas) || 0;
                    itemData.fecha_inicio_epics = result.data.fecha_inicio || '';
                    itemData.fecha_fin_epics = result.data.fecha_fin || '';
                    itemData.tiene_epics = true;
                    linkProyecto.setAttribute('data-item', JSON.stringify(itemData).replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
                }
            }
            if (linkProyecto) {
                window.tempModalButton = linkProyecto;
                await abrirModalDetalle(id_proyecto);
                delete window.tempModalButton;
            }
            cargarDatos();
        } else {
            alert('Error al sincronizar epics: ' + (result.error || 'Error desconocido'));
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
        }
    } catch (error) {
        console.error('Error al sincronizar epics:', error);
        alert('Error al sincronizar epics: ' + error.message);
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}

// Sincronizar epics de un proyecto (versión antigua)
async function sincronizarEpics(id_proyecto, codigo_proyecto) {
    try {
        const btn = event.target.closest('button');
        const textoOriginal = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div> <span>Sincronizando...</span>';
        
        const response = await fetch('/api/sincronizar/epics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                id_proyecto: id_proyecto,
                codigo_proyecto: codigo_proyecto
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Epics sincronizados:', result.data);
            cargarDatos();
        } else {
            alert('Error al sincronizar epics: ' + (result.error || 'Error desconocido'));
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
        }
    } catch (error) {
        console.error('Error al sincronizar epics:', error);
        alert('Error al sincronizar epics: ' + error.message);
        const btn = event.target.closest('button');
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}




