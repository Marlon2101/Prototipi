/* =============================================================================
   clientes.js - CRUD de clientes
   ============================================================================= */

(function initClientes(){
    Auth.protegerPagina();
    UI.renderMenu('clientes');
    UI.pintarUsuario();
    UI.registrarCierreFondo();

    const tbody       = document.getElementById('tablaClientes');
    const buscador    = document.getElementById('buscador');
    const btnNuevo    = document.getElementById('btnNuevo');
    const formulario  = document.getElementById('formCliente');
    const tituloModal = document.getElementById('tituloModal');

    let cache = [];

    async function cargar(){
        // BD: fetch('/api/clientes')
        cache = await DB.obtenerClientes();
        pintar();
    }

    function pintar(){
        const q = buscador.value.toLowerCase().trim();
        const lista = cache.filter(c =>
            !q ||
            c.nombre.toLowerCase().includes(q) ||
            (c.correo || '').toLowerCase().includes(q) ||
            (c.dni || '').toLowerCase().includes(q)
        );

        if(lista.length === 0){
            tbody.innerHTML = `<tr><td colspan="7" class="vacio">No hay clientes.</td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.nombre}</td>
                <td>${c.dni || '-'}</td>
                <td>${c.correo}</td>
                <td>${c.telefono}</td>
                <td>${c.direccion || '-'}</td>
                <td>
                    <button class="editar" data-id="${c.id}" data-accion="editar">Editar</button>
                    <button class="eliminar" data-id="${c.id}" data-accion="eliminar">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    function abrirNuevo(){
        formulario.reset();
        document.getElementById('clienteId').value = '';
        tituloModal.textContent = 'Nuevo Cliente';
        UI.abrirModal('modalCliente');
    }

    function abrirEdicion(id){
        const c = cache.find(x => x.id === id);
        if(!c) return;
        document.getElementById('clienteId').value = c.id;
        document.getElementById('nombre').value    = c.nombre;
        document.getElementById('dni').value       = c.dni || '';
        document.getElementById('correo').value    = c.correo;
        document.getElementById('telefono').value  = c.telefono;
        document.getElementById('direccion').value = c.direccion || '';
        tituloModal.textContent = 'Editar Cliente';
        UI.abrirModal('modalCliente');
    }

    async function guardar(e){
        e.preventDefault();
        const id = document.getElementById('clienteId').value;
        const datos = {
            nombre:    document.getElementById('nombre').value.trim(),
            dni:       document.getElementById('dni').value.trim(),
            correo:    document.getElementById('correo').value.trim(),
            telefono:  document.getElementById('telefono').value.trim(),
            direccion: document.getElementById('direccion').value.trim()
        };

        // BD: POST /api/clientes o PUT /api/clientes/:id
        if(id){
            await DB.actualizarCliente(parseInt(id, 10), datos);
            UI.notificar('Cliente actualizado', 'exito');
        }else{
            await DB.crearCliente(datos);
            UI.notificar('Cliente creado', 'exito');
        }

        UI.cerrarModal('modalCliente');
        await cargar();
    }

    async function eliminar(id){
        if(!UI.confirmar('¿Eliminar este cliente?')) return;
        // BD: DELETE /api/clientes/:id
        await DB.eliminarCliente(id);
        UI.notificar('Cliente eliminado', 'exito');
        await cargar();
    }

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

    cargar();
})();
