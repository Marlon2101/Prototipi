/* =============================================================================
   db.js - Capa de acceso a datos (Data Access Layer)
   -----------------------------------------------------------------------------
   Este archivo es el ÚNICO punto donde el resto del sistema pide/guarda datos.
   Actualmente todas las funciones trabajan contra "data.js" (memoria + localStorage)
   para que el prototipo sea 100% funcional sin backend.

   >>> CUANDO SE INTEGRE LA BASE DE DATOS REAL <<<
   Reemplazar el cuerpo de cada función por una llamada HTTP (fetch/axios)
   contra la API que exponga el backend. Las firmas (nombre, parámetros y
   valor de retorno) deben mantenerse para no romper el resto del código.

   Ejemplo de reemplazo típico:

       async function obtenerProductos(){
           const res = await fetch(`${API_URL}/productos`);
           return await res.json();
       }

       async function crearProducto(producto){
           const res = await fetch(`${API_URL}/productos`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(producto)
           });
           return await res.json();
       }

   Se recomienda usar async/await en todas las funciones para que el cambio
   a red sea transparente. Los llamadores ya están preparados para promesas.
   ============================================================================= */

// URL base de la API real - DESCOMENTAR cuando exista backend
// const API_URL = 'http://localhost:3000/api';

const DB = (() => {

    // ---------------------------------------------------------------------
    // AUTENTICACIÓN
    // ---------------------------------------------------------------------

    /**
     * Valida credenciales de usuario.
     * BD: SELECT * FROM usuarios WHERE correo = ? AND password = ? AND estado = 'activo'
     */
    async function login(correo, password){
        const usuario = Data.usuarios.find(u =>
            u.correo === correo &&
            u.password === password &&
            u.estado === 'activo'
        );
        if(!usuario) return null;
        // Se omite el password del objeto devuelto por seguridad
        const { password: _, ...seguro } = usuario;
        return seguro;
    }

    /**
     * Envía enlace de recuperación de contraseña.
     * BD: 1) SELECT correo FROM usuarios WHERE correo = ?
     *     2) INSERT INTO tokens_recuperacion (usuario_id, token, expira) VALUES (...)
     *     3) Enviar email desde el backend con el token
     */
    async function solicitarRecuperacion(correo){
        const existe = Data.usuarios.some(u => u.correo === correo);
        return existe;
    }

    // ---------------------------------------------------------------------
    // PRODUCTOS
    // ---------------------------------------------------------------------

    /** BD: SELECT * FROM productos ORDER BY id */
    async function obtenerProductos(){
        return [...Data.productos];
    }

    /** BD: SELECT * FROM productos WHERE id = ? */
    async function obtenerProducto(id){
        return Data.productos.find(p => p.id === id) || null;
    }

    /** BD: INSERT INTO productos (...) VALUES (...) */
    async function crearProducto(producto){
        const nuevo = { ...producto, id: Data.siguienteId('productos') };
        Data.productos.push(nuevo);
        Data.persistir();
        return nuevo;
    }

    /** BD: UPDATE productos SET ... WHERE id = ? */
    async function actualizarProducto(id, cambios){
        const i = Data.productos.findIndex(p => p.id === id);
        if(i === -1) return null;
        Data.productos[i] = { ...Data.productos[i], ...cambios, id };
        Data.persistir();
        return Data.productos[i];
    }

    /** BD: DELETE FROM productos WHERE id = ? */
    async function eliminarProducto(id){
        const antes = Data.productos.length;
        Data.productos = Data.productos.filter(p => p.id !== id);
        Data.persistir();
        return Data.productos.length < antes;
    }

    // ---------------------------------------------------------------------
    // CLIENTES
    // ---------------------------------------------------------------------

    /** BD: SELECT * FROM clientes ORDER BY id */
    async function obtenerClientes(){
        return [...Data.clientes];
    }

    async function obtenerCliente(id){
        return Data.clientes.find(c => c.id === id) || null;
    }

    /** BD: INSERT INTO clientes (...) VALUES (...) */
    async function crearCliente(cliente){
        const nuevo = { ...cliente, id: Data.siguienteId('clientes') };
        Data.clientes.push(nuevo);
        Data.persistir();
        return nuevo;
    }

    /** BD: UPDATE clientes SET ... WHERE id = ? */
    async function actualizarCliente(id, cambios){
        const i = Data.clientes.findIndex(c => c.id === id);
        if(i === -1) return null;
        Data.clientes[i] = { ...Data.clientes[i], ...cambios, id };
        Data.persistir();
        return Data.clientes[i];
    }

    /** BD: DELETE FROM clientes WHERE id = ? */
    async function eliminarCliente(id){
        const antes = Data.clientes.length;
        Data.clientes = Data.clientes.filter(c => c.id !== id);
        Data.persistir();
        return Data.clientes.length < antes;
    }

    // ---------------------------------------------------------------------
    // USUARIOS
    // ---------------------------------------------------------------------

    /** BD: SELECT id, nombre, usuario, correo, rol, estado FROM usuarios */
    async function obtenerUsuarios(){
        // No devolvemos el password para simular buenas prácticas
        return Data.usuarios.map(({ password, ...u }) => u);
    }

    async function obtenerUsuario(id){
        const u = Data.usuarios.find(u => u.id === id);
        if(!u) return null;
        const { password, ...seguro } = u;
        return seguro;
    }

    /** BD: INSERT INTO usuarios (...) VALUES (...) - password debe hashearse en backend */
    async function crearUsuario(usuario){
        const nuevo = { ...usuario, id: Data.siguienteId('usuarios') };
        Data.usuarios.push(nuevo);
        Data.persistir();
        const { password, ...seguro } = nuevo;
        return seguro;
    }

    /** BD: UPDATE usuarios SET ... WHERE id = ? */
    async function actualizarUsuario(id, cambios){
        const i = Data.usuarios.findIndex(u => u.id === id);
        if(i === -1) return null;
        // Si no se envía password se mantiene el actual
        if(!cambios.password) delete cambios.password;
        Data.usuarios[i] = { ...Data.usuarios[i], ...cambios, id };
        Data.persistir();
        const { password, ...seguro } = Data.usuarios[i];
        return seguro;
    }

    /** BD: DELETE FROM usuarios WHERE id = ? */
    async function eliminarUsuario(id){
        const antes = Data.usuarios.length;
        Data.usuarios = Data.usuarios.filter(u => u.id !== id);
        Data.persistir();
        return Data.usuarios.length < antes;
    }

    // ---------------------------------------------------------------------
    // VENTAS
    // ---------------------------------------------------------------------

    /** BD: SELECT v.*, c.nombre AS cliente FROM ventas v JOIN clientes c ON v.cliente_id = c.id */
    async function obtenerVentas(){
        return [...Data.ventas];
    }

    /**
     * Registra una nueva venta y descuenta stock de los productos vendidos.
     * BD (idealmente dentro de una transacción):
     *   1) INSERT INTO ventas (cliente_id, fecha, total, vendedor_id) VALUES (...)
     *   2) Para cada detalle: INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio, subtotal)
     *   3) Para cada detalle: UPDATE productos SET stock = stock - ? WHERE id = ?
     */
    async function crearVenta(venta){
        // Descontar stock
        for(const item of venta.detalles){
            const p = Data.productos.find(pr => pr.id === item.productoId);
            if(p) p.stock = Math.max(0, p.stock - item.cantidad);
        }
        const nueva = {
            ...venta,
            id: Data.siguienteId('ventas'),
            fecha: venta.fecha || new Date().toISOString()
        };
        Data.ventas.push(nueva);
        Data.persistir();
        return nueva;
    }

    // ---------------------------------------------------------------------
    // MÉTRICAS / REPORTES
    // ---------------------------------------------------------------------

    /**
     * Métricas del dashboard.
     * BD:
     *   SELECT SUM(total) FROM ventas WHERE DATE(fecha) = CURDATE();
     *   SELECT COUNT(*) FROM productos;
     *   SELECT COUNT(*) FROM clientes;
     *   SELECT COUNT(*) FROM ventas WHERE DATE(fecha) = CURDATE();
     */
    async function obtenerMetricas(){
        const hoy = new Date().toISOString().slice(0,10);
        const ventasHoy = Data.ventas.filter(v => v.fecha.slice(0,10) === hoy);
        const ventasHoyTotal = ventasHoy.reduce((s,v) => s + v.total, 0);
        return {
            ventasHoy: ventasHoyTotal,
            transaccionesHoy: ventasHoy.length,
            totalProductos: Data.productos.length,
            totalClientes: Data.clientes.length,
            totalUsuarios: Data.usuarios.length,
            stockBajo: Data.productos.filter(p => p.stock <= 5).length
        };
    }

    /**
     * Reporte de ventas por rango de fechas.
     * BD: SELECT * FROM ventas WHERE fecha BETWEEN ? AND ?
     */
    async function reporteVentas(desde, hasta){
        return Data.ventas.filter(v => {
            const f = v.fecha.slice(0,10);
            return (!desde || f >= desde) && (!hasta || f <= hasta);
        });
    }

    // ---------------------------------------------------------------------
    // CONFIGURACIÓN DE LA APLICACIÓN
    // ---------------------------------------------------------------------

    /** BD: SELECT * FROM configuracion LIMIT 1 */
    async function obtenerConfiguracion(){
        return { ...Data.configuracion };
    }

    /** BD: UPDATE configuracion SET ... */
    async function actualizarConfiguracion(cambios){
        Data.configuracion = { ...Data.configuracion, ...cambios };
        Data.persistir();
        return { ...Data.configuracion };
    }

    // API pública del módulo
    return {
        login, solicitarRecuperacion,
        obtenerProductos, obtenerProducto, crearProducto, actualizarProducto, eliminarProducto,
        obtenerClientes, obtenerCliente, crearCliente, actualizarCliente, eliminarCliente,
        obtenerUsuarios, obtenerUsuario, crearUsuario, actualizarUsuario, eliminarUsuario,
        obtenerVentas, crearVenta,
        obtenerMetricas, reporteVentas,
        obtenerConfiguracion, actualizarConfiguracion
    };

})();
