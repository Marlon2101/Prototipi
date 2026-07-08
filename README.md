# Sistema de Ventas - Prototipo Web

Prototipo funcional de un sistema de ventas en HTML + CSS + JavaScript puro
(sin frameworks). Toda la información se almacena en `localStorage` para
permitir probar el flujo completo sin necesidad de backend. La capa de datos
(`js/db.js`) está diseñada para reemplazarse por llamadas HTTP reales cuando
se conecte a la base de datos.

---

## Estructura del proyecto

```
Prototipi/
├── README.md                     Este archivo
└── prototipo/
    ├── index.html                Punto de entrada (redirige a login/dashboard)
    │
    ├── css/
    │   └── estilos.css           Hoja de estilos única para toda la app
    │
    ├── pages/                    Vistas HTML (todas cargan los mismos módulos JS)
    │   ├── login.html
    │   ├── recuperar.html
    │   ├── dashboard.html
    │   ├── productos.html
    │   ├── clientes.html
    │   ├── ventas.html
    │   ├── reportes.html
    │   ├── usuarios.html         (solo administradores)
    │   ├── perfil.html
    │   └── configuracion.html    (solo administradores)
    │
    └── js/
        ├── data.js               Datos "seed" + persistencia en localStorage
        ├── db.js                 Capa de acceso a datos (se sustituye por API)
        ├── auth.js               Sesión de usuario (sessionStorage / JWT futuro)
        ├── ui.js                 Utilidades de interfaz (menú, toasts, modales)
        ├── dashboard.js          Lógica del panel principal
        ├── productos.js          CRUD de productos
        ├── clientes.js           CRUD de clientes
        ├── ventas.js             Registro de ventas + historial
        ├── reportes.js           Reportes filtrables + exportación CSV
        ├── usuarios.js           CRUD de usuarios del sistema
        ├── perfil.js             Datos del usuario logueado + cambio de contraseña
        └── configuracion.js      Ajustes generales de la empresa
```

---

## Cómo ejecutarlo

No requiere instalación ni servidor. Basta con abrir en el navegador:

```
prototipo/index.html
```

Si prefieres servirlo por HTTP (recomendado para evitar problemas con
`file://`), puedes usar cualquier servidor estático. Ejemplos:

```bash
# Python 3
cd prototipo
python3 -m http.server 8080

# Node
npx serve prototipo -l 8080
```

Y luego abre <http://localhost:8080>.

---

## Credenciales de prueba

| Rol            | Usuario / Correo         | Contraseña |
| -------------- | ------------------------ | ---------- |
| Administrador  | `admin@sistema.com`      | `admin123` |
| Vendedor       | `jperez@sistema.com`     | `vendedor` |
| Almacén        | `mlopez@sistema.com`     | `almacen`  |

---

## Módulos y funcionalidades

### Login y sesión (`login.html`, `recuperar.html`)
- Formulario con validación básica.
- Guarda la sesión en `sessionStorage` bajo la clave `sistema_ventas_sesion`.
- Redirección automática al dashboard si ya hay sesión activa.
- Recuperación de contraseña simulada (se dejará conectada a un envío real
  de correo cuando exista backend).

### Dashboard (`dashboard.html`)
- Tarjetas con métricas: ventas del día, transacciones del día, total de
  productos, total de clientes, productos con stock bajo.
- Tabla con las últimas 5 ventas.

### Productos (`productos.html`)
- CRUD completo (crear, editar, eliminar, listar).
- Buscador en vivo por nombre, código o categoría.
- Campos: `codigo`, `nombre`, `categoria`, `precio`, `stock`.

### Clientes (`clientes.html`)
- CRUD completo.
- Buscador por nombre, correo o DNI.
- Campos: `nombre`, `dni`, `correo`, `telefono`, `direccion`.

### Ventas (`ventas.html`)
- Selección de cliente y armado de carrito con validación de stock.
- Cálculo automático de subtotal, impuesto (según configuración) y total.
- Al finalizar se registra la venta y se descuenta stock automáticamente.
- Historial con las últimas 10 ventas.

### Reportes (`reportes.html`)
- Filtrado por rango de fechas.
- Métricas agregadas: total, cantidad de transacciones y ticket promedio.
- Exportación del reporte a archivo `.csv` desde el navegador.

### Usuarios (`usuarios.html`) — solo administradores
- CRUD completo con roles (`admin`, `vendedor`, `almacen`) y estado
  (`activo`, `inactivo`).
- Filtro por rol y búsqueda por nombre/usuario/correo.
- Impide al administrador eliminarse a sí mismo.
- La contraseña se solicita al crear; al editar es opcional (queda la actual
  si se deja vacía).

### Perfil (`perfil.html`)
- Actualización de nombre y correo del usuario logueado.
- Cambio de contraseña con verificación de la actual.

### Configuración (`configuracion.html`) — solo administradores
- Datos de la empresa (nombre, dirección, teléfono).
- Moneda, símbolo y porcentaje de impuesto por defecto.
- Botón para restablecer los datos de ejemplo del prototipo.

---

## Cómo se conectará a la base de datos real

Toda la lógica de acceso a datos está **encapsulada en `js/db.js`**. El resto
del código NO conoce localStorage; solo llama a `DB.xxx()`. Esto permite
migrar a un backend real cambiando únicamente ese archivo.

### 1. Estructura sugerida de tablas

