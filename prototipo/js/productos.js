/* =============================================================================
   productos.js - CRUD de productos
   ============================================================================= */

(function initProductos(){
    Auth.protegerPagina();
    UI.renderMenu('productos');
    UI.pintarUsuario();
    UI.registrarCierreFondo();

    const tbody       = document.getElementById('tablaProductos');
    const buscador    = document.getElementById('buscador');
    const btnNuevo    = document.getElementById('btnNuevo');
    const formulario  = document.getElementById('formProducto');
    const tituloModal = document.getElementById('tituloModal');

    let productosCache = [];

    async function cargarProductos(){
        // BD: DB.obtenerProductos() se convertirá en fetch('/api/productos')
        productosCache = await DB.obtenerProductos();
        pintar();
    }

    function pintar(){
        const q = buscador.value.toLowerCase().trim();
        const lista = productosCache.filter(p =>
            !q ||
            p.nombre.toLowerCase().includes(q) ||
            p.codigo.toLowerCase().includes(q) ||
            p.categoria.toLowerCase().includes(q)
        );

        if(lista.length === 0){
            tbody.innerHTML = `<tr><td colspan="7" class="vacio">No hay productos.</td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.codigo}</td>
                <td>${p.nombre}</td>
                <td>${p.categoria}</td>
                <td>${UI.moneda(p.precio)}</td>
                <td>${p.stock}</td>
                <td>
                    <button class="editar" data-id="${p.id}" data-accion="editar">Editar</button>
                    <button class="eliminar" data-id="${p.id}" data-accion="eliminar">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    function abrirNuevo(){
        formulario.reset();
        document.getElementById('productoId').value = '';
        tituloModal.textContent = 'Nuevo Producto';
        UI.abrirModal('modalProducto');
    }

    function abrirEdicion(id){
        const p = productosCache.find(x => x.id === id);
        if(!p) return;
        document.getElementById('productoId').value = p.id;
        document.getElementById('codigo').value     = p.codigo;
        document.getElementById('nombre').value     = p.nombre;
        document.getElementById('categoria').value  = p.categoria;
        document.getElementById('precio').value     = p.precio;
        document.getElementById('stock').value      = p.stock;
        tituloModal.textContent = 'Editar Producto';
        UI.abrirModal('modalProducto');
    }

    async function guardar(e){
        e.preventDefault();
        const id = document.getElementById('productoId').value;
        const datos = {
            codigo:    document.getElementById('codigo').value.trim(),
            nombre:    document.getElementById('nombre').value.trim(),
            categoria: document.getElementById('categoria').value.trim(),
            precio:    parseFloat(document.getElementById('precio').value),
            stock:     parseInt(document.getElementById('stock').value, 10)
        };

        // BD: crearProducto -> POST /api/productos ; actualizarProducto -> PUT /api/productos/:id
        if(id){
            await DB.actualizarProducto(parseInt(id, 10), datos);
            UI.notificar('Producto actualizado', 'exito');
        }else{
            await DB.crearProducto(datos);
            UI.notificar('Producto creado', 'exito');
        }

        UI.cerrarModal('modalProducto');
        await cargarProductos();
    }

    async function eliminar(id){
        if(!UI.confirmar('¿Eliminar este producto?')) return;
        // BD: DELETE /api/productos/:id
        await DB.eliminarProducto(id);
        UI.notificar('Producto eliminado', 'exito');
        await cargarProductos();
    }

    // Delegación de eventos en la tabla
    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-accion]');
        if(!btn) return;
        const id = parseInt(btn.dataset.id, 10);
        if(btn.dataset.accion === 'editar')   abrirEdicion(id);
        if(btn.dataset.accion === 'eliminar') eliminar(id);
    });

    buscador.addEventListener('input', pintar);
    btnNuevo.addEventListener('click', abrirNuevo);
    formulario.addEventListener('submit', guardar);

    cargarProductos();
})();
