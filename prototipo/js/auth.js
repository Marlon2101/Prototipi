/* =============================================================================
   auth.js - Sesión de usuario
   -----------------------------------------------------------------------------
   Guarda el usuario logueado en sessionStorage. Todas las páginas internas
   invocan Auth.protegerPagina() para redirigir al login si no hay sesión.

   >>> AL INTEGRAR BACKEND REAL <<<
   - Reemplazar el uso de sessionStorage por un token JWT devuelto por la API.
   - Enviar el token en el header Authorization: Bearer <token> desde db.js.
   - Validar el token en cada petición del backend.
   ============================================================================= */

const Auth = (() => {

    const CLAVE = 'sistema_ventas_sesion';

    function usuarioActual(){
        try{
            const s = sessionStorage.getItem(CLAVE);
            return s ? JSON.parse(s) : null;
        }catch(e){
            return null;
        }
    }

    function guardarSesion(usuario){
        sessionStorage.setItem(CLAVE, JSON.stringify(usuario));
    }

    async function iniciarSesion(correo, password){
        const usuario = await DB.login(correo, password);
        if(!usuario) return null;
        guardarSesion(usuario);
        return usuario;
    }

    function cerrarSesion(){
        sessionStorage.removeItem(CLAVE);
        window.location.href = 'login.html';
    }

    /**
     * Redirige al login si no hay sesión activa.
     * Debe llamarse en el <head> o al inicio del <script> de cada página interna.
     */
    function protegerPagina(){
        if(!usuarioActual()){
            window.location.href = 'login.html';
        }
    }

    /**
     * Redirige al dashboard si ya hay sesión activa (usar en login/recuperar).
     */
    function redirigirSiLogueado(){
        if(usuarioActual()){
            window.location.href = 'dashboard.html';
        }
    }

    return {
        usuarioActual,
        iniciarSesion,
        cerrarSesion,
        protegerPagina,
        redirigirSiLogueado
    };

})();
