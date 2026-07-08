/* =============================================================================
   dashboard.js - Lógica del panel principal
   ============================================================================= */

(async function initDashboard(){
    Auth.protegerPagina();
    UI.renderMenu('dashboard');
    UI.pintarUsuario();

    // Obtiene métricas desde la capa de datos
    // BD: se traducirá a llamadas HTTP dentro de DB.obtenerMetricas()
    const m = await DB.obtenerMetricas();

    document.getElementById('ventasHoy').textContent        = UI.moneda(m.ventasHoy);
    document.getElementById('transaccionesHoy').textContent = m.transaccionesHoy;
    document.getElementById('totalProductos').textContent   = m.totalProductos;
    document.getElementById('totalClientes').textContent    = m.totalClientes;
    document.getElementById('stockBajo').textContent        = m.stockBajo;

    // Últimas 5 ventas
    const ventas = (await DB.obtenerVentas())
        .slice()
        .sort((a,b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);

    const tbody = document.getElementById('tablaUltimasVentas');
    if(ventas.length === 0){
        tbody.innerHTML = `<tr><td colspan="5" class="vacio">Aún no hay ventas registradas.</td></tr>`;
        return;
    }

    tbody.innerHTML = ventas.map(v => `
        <tr>
            <td>${String(v.id).padStart(3,'0')}</td>
            <td>${new Date(v.fecha).toLocaleDateString()}</td>
            <td>${v.clienteNombre || '-'}</td>
            <td>${v.vendedorNombre || '-'}</td>
            <td>${UI.moneda(v.total)}</td>
        </tr>
    `).join('');
})();
