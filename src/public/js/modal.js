/**
 * Funciones del modal de detalle de proyecto
 * Seguimiento de Proyectos
 */

// Abrir modal de detalle del proyecto
async function abrirModalDetalle(id_proyecto) {
    try {
        let btn = window.tempModalButton || (typeof event !== 'undefined' && event?.target) || document.querySelector('button[data-item][onclick*="' + id_proyecto + '"]') || document.querySelector('a[data-item][onclick*="' + id_proyecto + '"]');
        if (!btn) {
            console.error('No se encontró el elemento del proyecto');
            return;
        }
        const itemDataJson = btn.getAttribute('data-item');
        if (!itemDataJson) {
            console.error('No se encontraron datos del proyecto');
            return;
        }
        const itemData = JSON.parse(itemDataJson.replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
        const modal = document.getElementById('modalDetalle');
        const modalTitulo = document.getElementById('modalTitulo');
        const modalBody = document.getElementById('modalBody');
        
        modalTitulo.textContent = itemData.nombre_proyecto || 'Detalle del Proyecto';
        
        const horasEstimadas = parseFloat(itemData.horas_estimadas) || 0;
        const horasRealizadas = parseFloat(itemData.horas_realizadas) || 0;
        const fechaInicio = formatearFecha(itemData.fecha_inicio_epics || itemData.fecha_inicio || '');
        const fechaFin = formatearFecha(itemData.fecha_fin_epics || itemData.fecha_fin || '');
        const tieneEpics = itemData.tiene_epics || false;
        
        let fechaInicioPlanificada = null;
        let fechaFinPlanificada = null;
        let fechaFinReal = null;
        
        let epicsHTML = '<div style="color: var(--text-secondary); font-style: italic; padding: 20px; text-align: center;">Cargando epics...</div>';
        
        try {
            const epicsResponse = await fetch('/api/epics/' + id_proyecto);
            const epicsData = await epicsResponse.json();
            const epics = epicsData.success ? epicsData.data : [];
            
            if (epics.length === 0) {
                epicsHTML = '<div style="color: var(--text-secondary); font-style: italic; padding: 20px; text-align: center;">No hay epics sincronizados</div>';
            } else {
                const fechasInicio = epics.map(e => e.cf_21).filter(f => f);
                const fechasFinPlanificada = epics.map(e => e.cf_22).filter(f => f);
                const fechasFinReal = epics.map(e => e.cf_15).filter(f => f);
                
                if (fechasInicio.length > 0) {
                    fechaInicioPlanificada = fechasInicio.sort()[0];
                }
                if (fechasFinPlanificada.length > 0) {
                    fechaFinPlanificada = fechasFinPlanificada.sort().reverse()[0];
                }
                if (fechasFinReal.length > 0) {
                    fechaFinReal = fechasFinReal.sort().reverse()[0];
                }
                
                const epicsPorProyecto = {};
                const epicsDelProyecto = [];
                
                epics.forEach(function(epic) {
                    const proyectoPadre = epic.proyecto_padre;
                    if (proyectoPadre && proyectoPadre !== id_proyecto) {
                        if (!epicsPorProyecto[proyectoPadre]) {
                            epicsPorProyecto[proyectoPadre] = [];
                        }
                        epicsPorProyecto[proyectoPadre].push(epic);
                    } else {
                        epicsDelProyecto.push(epic);
                    }
                });
                
                epicsHTML = '<div class="epics-list">';
                
                function renderizarEpic(epic) {
                    const epicUrl = 'https://redmine.mercap.net/issues/' + epic.epic_id;
                    const epicTitle = epic.subject || 'Epic #' + epic.epic_id;
                    let html = '<div class="epic-item" style="background: white; border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 12px;">';
                    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">';
                    html += '<div style="display: flex; flex-direction: column; gap: 4px;">';
                    html += '<div style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">Epic #' + epic.epic_id + '</div>';
                    html += '<div style="font-size: 14px; font-weight: 500; color: var(--text-primary);"><a href="' + epicUrl + '" target="_blank" style="color: var(--primary-color); text-decoration: none;">' + epicTitle + '</a></div>';
                    html += '</div>';
                    
                    const estadoEpic = epic.status || '';
                    let estadoEpicBg = '';
                    const estadoLower = estadoEpic.toLowerCase();
                    
                    if (estadoLower.includes('cerrado') || estadoLower.includes('closed') || 
                        estadoLower.includes('entregado') || estadoLower.includes('resuelto') || 
                        estadoLower.includes('resolved')) {
                        estadoEpicBg = 'rgba(30, 142, 62, 0.1)';
                    } 
                    else if (estadoLower.includes('nuevo') || estadoLower.includes('new') || 
                             estadoLower.includes('en progreso') || estadoLower.includes('in progress') ||
                             estadoLower.includes('abierto') || estadoLower.includes('open')) {
                        estadoEpicBg = 'rgba(26, 115, 232, 0.1)';
                    }
                    
                    html += '<div style="font-size: 12px; color: var(--text-secondary); padding: 4px 8px; border-radius: 12px; background: ' + (estadoEpicBg || 'transparent') + '; display: inline-block;">' + (estadoEpic || '-') + '</div>';
                    html += '</div>';
                    html += '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 13px; color: var(--text-secondary);">';
                    html += '<div>Est.: ' + (parseFloat(epic.total_estimated_hours) || 0).toFixed(1) + 'h</div>';
                    html += '<div>Real.: ' + (parseFloat(epic.total_spent_hours) || 0).toFixed(1) + 'h</div>';
                    html += '<div>Inicio: ' + (epic.cf_21 ? formatearFecha(epic.cf_21) : '-') + '</div>';
                    html += '<div>Fin Real: ' + (epic.cf_15 ? formatearFecha(epic.cf_15) : '-') + '</div>';
                    html += '</div>';
                    html += '</div>';
                    return html;
                }
                
                if (epicsDelProyecto.length > 0) {
                    epicsDelProyecto.forEach(function(epic) {
                        epicsHTML += renderizarEpic(epic);
                    });
                }
                
                const proyectosPadreOrdenados = Object.keys(epicsPorProyecto).sort(function(a, b) {
                    const nombreA = epicsPorProyecto[a][0]?.nombre_proyecto_padre || 'Proyecto #' + a;
                    const nombreB = epicsPorProyecto[b][0]?.nombre_proyecto_padre || 'Proyecto #' + b;
                    return nombreA.localeCompare(nombreB);
                });
                
                proyectosPadreOrdenados.forEach(function(proyectoPadreId) {
                    const epicsDelSubproyecto = epicsPorProyecto[proyectoPadreId];
                    const nombreProyectoPadre = epicsDelSubproyecto[0]?.nombre_proyecto_padre || 'Proyecto #' + proyectoPadreId;
                    epicsHTML += '<div style="margin-top: 24px; margin-bottom: 16px; padding-top: 16px; border-top: 2px solid var(--border-color);">';
                    epicsHTML += '<div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px;">' + nombreProyectoPadre + '</div>';
                    epicsDelSubproyecto.forEach(function(epic) {
                        epicsHTML += renderizarEpic(epic);
                    });
                    epicsHTML += '</div>';
                });
                
                epicsHTML += '</div>';
            }
        } catch (error) {
            console.error('Error al cargar epics:', error);
            epicsHTML = '<div style="color: #d93025; padding: 20px; text-align: center;">Error al cargar epics</div>';
        }
        
        const redmineLink = itemData.redmineUrl || ('https://redmine.mercap.net/projects/' + (itemData.codigo_proyecto || ''));
        
        let contenido = '<div style="display: flex; flex-direction: column; gap: 24px;">';
        
        const codigoProyecto = itemData.codigo_proyecto || '';
        contenido += '<div style="margin-bottom: 8px;"><a href="' + redmineLink + '" target="_blank" style="color: var(--primary-color); text-decoration: none; font-size: 14px; font-weight: 400;">Redmine ' + codigoProyecto + '</a></div>';
        
        contenido += '<div style="display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 32px;">';
        
        contenido += '<div style="display: flex; flex-direction: column; gap: 20px;">';
        contenido += '<h3 style="font-size: 18px; font-weight: 500; color: var(--text-primary); margin-bottom: 16px;">Información del Proyecto</h3>';
        
        contenido += '<div><label style="display: block; font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px;">Horas Estimadas</label>';
        contenido += '<div style="font-size: 16px; color: var(--text-primary); font-weight: 500;">' + (horasEstimadas > 0 ? horasEstimadas.toFixed(1) : '-') + 'h</div></div>';
        
        contenido += '<div><label style="display: block; font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px;">Horas Realizadas</label>';
        contenido += '<div style="font-size: 16px; color: var(--text-primary); font-weight: 500;">' + (horasRealizadas > 0 ? horasRealizadas.toFixed(1) : '-') + 'h</div></div>';
        
        contenido += '<div><label style="display: block; font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px;">Fecha Inicio Planificada</label>';
        if (!tieneEpics || !fechaInicioPlanificada) {
            contenido += '<div style="width: 100%; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 14px; font-family: \'Google Sans\', \'Roboto\', sans-serif; background: #f8f9fa; color: var(--text-secondary);">-</div></div>';
        } else {
            contenido += '<input type="date" class="modern-input date-input" value="' + formatearFecha(fechaInicioPlanificada) + '" readonly style="width: 100%; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 14px; font-family: \'Google Sans\', \'Roboto\', sans-serif; background: #f8f9fa; cursor: not-allowed;"></div>';
        }
        
        contenido += '<div><label style="display: block; font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px;">Fecha Fin Planificada</label>';
        if (!tieneEpics || !fechaFinPlanificada) {
            contenido += '<div style="width: 100%; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 14px; font-family: \'Google Sans\', \'Roboto\', sans-serif; background: #f8f9fa; color: var(--text-secondary);">-</div></div>';
        } else {
            contenido += '<input type="date" class="modern-input date-input" value="' + formatearFecha(fechaFinPlanificada) + '" readonly style="width: 100%; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 14px; font-family: \'Google Sans\', \'Roboto\', sans-serif; background: #f8f9fa; cursor: not-allowed;"></div>';
        }
        
        const estadoProyecto = (itemData.estado || '').toLowerCase();
        const mostrarFechaFinReal = estadoProyecto === 'entregado' || estadoProyecto === 'cerrado';
        
        if (mostrarFechaFinReal) {
            contenido += '<div><label style="display: block; font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px;">Fecha Fin Real</label>';
            if (!tieneEpics || !fechaFinReal) {
                contenido += '<div style="width: 100%; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 14px; font-family: \'Google Sans\', \'Roboto\', sans-serif; background: #f8f9fa; color: var(--text-secondary);">-</div></div>';
            } else {
                contenido += '<input type="date" class="modern-input date-input" value="' + formatearFecha(fechaFinReal) + '" readonly style="width: 100%; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 14px; font-family: \'Google Sans\', \'Roboto\', sans-serif; background: #f8f9fa; cursor: not-allowed;"></div>';
            }
        }
        
        contenido += '<div style="margin-top: 8px;">';
        contenido += '<button class="button" onclick="sincronizarEpicsDesdeModal(' + id_proyecto + ', \'' + (itemData.codigo_proyecto || '').replace(/'/g, "\\'") + '\', this)" style="width: 100%; padding: 10px; font-size: 13px; white-space: nowrap;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px; vertical-align: middle;"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>Sincronizar Epics</button>';
        contenido += '</div>';
        
        contenido += '</div>';
        
        contenido += '<div style="display: flex; flex-direction: column; gap: 20px;">';
        contenido += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">';
        contenido += '<h3 style="font-size: 18px; font-weight: 500; color: var(--text-primary); margin: 0;">Epics Sincronizados</h3>';
        contenido += '<div style="font-size: 13px; color: var(--text-secondary);">' + (tieneEpics ? 'Total: ' + (parseFloat(itemData.horas_estimadas) || 0).toFixed(1) + 'h est. / ' + (parseFloat(itemData.horas_realizadas) || 0).toFixed(1) + 'h real.' : 'Sin epics') + '</div>';
        contenido += '</div>';
        contenido += epicsHTML;
        contenido += '</div>';
        
        contenido += '</div>';
        contenido += '</div>';
        
        modalBody.innerHTML = contenido;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error al abrir modal:', error);
        alert('Error al abrir detalles del proyecto');
    }
}

// Cerrar modal de detalle
function cerrarModalDetalle() {
    const modal = document.getElementById('modalDetalle');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Actualizar fecha en el modal después de guardar
function actualizarFechaEnModal(id_proyecto, campo, valor) {
    // La fecha ya se actualizó en el input, no necesitamos hacer nada más
}


