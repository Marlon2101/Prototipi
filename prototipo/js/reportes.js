/* =============================================================================
   reportes.js - Reporte de ventas por rango de fechas
   -----------------------------------------------------------------------------
   Muestra métricas agregadas (total, cantidad de transacciones, ticket promedio)
   y una tabla filtrable/exportable a CSV.
   ============================================================================= */

(function initReportes(){
    Auth.protegerPagina();
    UI.renderMenu('reportes');
    UI.pintarUsuario();

    const inpDesde       = document.getElementById('fechaDesde');
    const inpHasta       = document.getElementById('fechaHasta');
    const btnFiltrar     = document.getElementById('btnFiltrar');
    const btnLimpiar     = document.getElementById('btnLimpiar');
    const btnExportar    = document.getElementById('btnExportar');
    const elTotal        = document.getElementById('totalVentas');
    const elCantidad     = document.getElementById('cantidadVentas');
    const elTicket       = document.getElementById('ticketPromedio');
    const tbody          = document.getElementById('tablaReporte');

    let cache = [];

    async function cargar(){
        const desde = inpDesde.value || null;
        const hasta = inpHasta.value || null;

        // BD: GET /api/ventas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
        cache = await DB.reporteVentas(desde, hasta);
        pintar();
    }

    function pintar(){
        const total     = cache.reduce((s,v) => s + Number(v.total || 0), 0);
        const cantidad  = cache.length;
        const promedio  = cantidad ? total / cantidad : 0;

        elTotal.textContent    = UI.moneda(total);
        elCantidad.textContent = cantidad;
        elTicket.textContent   = UI.moneda(promedio);

        if(cantidad === 0){
            tbody.innerHTML = `<tr><td colspan="6" class="vacio">Sin ventas en el rango seleccionado.</td></tr>`;
            return;
        }

        tbody.innerHTML = cache
            .slice()
            .sort((a,b) => new Date(b.fecha) - new Date(a.fecha))
            .map(v => `
                <tr>
                    <td>${String(v.id).padStart(3,'0')}</td>
                    <td>${new Date(v.fecha).toLocaleString()}</td>
                    <td>${v.clienteNombre || '-'}</td>
                    <td>${v.vendedorNombre || '-'}</td>
                    <td>${(v.detalles || []).reduce((s,d) => s + d.cantidad, 0)}</td>
                    <td>${UI.moneda(v.total)}</td>
                </tr>
            `).join('');
    }

    function limpiar(){
        inpDesde.value = '';
        inpHasta.value = '';
        cargar();
    }

    /**
     * Exporta el reporte actual a un archivo .csv que el navegador descarga.
     * No requiere backend; se genera del lado del cliente.
     */
    function exportarCSV(){
        if(cache.length === 0){
            UI.notificar('No hay datos para exportar', 'error');
            return;
        }

        const encabezado = ['ID', 'Fecha', 'Cliente', 'Vendedor', 'Productos', 'Subtotal', 'Impuesto', 'Total'];
        const filas = cache.map(v => [
            v.id,
            new Date(v.fecha).toISOString(),
            (v.clienteNombre || '').replace(/,/g, ' '),
            (v.vendedorNombre || '').replace(/,/g, ' '),
            (v.detalles || []).reduce((s,d) => s + d.cantidad, 0),
            (v.subtotal ?? v.total ?? 0).toFixed(2),
            (v.impuesto ?? 0).toFixed(2),
            (v.total ?? 0).toFixed(2)
        ]);

        const csv = [encabezado, ...filas]
            .map(l => l.map(c => `"${c}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `reporte_ventas_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        UI.notificar('Reporte exportado', 'exito');
    }

    btnFiltrar.addEventListener('click', cargar);
    btnLimpiar.addEventListener('click', limpiar);
    btnExportar.addEventListener('click', exportarCSV);

    cargar();
})();
