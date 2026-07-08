/* =============================================================================
   perfil.js - Perfil del usuario logueado
   -----------------------------------------------------------------------------
   Permite actualizar los datos personales y cambiar la contraseña.
   ============================================================================= */

(async function initPerfil(){
    Auth.protegerPagina();
    UI.renderMenu('perfil');
    UI.pintarUsuario();

    const yo = Auth.usuarioActual();

    const formPerfil    = document.getElementById('formPerfil');
    const formPassword  = document.getElementById('formPassword');
    const inpNombre     = document.getElementById('nombre');
    const inpUsuario    = document.getElementById('usuario');
    const inpCorreo     = document.getElementById('correo');
    const inpRol        = document.getElementById('rol');
    const inpPassAct    = document.getElementById('passActual');
    const inpPassNuevo  = document.getElementById('passNueva');
    const inpPassConf   = document.getElementById('passConfirmar');

    // Rellenar con datos actuales
    // BD: GET /api/usuarios/:id (o el endpoint /me para el token actual)
    const usuario = await DB.obtenerUsuario(yo.id);
    if(!usuario){
        UI.notificar('No se pudo cargar el perfil', 'error');
        return;
    }

    inpNombre.value  = usuario.nombre;
    inpUsuario.value = usuario.usuario;
    inpCorreo.value  = usuario.correo;
    inpRol.value     = usuario.rol;

    /**
     * Guardar cambios de datos personales.
     * BD: PUT /api/usuarios/:id (el backend valida que el token corresponda al mismo id)
     */
    formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cambios = {
            nombre: inpNombre.value.trim(),
            correo: inpCorreo.value.trim()
        };
        const actualizado = await DB.actualizarUsuario(yo.id, cambios);
        if(actualizado){
            // Refrescar sesión para que el nombre nuevo aparezca en el menú y encabezado
            const nuevaSesion = { ...yo, ...cambios };
            sessionStorage.setItem('sistema_ventas_sesion', JSON.stringify(nuevaSesion));
            UI.pintarUsuario();
            UI.notificar('Perfil actualizado', 'exito');
        }else{
            UI.notificar('No se pudo actualizar', 'error');
        }
    });

    /**
     * Cambio de contraseña.
     * BD: PUT /api/usuarios/:id/password (el backend valida la contraseña actual
     *      y guarda la nueva HASHEADA con bcrypt/argon2).
     */
    formPassword.addEventListener('submit', async (e) => {
        e.preventDefault();
        const actual    = inpPassAct.value;
        const nueva     = inpPassNuevo.value;
        const confirmar = inpPassConf.value;

        if(nueva !== confirmar){
            UI.notificar('Las contraseñas nuevas no coinciden', 'error');
            return;
        }
        if(nueva.length < 6){
            UI.notificar('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        // Verificamos la contraseña actual reutilizando el login
        // BD: en el backend, esta verificación se hace comparando el hash
        const ok = await DB.login(usuario.correo, actual);
        if(!ok){
            UI.notificar('La contraseña actual no es correcta', 'error');
            return;
        }

        await DB.actualizarUsuario(yo.id, { password: nueva });
        formPassword.reset();
        UI.notificar('Contraseña actualizada', 'exito');
    });
})();
