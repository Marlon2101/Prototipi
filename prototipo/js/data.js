/* =============================================================================
   data.js - Datos simulados persistidos en localStorage
   -----------------------------------------------------------------------------
   Este archivo emula una base de datos usando localStorage. Sirve para probar
   toda la funcionalidad del prototipo sin backend.

   >>> AL INTEGRAR LA BASE DE DATOS REAL <<<
   Este archivo puede ELIMINARSE por completo, ya que db.js será el único que
   consuma datos (a través de HTTP). Los datos iniciales aquí definidos pueden
   servir como script de "seed" para poblar la base real.
   ============================================================================= */

const Data = (() => {

    const CLAVE = 'sistema_ventas_data_v1';

    // Datos por defecto - se usan la primera vez o al restablecer
    const SEED = {
        productos: [
            { id: 1, codigo: 'P001', nombre: 'Laptop HP', categoria: 'Computadoras', precio: 850, stock: 10 },
            { id: 2, codigo: 'P002', nombre: 'Mouse Logitech', categoria: 'Accesorios', precio: 25, stock: 50 },
            { id: 3, codigo: 'P003', nombre: 'Teclado Mecánico', categoria: 'Accesorios', precio: 75, stock: 20 },
            { id: 4, codigo: 'P004', nombre: 'Monitor 24"', categoria: 'Monitores', precio: 220, stock: 8 }
        ],
        clientes: [
            { id: 1, nombre: 'Juan Pérez',  dni: '00000000-1', correo: 'juan@gmail.com', telefono: '7777-7777', direccion: 'San Salvador' },
            { id: 2, nombre: 'Ana López',   dni: '00000000-2', correo: 'ana@gmail.com',  telefono: '7878-9898', direccion: 'Santa Ana' },
            { id: 3, nombre: 'Carlos Mena', dni: '00000000-3', correo: 'carlos@gmail.com', telefono: '7070-1010', direccion: 'La Libertad' }
        ],
        usuarios: [
            { id: 1, nombre: 'Administrador', usuario: 'admin',   correo: 'admin@sistema.com',   password: 'admin123',  rol: 'admin',    estado: 'activo' },
            { id: 2, nombre: 'Juan Pérez',    usuario: 'jperez',  correo: 'jperez@sistema.com',  password: 'vendedor',  rol: 'vendedor', estado: 'activo' },
            { id: 3, nombre: 'María López',   usuario: 'mlopez',  correo: 'mlopez@sistema.com',  password: 'almacen',   rol: 'almacen',  estado: 'activo' }
        ],
        ventas: [
            {
                id: 1,
                fecha: new Date().toISOString(),
                clienteId: 1,
                clienteNombre: 'Juan Pérez',
                vendedorId: 2,
                vendedorNombre: 'Juan Pérez',
                detalles: [
                    { productoId: 1, nombre: 'Laptop HP',       cantidad: 1, precio: 850, subtotal: 850 },
                    { productoId: 2, nombre: 'Mouse Logitech',  cantidad: 2, precio: 25,  subtotal: 50  }
                ],
                total: 900
            }
        ],
        configuracion: {
            nombreEmpresa: 'Mi Empresa S.A. de C.V.',
            moneda: 'USD',
            simbolo: '$',
            impuesto: 13,
            direccion: 'San Salvador, El Salvador',
            telefono: '2222-2222'
        },
        contadores: { productos: 4, clientes: 3, usuarios: 3, ventas: 1 }
    };

    // Carga desde localStorage o usa el seed
    function cargar(){
        try{
            const guardado = localStorage.getItem(CLAVE);
            if(guardado) return JSON.parse(guardado);
        }catch(e){
            console.warn('No se pudo leer localStorage, usando datos por defecto', e);
        }
        return JSON.parse(JSON.stringify(SEED));
    }

    const estado = cargar();

    function persistir(){
        try{
            localStorage.setItem(CLAVE, JSON.stringify(estado));
        }catch(e){
            console.warn('No se pudo persistir en localStorage', e);
        }
    }

    function siguienteId(entidad){
        estado.contadores[entidad] = (estado.contadores[entidad] || 0) + 1;
        return estado.contadores[entidad];
    }

    function restablecer(){
        const semilla = JSON.parse(JSON.stringify(SEED));
        Object.assign(estado, semilla);
        persistir();
    }

    return {
        get productos()    { return estado.productos; },
        set productos(v)   { estado.productos = v; },
        get clientes()     { return estado.clientes; },
        set clientes(v)    { estado.clientes = v; },
        get usuarios()     { return estado.usuarios; },
        set usuarios(v)    { estado.usuarios = v; },
        get ventas()       { return estado.ventas; },
        set ventas(v)      { estado.ventas = v; },
        get configuracion(){ return estado.configuracion; },
        set configuracion(v){ estado.configuracion = v; },
        siguienteId,
        persistir,
        restablecer
    };

})();
