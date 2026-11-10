# Informe de Entrega: API REST Catálogo de Productos y Favoritos Personales

**Documento:** Entrega_Catalogo_Zavala_Catana.pdf  
**Fecha de Entrega:** 10 de Noviembre de 2026  
**Tecnologías:** Node.js, Express, PostgreSQL, JSON Web Tokens (JWT), Postman  

---

## 1. Datos Generales y Enlaces de Entrega

- **Integrantes:**
  1. **Fernando Zavala** (Estudiante 1)
  2. **Fernando Cataña** (Estudiante 2)
- **Enlace al Repositorio Público de GitHub:**  
  `https://github.com/fernandozavala199/Desarrollar-una-API-REST-con-Node.js-y-Express-que-gestione-un-cat-logo-de-productos-`
- **Enlace al Video Explicativo:**  
  `https://youtu.be/TU_VIDEO_EXPLICATIVO`  
  *(Enlace de YouTube como no listado o Google Drive con acceso de lectura público mediante enlace)*
- **Identificador del Commit Final:**  
  `3d1855c`

> **Verificación previa:** Se recomienda abrir tanto el enlace del repositorio como el del video en una **ventana privada de incógnito** antes de enviar la entrega para confirmar que ambos recursos cuentan con permisos de lectura pública.

---

## 2. Resumen de Aportes de Cada Integrante

### Aportes de Fernando Zavala
- **Diseño del Modelo de Datos:** Creación del esquema relacional DDL en PostgreSQL (`database/schema.sql`), definiendo tipos estrictos (`NUMERIC(10,2)` con restricción `CHECK (precio > 0)` para productos, `UNIQUE` para correos y combinaciones `usuario_id + producto_id`).
- **Integridad Referencial y Cascada:** Configuración de claves foráneas con `ON DELETE CASCADE` en la tabla `favoritos`, asegurando que al eliminar un producto se limpien de inmediato los favoritos huérfanos.
- **Acceso a Datos (Modelos SQL):** Implementación de `product.model.js` y `favorite.model.js` utilizando consultas 100% parametrizadas (`$1, $2, ...`) mediante el driver `pg` para evitar inyección SQL.
- **CRUD de Catálogo:** Desarrollo de los controladores `product.controller.js` para consulta pública, filtrado dinámico por categoría y operaciones exclusivas de administrador (`POST`, `PUT`, `DELETE`).
- **Gestión de Favoritos y Aislamiento:** Implementación de la lógica en `favorite.controller.js` donde la identidad del usuario se toma únicamente del token verificado (`req.user.id`), impidiendo accesos cruzados.
- **Documentación Técnica:** Redacción del archivo `README.md` con instrucciones de despliegue, arquitectura y tablas de rutas.

### Aportes de Fernando Cataña
- **Arquitectura Express y Modularización:** Configuración de la estructura en capas (rutas, controladores, middlewares y acceso a datos) en `src/app.js` y arranque con apagado controlado en `src/server.js`.
- **Autenticación Segura (JWT & Bcrypt):** Desarrollo del controlador de autenticación (`auth.controller.js`) y modelo de usuario (`user.model.js`). Cifrado de contraseñas con `bcryptjs` (salt 10 rounds) y emisión de JWT firmados con tiempo de expiración (`2h`).
- **Inicialización Idempotente:** Creación del script `database/init-db.js` que verifica/crea la base de datos, ejecuta el DDL, crea el usuario Administrador Inicial desde variables de entorno y siembra productos de prueba.
- **Middlewares de Seguridad y RBAC:** Implementación de `auth.middleware.js` para validación de firma y expiración de tokens (`401`), y `role.middleware.js` para control de roles (`403` para usuarios normales intentando alterar el catálogo).
- **Validaciones y Códigos HTTP:** Implementación de `validate.middleware.js` aplicando la distinción entre `400 Bad Request` (campos faltantes o tipos incorrectos) y `422 Unprocessable Entity` (violación semántica como precio <= 0 o email inválido).
- **Automatización de Pruebas y Postman:** Creación de la colección `postman/Catalogo_API.postman_collection.json`, entorno `postman/Catalogo_API.postman_environment.json` y la suite automatizada `test/run-tests.js` con 29 casos de prueba.

---

## 3. Tabla de Pruebas Reproducibles

A continuación se detalla la ejecución de los **29 casos de prueba**, demostrando el cumplimiento de cada una de las reglas de negocio, códigos de estado HTTP y aislamiento:

