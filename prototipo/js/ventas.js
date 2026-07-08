/* =============================================================================
   ventas.js - Registro de ventas y consulta de historial
   -----------------------------------------------------------------------------
   Flujo:
     1) Se cargan productos, clientes y la configuración (para el impuesto)
     2) El usuario arma un carrito en memoria
     3) Al finalizar se envía la venta completa a la capa DB
   ============================================================================= */

(async function initVentas(){
    Auth.protegerPagina();
    UI.renderMenu('ventas');
    UI.pintarUsuario();

    const selCliente   = document.getElementById('cliente');
    const selProducto  = document.getElementById('producto');
    const inpCantidad  = document.getElementById('cantidad');
    const btnAgregar   = document.getElementById('btnAgregar');
    const btnFinalizar = document.getElementById('btnFinalizar');
    const btnCancelar  = document.getElementById('btnCancelar');
    const tablaDet     = document.getElementById('tablaDetalles');
    const tablaHist    = document.getElementById('tablaHistorial');
    const elSubtotal   = document.getElementById('subtotal');
    const elImpuesto   = document.getElementById('impuesto');
    const elTotal      = document.getElementById('totalVenta');
    const elTasa       = document.getElementById('tasaImpuesto');

    let productos = [];
    let clientes  = [];
    let carrito   = []; // [{ productoId, nombre, cantidad, precio, subtotal }]
    let config    = {};

    async function cargarInicial(){
        // BD: se llenan desde /api/productos, /api/clientes, /api/configuracion
        [productos, clientes, config] = await Promise.all([
            DB.obtenerProductos(),
            DB.obtenerClientes(),
            DB.obtenerConfiguracion()
        ]);

        elTasa.textContent = config.impuesto;

        selCliente.innerHTML = '<option value="">-- Selecciona un cliente --</option>' +
            clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

        selProducto.innerHTML = '<option value="">-- Selecciona un producto --</option>' +
            productos.map(p => `<option value="${p.id}" data-precio="${p.precio}" data-stock="${p.stock}">
                ${p.nombre} (Stock: ${p.stock}) - ${UI.moneda(p.precio)}
            </option>`).join('');

        await refrescarHistorial();
    }

    function agregarAlCarrito(){
        const pid = parseInt(selProducto.value, 10);
        const qty = parseInt(inpCantidad.value, 10);
        if(!pid){ UI.notificar('Selecciona un producto', 'error'); return; }
        if(!qty || qty < 1){ UI.notificar('Cantidad inválida', 'error'); return; }

        const producto = productos.find(p => p.id === pid);
        if(!producto){ UI.notificar('Producto no encontrado', 'error'); return; }

        // Validar stock considerando lo que ya hay en el carrito
        const yaEnCarrito = carrito
            .filter(i => i.productoId === pid)
            .reduce((s,i) => s + i.cantidad, 0);
        if(yaEnCarrito + qty > producto.stock){
            UI.notificar(`Stock insuficiente (disponible: ${producto.stock - yaEnCarrito})`, 'error');
            return;
        }

        const existente = carrito.find(i => i.productoId === pid);
        if(existente){
            existente.cantidad += qty;
            existente.subtotal = existente.cantidad * existente.precio;
        }else{
            carrito.push({
                productoId: producto.id,
                nombre: producto.nombre,
                cantidad: qty,
                precio: producto.precio,
                subtotal: producto.precio * qty
            });
        }

        inpCantidad.value = 1;
        selProducto.value = '';
        pintarCarrito();
    }

    function quitarDelCarrito(index){
        carrito.splice(index, 1);
        pintarCarrito();
    }

    function pintarCarrito(){
        if(carrito.length === 0){
            tablaDet.innerHTML = `<tr><td colspan="5" class="vacio">Sin productos agregados.</td></tr>`;
        }else{
            tablaDet.innerHTML = carrito.map((i, idx) => `
                <tr>
                    <td>${i.nombre}</td>
                    <td>${i.cantidad}</td>
                    <td>${UI.moneda(i.precio)}</td>
                    <td>${UI.moneda(i.subtotal)}</td>
                    <td><button class="eliminar" data-idx="${idx}">Quitar</button></td>
                </tr>
            `).join('');
        }

        const subtotal = carrito.reduce((s,i) => s + i.subtotal, 0);
        const impuesto = subtotal * (config.impuesto / 100);
        const total    = subtotal + impuesto;

        elSubtotal.textContent = UI.moneda(subtotal);
        elImpuesto.textContent = UI.moneda(impuesto);
        elTotal.textContent    = UI.moneda(total);
    }

    async function finalizarVenta(){
        if(carrito.length === 0){
            UI.notificar('Agrega al menos un producto', 'error');
            return;
        }
        if(!selCliente.value){
            UI.notificar('Selecciona un cliente', 'error');
            return;
        }

        const cliente  = clientes.find(c => c.id === parseInt(selCliente.value, 10));
        const vendedor = Auth.usuarioActual();
        const subtotal = carrito.reduce((s,i) => s + i.subtotal, 0);
        const impuesto = subtotal * (config.impuesto / 100);
        const total    = subtotal + impuesto;

        const venta = {
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            vendedorId: vendedor.id,
            vendedorNombre: vendedor.nombre,
            detalles: carrito.slice(),
            subtotal,
            impuesto,
            total,
            fecha: new Date().toISOString()
        };

        // BD: POST /api/ventas (idealmente dentro de una transacción SQL)
        await DB.crearVenta(venta);
        UI.notificar('Venta registrada correctamente', 'exito');

        carrito = [];
        selCliente.value = '';
        pintarCarrito();

        // Volver a cargar productos para reflejar el nuevo stock
        productos = await DB.obtenerProductos();
        selProducto.innerHTML = '<option value="">-- Selecciona un producto --</option>' +
            productos.map(p => `<option value="${p.id}">${p.nombre} (Stock: ${p.stock}) - ${UI.moneda(p.precio)}</option>`).join('');

        await refrescarHistorial();
    }

    function cancelar(){
        if(carrito.length === 0) return;
        if(!UI.confirmar('¿Descartar la venta en curso?')) return;
        carrito = [];
        selCliente.value = '';
        pintarCarrito();
    }

    async function refrescarHistorial(){
        // BD: GET /api/ventas?limit=10
        const ventas = (await DB.obtenerVentas())
            .slice()
            .sort((a,b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 10);

        if(ventas.length === 0){
            tablaHist.innerHTML = `<tr><td colspan="5" class="vacio">Sin ventas registradas.</td></tr>`;
            return;
        }

        tablaHist.innerHTML = ventas.map(v => `
            <tr>
                <td>${String(v.id).padStart(3,'0')}</td>
                <td>${new Date(v.fecha).toLocaleString()}</td>
                <td>${v.clienteNombre || '-'}</td>
                <td>${v.vendedorNombre || '-'}</td>
                <td>${UI.moneda(v.total)}</td>
            </tr>
        `).join('');
    }

    // Eventos
    btnAgregar.addEventListener('click', agregarAlCarrito);
    btnFinalizar.addEventListener('click', finalizarVenta);
    btnCancelar.addEventListener('click', cancelar);
    tablaDet.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-idx]');
        if(btn) quitarDelCarrito(parseInt(btn.dataset.idx, 10));
    });

    await cargarInicial();
    pintarCarrito();
})();
