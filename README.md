# API REST - Catálogo de Productos y Favoritos Personales

API REST desarrollada con **Node.js**, **Express** y **PostgreSQL**, con autenticación basada en **JSON Web Tokens (JWT)**, control de acceso por roles (**RBAC**), gestión de favoritos personales con estricto aislamiento entre usuarios y persistencia de datos relacionales con consultas parametrizadas.

---

## 👥 Integrantes del Proyecto

- **Fernando Zavala** - *Desarrollador Backend / Base de Datos y Modelos*
- **Fernando Cataña** - *Desarrollador Backend / Autenticación, Seguridad y Pruebas*

---

## 🎯 Propósito del Proyecto

El objetivo es proveer una plataforma backend robusta, segura y escalable que permita:
1. Consultar un catálogo público de productos con opciones de filtrado por categoría y detalle individual.
2. Permitir el registro e inicio de sesión de usuarios normales y administradores mediante contraseñas cifradas con `bcrypt` y tokens JWT con tiempo de expiración.
3. Restringir la administración del catálogo (creación, edición y eliminación de productos) exclusivamente a usuarios con rol `admin`.
4. Permitir que cada usuario autenticado gestione su lista personal de favoritos (agregar, listar y quitar), garantizando que ningún usuario pueda ver ni modificar los favoritos de otro.
5. Asegurar la integridad referencial y persistencia de los datos en PostgreSQL ante reinicios del servidor.

---

## 🗄️ Elección de la Base de Datos

Se seleccionó **PostgreSQL** (utilizando el driver oficial `pg` con Connection Pooling y consultas estrictamente parametrizadas):

- **Integridad Referencial y Consistencia (ACID):** Se emplean claves foráneas con restricción `ON DELETE CASCADE` en la tabla de favoritos. Al eliminar un producto del catálogo, sus referencias en favoritos se eliminan automáticamente sin dejar registros huérfanos ni inconsistencias.
- **Prevención de Inyección SQL:** Todas las operaciones de lectura y escritura utilizan consultas preparadas y parametrizadas (`$1, $2, ...`), impidiendo cualquier intento de manipulación maliciosa de consultas.
- **Restricciones Nativas de Negocio:**
  - `precio NUMERIC(10, 2) CHECK (precio > 0)` para impedir productos con precios negativos o cero a nivel de motor.
  - `CONSTRAINT uq_usuario_producto UNIQUE (usuario_id, producto_id)` para impedir favoritos duplicados.
  - `correo VARCHAR(150) UNIQUE` para impedir cuentas duplicadas.
  - `rol CHECK (rol IN ('admin', 'usuario'))` para limitar los roles admitidos.
- **Rendimiento:** Creación de índices dedicados (`idx_productos_categoria`, `idx_favoritos_usuario`, `idx_favoritos_producto`) para consultas rápidas.

---

## 📋 Requisitos del Sistema

- **Node.js:** v18.0.0 o superior (probado en Node.js v24 LTS).
- **NPM:** v9.0.0 o superior.
- **PostgreSQL:** v14 o superior (instalado localmente o accesible por red).
- **Postman:** v10 o superior (para ejecutar las pruebas reproducibles).

---

## ⚙️ Instalación y Configuración

### 1. Clonar o descargar el repositorio
```bash
git clone https://github.com/fernandozavala199/Desarrollar-una-API-REST-con-Node.js-y-Express-que-gestione-un-cat-logo-de-productos-.git
cd Desarrollar-una-API-REST-con-Node.js-y-Express-que-gestione-un-cat-logo-de-productos-
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copiar el archivo de plantilla `.env.example` a `.env`:
```bash
cp .env.example .env
```

Editar `.env` con los valores correspondientes a su entorno local:
```ini
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos PostgreSQL
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password_postgres
DB_NAME=catalogo_db

# Seguridad JWT
JWT_SECRET=super_clave_secreta_jwt_para_firmar_tokens_catalogo_2026
JWT_EXPIRES_IN=2h