| # | Caso de Prueba | Método y Ruta | Roles / Cabeceras | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|---|
| **1** | Registro de Usuario A | `POST /api/auth/registro` | Público | `201 Created`. Crea usuario con rol `usuario`. No retorna contraseña ni hash. | `201 Created`. Usuario creado con `rol: "usuario"`, sin exponer datos sensibles. | **PASÓ** |
| **2** | Rechazo de correo duplicado | `POST /api/auth/registro` | Público | `409 Conflict`. Mensaje claro de error. | `409 Conflict`. "El correo electrónico ya se encuentra registrado." | **PASÓ** |
| **3** | Rechazo por campos obligatorios vacíos | `POST /api/auth/registro` | Público | `400 Bad Request`. Indicar campo faltante. | `400 Bad Request`. "El campo 'nombre' es obligatorio y no puede estar vacío." | **PASÓ** |
| **4** | Registro de Usuario B (para aislamiento) | `POST /api/auth/registro` | Público | `201 Created`. Rol `usuario`. | `201 Created`. Usuario B registrado exitosamente. | **PASÓ** |
| **5** | Login exitoso de Usuario A | `POST /api/auth/login` | Público | `200 OK`. Devuelve token JWT firmado y datos públicos. | `200 OK`. Token JWT emitido y capturado dinámicamente. | **PASÓ** |
| **6** | Login exitoso de Usuario B | `POST /api/auth/login` | Público | `200 OK`. Devuelve token JWT de Usuario B. | `200 OK`. Token JWT de Usuario B emitido y capturado. | **PASÓ** |
| **7** | Login exitoso de Administrador | `POST /api/auth/login` | Público | `200 OK`. Token con payload `rol: "admin"`. | `200 OK`. Administrador autenticado con rol verificado `admin`. | **PASÓ** |
| **8** | Login con credenciales incorrectas | `POST /api/auth/login` | Público | `401 Unauthorized`. Rechazo sin enumeración de usuarios. | `401 Unauthorized`. "Credenciales inválidas: correo o contraseña incorrectos." | **PASÓ** |
| **9** | Consulta pública de catálogo | `GET /api/productos` | Público (Sin token) | `200 OK`. Lista de productos con al menos 5 registros. | `200 OK`. 6 productos ficticios devueltos en el catálogo. | **PASÓ** |
| **10** | Filtro de catálogo por categoría | `GET /api/productos?categoria=Accesorios` | Público | `200 OK`. Solo productos de la categoría solicitada. | `200 OK`. Todos los productos pertenecen a 'Accesorios'. | **PASÓ** |
| **11** | Consulta de producto por ID | `GET /api/productos/1` | Público | `200 OK`. Detalle del producto con precio > 0. | `200 OK`. Producto retornado con precio positivo. | **PASÓ** |
| **12** | Consulta de producto inexistente | `GET /api/productos/999999` | Público | `404 Not Found`. Mensaje claro de no existencia. | `404 Not Found`. "El producto con ID 999999 no existe en el catálogo." | **PASÓ** |
| **13** | Modificar catálogo sin token | `POST /api/productos` | Sin cabecera `Authorization` | `401 Unauthorized`. Bloqueo por falta de autenticación. | `401 Unauthorized`. "Acceso no autorizado: no se proporcionó el token." | **PASÓ** |
| **14** | Modificar catálogo con token vencido | `POST /api/productos` | `Authorization: Bearer <vencido>` | `401 Unauthorized`. Detecta expiración del JWT. | `401 Unauthorized`. "El token de autenticación ha expirado." | **PASÓ** |
| **15** | Modificar catálogo con rol usuario normal | `POST /api/productos` | `Authorization: Bearer <tokenUserA>` | `403 Forbidden`. Rechazo por falta de privilegios de admin. | `403 Forbidden`. "Acceso prohibido: se requiere rol 'admin'. Tu rol actual es 'usuario'." | **PASÓ** |
| **16** | Rechazo de precio inválido (<= 0) | `POST /api/productos` | Admin | `422 Unprocessable Entity`. Regla de negocio: precio > 0. | `422 Unprocessable Entity`. "El precio del producto debe ser estrictamente mayor que cero." | **PASÓ** |
| **17** | CRUD Admin: Crear producto | `POST /api/productos` | Admin | `201 Created`. Retorna producto creado con su nuevo ID. | `201 Created`. Producto creado con ID asignado. | **PASÓ** |
| **18** | CRUD Admin: Actualizar producto | `PUT /api/productos/:id` | Admin | `200 OK`. Retorna producto con datos modificados. | `200 OK`. Nombre y precio actualizados en base de datos. | **PASÓ** |
| **19** | CRUD Admin: Eliminar producto | `DELETE /api/productos/:id` | Admin | `200 OK`. Producto eliminado del catálogo. | `200 OK`. Confirmación de eliminación exitosa. | **PASÓ** |
| **20** | Agregar a favoritos (Usuario A) | `POST /api/favoritos` | Usuario A | `201 Created`. Asocia producto 1 a Usuario A. | `201 Created`. Favorito registrado para Usuario A. | **PASÓ** |
| **21** | Rechazo de favorito duplicado | `POST /api/favoritos` | Usuario A | `409 Conflict`. Impide duplicar el mismo favorito. | `409 Conflict`. "El producto ya se encuentra en tu lista de favoritos." | **PASÓ** |
| **22** | Favorito sobre producto inexistente | `POST /api/favoritos` | Usuario A | `404 Not Found`. Rechaza referencia inválida. | `404 Not Found`. "El producto con ID 999999 no existe en el catálogo." | **PASÓ** |
| **23** | Listar favoritos de Usuario A | `GET /api/favoritos` | Usuario A | `200 OK`. Muestra lista personal con producto 1. | `200 OK`. Usuario A visualiza su favorito con detalle del producto. | **PASÓ** |
| **24** | **Aislamiento: Usuario B no ve favoritos de A** | `GET /api/favoritos` | Usuario B | `200 OK`. Lista de favoritos vacía (`total: 0`). | `200 OK`. Usuario B tiene 0 favoritos. Aislamiento verificado. | **PASÓ** |
| **25** | **Aislamiento: Usuario B intenta borrar favorito de A** | `DELETE /api/favoritos/1` | Usuario B | `404 Not Found`. B no puede eliminar un favorito ajeno. | `404 Not Found`. "El producto con ID 1 no se encuentra en tu lista de favoritos." | **PASÓ** |
| **26** | **Aislamiento: Comprobar que el favorito de A permanece** | `GET /api/favoritos` | Usuario A | `200 OK`. El producto 1 sigue presente en los favoritos de A. | `200 OK`. El favorito de Usuario A permanece intacto e inalterado. | **PASÓ** |
| **27** | Eliminar favorito por Usuario A | `DELETE /api/favoritos/1` | Usuario A | `200 OK`. Quita producto 1 de sus propios favoritos. | `200 OK`. "El producto con ID 1 fue eliminado exitosamente de tus favoritos." | **PASÓ** |
| **28** | Verificar lista de Usuario A vacía | `GET /api/favoritos` | Usuario A | `200 OK`. Lista personal queda con `total: 0`. | `200 OK`. Lista de favoritos vacía confirmada. | **PASÓ** |
| **29** | **Persistencia tras reinicio de Node.js** | `GET /api/productos` | Público | `200 OK`. Todos los registros de la base de datos persisten intactos. | `200 OK`. Catálogo íntegro verificado directamente en PostgreSQL. | **PASÓ** |

