/* =============================================================================
   usuarios.js - CRUD de usuarios del sistema
   -----------------------------------------------------------------------------
   Solo accesible para el rol "admin". Se protege desde el menú (opción oculta)
   y también al cargar la página (redirección si no es admin).
   ============================================================================= */

(function initUsuarios(){
    Auth.protegerPagina();

    const yo = Auth.usuarioActual();
    if(!yo || yo.rol !== 'admin'){
        UI.notificar('Acceso restringido a administradores', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 800);
        return;
    }

    UI.renderMenu('usuarios');
    UI.pintarUsuario();
    UI.registrarCierreFondo();

    const tbody       = document.getElementById('tablaUsuarios');
    const buscador    = document.getElementById('buscador');
    const filtroRol   = document.getElementById('filtroRol');
    const btnNuevo    = document.getElementById('btnNuevo');
    const formulario  = document.getElementById('formUsuario');
    const tituloModal = document.getElementById('tituloModal');
    const hintPass    = document.getElementById('hintPassword');
    const inputPass   = document.getElementById('password');

    let cache = [];

    async function cargar(){
        // BD: GET /api/usuarios
        cache = await DB.obtenerUsuarios();
        pintar();
    }

    function pintar(){
        const q = buscador.value.toLowerCase().trim();
        const rol = filtroRol.value;
        const lista = cache.filter(u =>
            (!q || u.nombre.toLowerCase().includes(q) ||
                   u.usuario.toLowerCase().includes(q) ||
                   (u.correo || '').toLowerCase().includes(q))
            && (!rol || u.rol === rol)
        );

        if(lista.length === 0){
            tbody.innerHTML = `<tr><td colspan="7" class="vacio">No hay usuarios.</td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.nombre}</td>
                <td>${u.usuario}</td>
                <td>${u.correo}</td>
                <td><span class="badge ${u.rol}">${u.rol}</span></td>
                <td><span class="badge ${u.estado}">${u.estado}</span></td>
                <td>
                    <button class="editar" data-id="${u.id}" data-accion="editar">Editar</button>
                    <button class="eliminar" data-id="${u.id}" data-accion="eliminar">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    function abrirNuevo(){
        formulario.reset();
        document.getElementById('usuarioId').value = '';
        tituloModal.textContent = 'Nuevo Usuario';
        hintPass.textContent = '';
        inputPass.required = true;
        UI.abrirModal('modalUsuario');
    }

    function abrirEdicion(id){
        const u = cache.find(x => x.id === id);
        if(!u) return;
        document.getElementById('usuarioId').value = u.id;
        document.getElementById('nombre').value    = u.nombre;
        document.getElementById('usuario').value   = u.usuario;
        document.getElementById('correo').value    = u.correo;
        document.getElementById('rol').value       = u.rol;
        document.getElementById('estado').value    = u.estado;
        inputPass.value = '';
        inputPass.required = false;
        hintPass.textContent = '(dejar vacío para mantener la actual)';
        tituloModal.textContent = 'Editar Usuario';
        UI.abrirModal('modalUsuario');
    }

    async function guardar(e){
        e.preventDefault();
        const id = document.getElementById('usuarioId').value;
        const datos = {
            nombre:  document.getElementById('nombre').value.trim(),
            usuario: document.getElementById('usuario').value.trim(),
            correo:  document.getElementById('correo').value.trim(),
            rol:     document.getElementById('rol').value,
            estado:  document.getElementById('estado').value
        };

        const pw = inputPass.value;
        if(pw) datos.password = pw;

        // BD: password debería enviarse HASHEADO desde el backend (bcrypt/argon2)
        if(id){
            await DB.actualizarUsuario(parseInt(id, 10), datos);
            UI.notificar('Usuario actualizado', 'exito');
        }else{
            if(!datos.password){
                UI.notificar('La contraseña es obligatoria', 'error');
                return;
            }
            await DB.crearUsuario(datos);
            UI.notificar('Usuario creado', 'exito');
        }

        UI.cerrarModal('modalUsuario');
        await cargar();
    }

    async function eliminar(id){
        if(id === yo.id){
            UI.notificar('No puedes eliminarte a ti mismo', 'error');
            return;
        }
        if(!UI.confirmar('¿Eliminar este usuario?')) return;
        // BD: DELETE /api/usuarios/:id
        await DB.eliminarUsuario(id);
        UI.notificar('Usuario eliminado', 'exito');
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
    filtroRol.addEventListener('change', pintar);
    btnNuevo.addEventListener('click', abrirNuevo);
    formulario.addEventListener('submit', guardar);

    cargar();
})();