```sql
CREATE TABLE usuarios (
    id        INT PRIMARY KEY AUTO_INCREMENT,
    nombre    VARCHAR(80)  NOT NULL,
    usuario   VARCHAR(30)  UNIQUE NOT NULL,
    correo    VARCHAR(80)  UNIQUE NOT NULL,
    password  VARCHAR(255) NOT NULL,             -- hash bcrypt/argon2
    rol       ENUM('admin','vendedor','almacen') NOT NULL,
    estado    ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
    id        INT PRIMARY KEY AUTO_INCREMENT,
    codigo    VARCHAR(20) UNIQUE NOT NULL,
    nombre    VARCHAR(80) NOT NULL,
    categoria VARCHAR(40),
    precio    DECIMAL(10,2) NOT NULL,
    stock     INT NOT NULL DEFAULT 0
);

CREATE TABLE clientes (
    id        INT PRIMARY KEY AUTO_INCREMENT,
    nombre    VARCHAR(80) NOT NULL,
    dni       VARCHAR(20),
    correo    VARCHAR(80),
    telefono  VARCHAR(20),
    direccion VARCHAR(120)
);

CREATE TABLE ventas (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    fecha          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cliente_id     INT NOT NULL,
    vendedor_id    INT NOT NULL,
    subtotal       DECIMAL(10,2) NOT NULL,
    impuesto       DECIMAL(10,2) NOT NULL,
    total          DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (cliente_id)  REFERENCES clientes(id),
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
);

CREATE TABLE venta_detalles (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    venta_id    INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad    INT NOT NULL,
    precio      DECIMAL(10,2) NOT NULL,
    subtotal    DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venta_id)    REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE configuracion (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    nombre_empresa VARCHAR(80) NOT NULL,
    moneda         VARCHAR(5)  NOT NULL,
    simbolo        VARCHAR(3)  NOT NULL,
    impuesto       DECIMAL(5,2) NOT NULL,
    direccion      VARCHAR(120),
    telefono       VARCHAR(20)
);
```

### 2. Endpoints REST sugeridos

| Recurso        | Método | Ruta                                 |
| -------------- | ------ | ------------------------------------ |
| Login          | POST   | `/api/auth/login`                    |
| Recuperación   | POST   | `/api/auth/recuperar`                |
| Productos      | GET    | `/api/productos`                     |
|                | POST   | `/api/productos`                     |
|                | PUT    | `/api/productos/:id`                 |
|                | DELETE | `/api/productos/:id`                 |
| Clientes       | GET    | `/api/clientes`                      |
|                | POST/PUT/DELETE análogo a productos                |
| Usuarios       | GET    | `/api/usuarios`                      |
|                | POST/PUT/DELETE análogo                            |
| Ventas         | GET    | `/api/ventas?desde=&hasta=`          |
|                | POST   | `/api/ventas`                        |
| Métricas       | GET    | `/api/metricas`                      |
| Configuración  | GET    | `/api/configuracion`                 |
|                | PUT    | `/api/configuracion`                 |

### 3. Reemplazo de `js/db.js`

Cada función de `DB` está comentada con el SQL o endpoint que debería
ejecutar. Basta con sustituir el cuerpo por `fetch(...)`. Ejemplo:

```javascript
async function obtenerProductos(){
    const res = await fetch(`${API_URL}/productos`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
}
```

Las **firmas de las funciones no deben cambiar** para no romper el resto de
módulos. Todas ya devuelven `Promise`, por lo que la migración es
transparente para el resto del código.

### 4. Autenticación

- `js/auth.js` guarda hoy el usuario completo en `sessionStorage`.
- Cuando exista backend, el `login()` de `db.js` debe devolver un **JWT**
  y `auth.js` almacenarlo en `sessionStorage`. El resto de peticiones en
  `db.js` deben incluir el header `Authorization: Bearer <token>`.
- El backend valida el token en cada endpoint y aplica el control de rol
  (`admin`, `vendedor`, `almacen`).

### 5. Seguridad de contraseñas

- Nunca almacenar contraseñas en texto plano; hashear con bcrypt/argon2 en
  el backend antes del `INSERT`/`UPDATE`.
- Este prototipo guarda contraseñas en claro **solo** para simplicidad de
  demo. Los comentarios en `db.js` y `usuarios.js` señalan dónde hashear.

---

## Convenciones y estilo

- Idioma: español para código, comentarios y UI.
- Paleta de colores (definida en `css/estilos.css`):
  - Azul oscuro `#0F172A` (menú lateral)
  - Azul primario `#2563EB` / `#1D4ED8` hover
  - Azul login `#1E3A8A`
  - Verde éxito `#22C55E`
  - Amarillo advertencia `#F59E0B`
  - Rojo error `#EF4444`
  - Fondo `#f2f4f7`
- Toda la UI **sin emojis** por decisión del prototipo.
- Todos los comentarios que marcan el punto de integración con la base de
  datos usan el prefijo `BD:` para poder localizarlos fácilmente con búsqueda.

---

## Reset del prototipo

Los datos se guardan en `localStorage` bajo la clave `sistema_ventas_data_v1`.
Se pueden reiniciar de dos maneras:

1. Botón **"Restablecer datos de ejemplo"** en Configuración.
2. Manualmente desde la consola del navegador:

   ```javascript
   localStorage.removeItem('sistema_ventas_data_v1');
   sessionStorage.removeItem('sistema_ventas_sesion');
   location.reload();
   ```