---

## 4. Guión para la Grabación del Video Explicativo (10 - 15 minutos)

Para cumplir con la pauta y rúbrica de evaluación, se recomienda estructurar la grabación en los siguientes bloques:

### Bloque 1: Presentación y Visión General (0:00 - 2:30)
- **Cámara y pantalla activa:** Ambos integrantes (Fernando Zavala y Fernando Cataña) se presentan con nombre y apellido.
- **Propósito:** Explicar el objetivo de la API REST de catálogo y favoritos con autenticación JWT, RBAC y persistencia en PostgreSQL.
- **Estructura del Proyecto:** Breve recorrido visual por las carpetas (`database`, `src/controllers`, `src/middlewares`, `src/models`, `src/routes`, `postman`, `test`).
- **Resumen de Aportes:** Cada estudiante menciona brevemente sus módulos desarrollados.

### Bloque 2: Explicación Técnica de Fragmentos de Código (2:30 - 6:00)
- **Fernando Zavala:**
  - Explica una operación CRUD en `src/controllers/product.controller.js` y el modelo correspondiente en `src/models/product.model.js`.
  - Muestra el uso de consultas SQL parametrizadas (`$1, $2, ...`) para prevenir inyecciones SQL.
  - Explica cómo la clave foránea `ON DELETE CASCADE` en `database/schema.sql` asegura que al borrar un producto, sus favoritos se eliminen automáticamente.
