/* =============================================================================
   ui.js - Utilidades de interfaz reutilizables por todas las páginas
   -----------------------------------------------------------------------------
   - Renderiza el menú lateral marcando la página activa
   - Muestra notificaciones tipo toast
   - Abre y cierra el modal genérico
   - Formatea moneda según la configuración
   ============================================================================= */

const UI = (() => {

    // Rutas relativas desde /pages (todas las páginas viven en la misma carpeta)
    const OPCIONES_MENU = [
        { id: 'dashboard',     titulo: 'Dashboard',     href: 'dashboard.html'     },
        { id: 'productos',     titulo: 'Productos',     href: 'productos.html'     },
        { id: 'clientes',      titulo: 'Clientes',      href: 'clientes.html'      },
        { id: 'ventas',        titulo: 'Ventas',        href: 'ventas.html'        },
        { id: 'reportes',      titulo: 'Reportes',      href: 'reportes.html'      },
        { id: 'usuarios',      titulo: 'Usuarios',      href: 'usuarios.html', soloAdmin: true },
        { id: 'perfil',        titulo: 'Perfil',        href: 'perfil.html'        },
        { id: 'configuracion', titulo: 'Configuración', href: 'configuracion.html', soloAdmin: true }
    ];

    /**
     * Renderiza el menú lateral dentro del elemento con id="menu".
     * @param {string} activo id de la opción actualmente seleccionada
     */
    function renderMenu(activo){
        const contenedor = document.getElementById('menu');
        if(!contenedor) return;

        const usuario = Auth.usuarioActual();
        const esAdmin = usuario && usuario.rol === 'admin';

        const enlaces = OPCIONES_MENU
            .filter(op => !op.soloAdmin || esAdmin)
            .map(op => `<a href="${op.href}" class="${op.id === activo ? 'activo' : ''}">${op.titulo}</a>`)
            .join('');

        contenedor.innerHTML = `
            <h2>Sistema Ventas</h2>
            ${enlaces}
            <hr class="separador">
            <button class="cerrar-sesion" id="btnCerrarSesion">Cerrar Sesión</button>
        `;

        document.getElementById('btnCerrarSesion').addEventListener('click', () => {
            Auth.cerrarSesion();
        });
    }

    /**
     * Muestra el nombre del usuario logueado en el encabezado (opcional).
     */
    function pintarUsuario(idElemento = 'usuarioActual'){
        const el = document.getElementById(idElemento);
        if(!el) return;
        const u = Auth.usuarioActual();
        if(u) el.textContent = `${u.nombre} (${u.rol})`;
    }

    /**
     * Notificación tipo toast en la esquina superior derecha.
     * @param {string} mensaje
     * @param {'exito'|'error'|'info'} tipo
     */
    function notificar(mensaje, tipo = 'info'){
        const div = document.createElement('div');
        div.className = `notificacion ${tipo}`;
        div.textContent = mensaje;
        document.body.appendChild(div);
        // Forzar reflow para animar
        requestAnimationFrame(() => div.classList.add('mostrar'));
        setTimeout(() => {
            div.classList.remove('mostrar');
            setTimeout(() => div.remove(), 300);
        }, 2800);
    }

    /**
     * Abre un modal dado su id.
     */
    function abrirModal(id){
        const m = document.getElementById(id);
        if(m) m.classList.add('activo');
    }

    /**
     * Cierra un modal dado su id.
     */
    function cerrarModal(id){
        const m = document.getElementById(id);
        if(m) m.classList.remove('activo');
    }

    /**
     * Cierra el modal cuando se hace clic sobre el fondo oscuro.
     */
    function registrarCierreFondo(){
        document.querySelectorAll('.modal-fondo').forEach(f => {
            f.addEventListener('click', e => {
                if(e.target === f) f.classList.remove('activo');
            });
        });
    }

    /**
     * Formatea un número como moneda usando la configuración guardada.
     */
    function moneda(valor){
        const cfg = Data.configuracion;
        const numero = Number(valor || 0).toFixed(2);
        return `${cfg.simbolo}${numero}`;
    }

    /**
     * Confirmación simple. Envuelve confirm() para poder cambiarla luego.
     */
    function confirmar(mensaje){
        return window.confirm(mensaje);
    }

    return {
        renderMenu, pintarUsuario,
        notificar,
        abrirModal, cerrarModal, registrarCierreFondo,
        moneda, confirmar
    };

})();