# Administrador Inicial (creado por el script de inicialización)
ADMIN_NAME=Administrador Inicial
ADMIN_EMAIL=admin@catalogo.com
ADMIN_PASSWORD=Admin1234!
```

> **Nota de Seguridad:** El archivo `.env` está excluido del control de versiones mediante `.gitignore` para no exponer credenciales ni secretos en el repositorio.

---

## 🚀 Inicialización de Datos y del Administrador

Ejecutar el script automatizado de inicialización:
```bash
npm run db:init
```

Este script realiza de forma idempotente:
1. Verifica si la base de datos `catalogo_db` existe; de no ser así, la crea automáticamente.
2. Aplica el esquema de tablas e índices (`database/schema.sql`).
3. Crea de forma segura el usuario **Administrador Inicial** leyendo las variables de entorno (`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`), aplicando un hash seguro con `bcryptjs` (salt 10 rounds). **El rol de administrador nunca puede asignarse desde el registro público de la API.**
4. Puebla la tabla de productos con 6 registros ficticios de prueba en diferentes categorías (`database/seed.sql`).

---

## ▶️ Comandos de Ejecución

- **Iniciar en producción:**
  ```bash
  npm start
  ```
- **Iniciar en desarrollo (con auto-recarga):**
  ```bash
  npm run dev
  ```
- **Ejecutar suite de pruebas automatizadas (29 casos):**
  ```bash
  npm test
  ```

---

## 🌐 Rutas de la API REST

Todas las rutas utilizan el prefijo `/api`.

| Método | Ruta | Acceso | Propósito | Código Exitoso | Códigos de Error Comunes |
|---|---|---|---|---|---|
| `POST` | `/api/auth/registro` | Público | Registrar un nuevo usuario normal (rol siempre `usuario`). | `201 Created` | `400` (campos vacíos), `409` (correo duplicado), `422` (email inválido) |
| `POST` | `/api/auth/login` | Público | Validar credenciales y emitir JWT con vencimiento. | `200 OK` | `400` (faltan datos), `401` (credenciales incorrectas) |
| `GET` | `/api/productos` | Público | Listar productos del catálogo (soporta `?categoria=nombre`). | `200 OK` | - |
| `GET` | `/api/productos/:id` | Público | Consultar un producto por su identificador. | `200 OK` | `400` (ID no numérico), `404` (no encontrado) |
| `POST` | `/api/productos` | Administrador | Crear un nuevo producto en el catálogo. | `201 Created` | `400` (campos vacíos), `401` (sin token), `403` (no admin), `422` (precio <= 0) |
| `PUT` | `/api/productos/:id` | Administrador | Actualizar la información de un producto. | `200 OK` | `400` (ID/campos inválidos), `401`, `403`, `404` (no existe), `422` |
| `DELETE` | `/api/productos/:id` | Administrador | Eliminar un producto del catálogo (limpia favoritos en cascada). | `200 OK` | `400` (ID inválido), `401`, `403`, `404` (no existe) |
| `GET` | `/api/favoritos` | Autenticado | Listar los favoritos del usuario autenticado (aislado). | `200 OK` | `401` (sin token o vencido) |
| `POST` | `/api/favoritos` | Autenticado | Agregar un producto a los favoritos del usuario autenticado. | `201 Created` | `400` (ID inválido), `401`, `404` (producto inexistente), `409` (duplicado) |
| `DELETE` | `/api/favoritos/:productoId` | Autenticado | Quitar un producto de los favoritos del usuario autenticado. | `200 OK` | `400` (ID inválido), `401`, `404` (no estaba en sus favoritos) |

---

## 📐 Criterio de Códigos de Estado HTTP

- **`200 OK`**: Petición procesada exitosamente (consultas `GET`, actualizaciones `PUT`, eliminaciones `DELETE` con confirmación).
- **`201 Created`**: Recurso creado exitosamente (registro de usuario, creación de producto, agregar a favoritos).
- **`400 Bad Request`**: Error de sintaxis en la petición, campos obligatorios ausentes en el JSON (`nombre`, `correo`, `password`, etc.), cuerpo vacío o identificador en ruta no entero.
- **`401 Unauthorized`**: Falta cabecera `Authorization`, token ausente, token vencido (`TokenExpiredError`), firma alterada o credenciales de inicio de sesión inválidas.
- **`403 Forbidden`**: Usuario autenticado con rol insuficiente (ej. usuario normal intentando crear, editar o borrar productos).
- **`404 Not Found`**: El recurso solicitado no existe (producto con ID inexistente, favorito no encontrado en la lista del usuario, o ruta desconocida).
- **`409 Conflict`**: Conflicto de unicidad con datos existentes (intento de registrar un correo que ya existe, o agregar a favoritos un producto que ya estaba guardado).
- **`422 Unprocessable Entity`**: El formato es sintácticamente válido pero no cumple las reglas semánticas del negocio (precio menor o igual a cero, formato de correo no válido, o contraseña menor a 6 caracteres).
- **`500 Internal Server Error`**: Error no controlado en el servidor; se devuelve un mensaje genérico sin filtrar contraseñas ni detalles internos.

---

## 🧪 Pruebas en Postman

El proyecto incluye una colección completa y un entorno listos para importar en Postman:

- Colección: [`postman/Catalogo_API.postman_collection.json`](./postman/Catalogo_API.postman_collection.json)
- Entorno: [`postman/Catalogo_API.postman_environment.json`](./postman/Catalogo_API.postman_environment.json)

### Pasos para ejecutar en Postman:
1. Abra Postman y haga clic en **Import**.
2. Seleccione ambos archivos JSON de la carpeta `postman/`.
3. Seleccione el entorno activo **"API Catálogo - Entorno Local"** en la esquina superior derecha.
4. Puede ejecutar peticiones individuales o usar el **Collection Runner** para ejecutar todos los tests de forma secuencial.
5. Las pruebas guardan dinámicamente los tokens (`adminToken`, `userAToken`, `userBToken`) y los IDs creados para encadenar las pruebas sin intervención manual.

### Casos Demostrados:
- Registro e inicio de sesión con roles `usuario` y `admin`.
- Rechazo de correos duplicados (`409`) y credenciales incorrectas (`401`).
- CRUD completo de productos por el administrador y visualización del catálogo público.
- Validación de precio estrictamente mayor a 0 (`422`) y rechazo de campos vacíos (`400`).
- Bloqueo sin token (`401`), con token vencido (`401`) y con rol normal intentando modificar catálogo (`403`).
- Agregar favoritos, rechazo de duplicados (`409`) y producto inexistente (`404`).
- **Prueba de aislamiento:** El Usuario B no puede ver los favoritos del Usuario A ni quitarlos. El favorito del Usuario A permanece intacto.
- **Persistencia:** Verificación de datos intactos tras reinicios del servidor.

---

## 📁 Estructura del Proyecto

```text
Entrega_Catalogo_Zavala_Cataña/
├── .env.example                        # Plantilla de variables de entorno sin credenciales
├── .gitignore                          # Exclusión de node_modules, .env, temporales
├── package.json                        # Definición del proyecto, scripts y dependencias
├── package-lock.json                   # Árbol exacto de versiones de dependencias
├── README.md                           # Documentación completa del proyecto
├── database/
│   ├── connection.js                   # Pool de conexión a PostgreSQL
│   ├── init-db.js                      # Script de inicialización automatizada de BD, admin y seed
│   ├── schema.sql                      # Esquema DDL de tablas e índices
│   └── seed.sql                        # Inserción de catálogo de prueba inicial (6 productos)
├── src/
│   ├── app.js                          # Configuración de Express, middlewares y rutas
│   ├── server.js                       # Punto de entrada HTTP y apagado controlado
│   ├── config/
│   │   └── env.js                      # Carga y validación de variables de entorno
│   ├── controllers/
│   │   ├── auth.controller.js          # Controladores de registro y login
│   │   ├── product.controller.js       # Controladores de CRUD de productos
│   │   └── favorite.controller.js      # Controladores de favoritos personales
│   ├── middlewares/
│   │   ├── auth.middleware.js          # Verificación de firma y expiración JWT
│   │   ├── role.middleware.js          # Autorización RBAC por rol
│   │   ├── validate.middleware.js      # Validaciones de esquemas (400 / 422)
│   │   └── error.middleware.js         # Manejo centralizado de 404 y errores 500
│   ├── models/
│   │   ├── user.model.js               # Acceso a datos de usuarios (SQL parametrizado)
│   │   ├── product.model.js            # Acceso a datos de productos (SQL parametrizado)
│   │   └── favorite.model.js           # Acceso a datos de favoritos (SQL parametrizado)
│   └── routes/
│       ├── auth.routes.js              # Rutas /api/auth
│       ├── product.routes.js           # Rutas /api/productos
│       ├── favorite.routes.js          # Rutas /api/favoritos
│       └── index.js                    # Router principal
├── postman/
│   ├── Catalogo_API.postman_collection.json   # Colección de pruebas con aserciones
│   └── Catalogo_API.postman_environment.json  # Variables de entorno para Postman
└── test/
    └── run-tests.js                    # Script ejecutor de pruebas automatizadas (npm test)
```