- **Fernando Cataña:**
  - Explica la emisión y verificación del JWT en `src/middlewares/auth.middleware.js` (comprobación de firma y expiración con respuesta `401`).
  - Explica el control de roles en `src/middlewares/role.middleware.js` (bloqueo `403` a usuarios normales en rutas administrativas).
  - Explica cómo se garantiza el aislamiento en `src/controllers/favorite.controller.js`, obteniendo el `usuario_id` directamente del payload del token y nunca del body del cliente.

### Bloque 3: Seguimiento de una Petición de Extremo a Extremo (6:00 - 8:30)
- Enviar una petición desde Postman (por ejemplo `POST /api/favoritos` o `POST /api/auth/login`).
- Seguir el flujo en vivo mostrando el código:
  1. La petición entra a Express por `src/routes/favorite.routes.js`.
  2. Pasa por el middleware `authenticateToken`, el cual decodifica el JWT e inyecta `req.user`.
  3. Pasa por `validateFavoritoBody` comprobando que `productoId` sea un entero positivo.
  4. Entra al controlador `FavoriteController.add`, valida que el producto exista en catálogo y que no esté duplicado.
  5. Llama a `FavoriteModel.add` ejecutando la sentencia SQL parametrizada en PostgreSQL.
  6. Retorna la respuesta JSON con código `201 Created` y los datos asociados.

### Bloque 4: Demostración de las Pruebas en Postman (8:30 - 12:30)
- Abrir Postman y seleccionar el entorno **API Catálogo - Entorno Local**.
- Ejecutar el Collection Runner o las peticiones clave:
  1. **Flujo exitoso:** Registro y login de Usuario A, Usuario B y Administrador.
  2. **Errores de validación:** Registro con campos vacíos (`400`) y creación de producto con precio 0 (`422`).
  3. **Rechazo por permisos:** Intentar crear un producto con el token de Usuario A (`403 Forbidden`) y con token vencido (`401 Unauthorized`).
  4. **Aislamiento entre usuarios:**
     - Usuario A agrega el producto 1 a favoritos.
     - Usuario B consulta sus favoritos: la lista está vacía (`total: 0`).
     - Usuario B intenta borrar el favorito del producto 1: recibe `404 Not Found`.
     - Usuario A vuelve a consultar y su favorito sigue existiendo intacto.
  5. **Persistencia tras reinicio:** Reiniciar la consola de Node.js (`Ctrl+C` y `npm start`) y volver a consultar `GET /api/productos` para evidenciar que los datos continúan presentes.

### Bloque 5: Dificultad Encontrada, Solución y Conclusiones (12:30 - 14:30)
- **Dificultad:** Manejo de la concurrencia y restricciones de aislamiento al evitar que un usuario manipule favoritos ajenos, así como el aseguramiento de la integridad referencial cuando un producto con favoritos es eliminado.
- **Solución:** Se implementó una clave compuesta `UNIQUE (usuario_id, producto_id)` con `ON DELETE CASCADE` en la base de datos, y en la capa de aplicación se forzó la lectura del ID desde el token JWT verificado en lugar de aceptar parámetros externos manipulables por el cliente.
- **Ejecución desde el repositorio:** Demostrar brevemente que clonando el repositorio, configurando `.env` y ejecutando `npm install`, `npm run db:init` y `npm start`, el proyecto levanta de manera inmediata y reproducible.

---

## 5. Conclusión y Checklist de Entrega

- [x] Repositorio público de GitHub con historial de commits identificables de ambos integrantes.
- [x] Variables de entorno sin credenciales reales en `.env.example`.
- [x] Esquema DDL en PostgreSQL y script de inicialización idempotente (`database/init-db.js`).
- [x] Autenticación JWT y control de acceso RBAC implementados y verificados.
- [x] Colección y entorno de Postman con aserciones automatizadas de códigos HTTP y respuestas.
- [x] Suite de pruebas automatizadas en Node.js (`npm test`) pasando al 100% (29/29).
- [x] Aislamiento de favoritos entre usuarios y persistencia ante reinicio demostrados.
- [x] Archivo PDF de entrega idéntico para ambos integrantes (`Entrega_Catalogo_Zavala_Catana.pdf`).
