/* =============================================================================
   configuracion.js - Ajustes generales del sistema (solo administradores)
   ============================================================================= */

(async function initConfiguracion(){
    Auth.protegerPagina();

    const yo = Auth.usuarioActual();
    if(!yo || yo.rol !== 'admin'){
        UI.notificar('Acceso restringido a administradores', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 800);
        return;
    }

    UI.renderMenu('configuracion');
    UI.pintarUsuario();

    const form            = document.getElementById('formConfig');
    const inpNombre       = document.getElementById('nombreEmpresa');
    const inpDireccion    = document.getElementById('direccion');
    const inpTelefono     = document.getElementById('telefono');
    const inpMoneda       = document.getElementById('moneda');
    const inpSimbolo      = document.getElementById('simbolo');
    const inpImpuesto     = document.getElementById('impuesto');
    const btnRestablecer  = document.getElementById('btnRestablecer');

    // BD: GET /api/configuracion
    const cfg = await DB.obtenerConfiguracion();
    inpNombre.value    = cfg.nombreEmpresa;
    inpDireccion.value = cfg.direccion || '';
    inpTelefono.value  = cfg.telefono  || '';
    inpMoneda.value    = cfg.moneda;
    inpSimbolo.value   = cfg.simbolo;
    inpImpuesto.value  = cfg.impuesto;

    /**
     * Guardar cambios.
     * BD: PUT /api/configuracion
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cambios = {
            nombreEmpresa: inpNombre.value.trim(),
            direccion:     inpDireccion.value.trim(),
            telefono:      inpTelefono.value.trim(),
            moneda:        inpMoneda.value.trim().toUpperCase(),
            simbolo:       inpSimbolo.value.trim(),
            impuesto:      parseFloat(inpImpuesto.value)
        };
        await DB.actualizarConfiguracion(cambios);
        UI.notificar('Configuración guardada', 'exito');
    });

    /**
     * Restablecer los datos de ejemplo (solo aplica al modo prototipo con localStorage).
     * En producción esta funcionalidad no existe: se borraría el botón.
     */
    btnRestablecer.addEventListener('click', () => {
        if(!UI.confirmar('¿Estás seguro? Se perderán todos los cambios realizados.')) return;
        Data.restablecer();
        UI.notificar('Datos restablecidos', 'exito');
        setTimeout(() => window.location.reload(), 800);
    });
})();
