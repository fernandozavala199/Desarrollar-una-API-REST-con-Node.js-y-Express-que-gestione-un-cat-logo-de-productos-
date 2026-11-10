const http = require('http');
const app = require('../src/app');
const env = require('../src/config/env');
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

function request(server, options, body = null) {
    return new Promise((resolve, reject) => {
        const address = server.address();
        const reqOptions = {
            hostname: '127.0.0.1',
            port: address.port,
            path: options.path,
            method: options.method,
            headers: options.headers || {}
        };

        if (body) {
            reqOptions.headers['Content-Type'] = 'application/json';
        }

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTestSuite() {
    console.log('========================================================================');
    console.log(' INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS - API REST CATÁLOGO & FAVORITOS');
    console.log('========================================================================\n');

    // Limpieza previa de usuarios de prueba para garantizar idempotencia en ejecuciones repetidas
    try {
        await query("DELETE FROM usuarios WHERE correo LIKE '%@prueba.com';");
    } catch (err) {
        // En caso de que aún no existan las tablas
    }

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

    const results = [];
    let passedCount = 0;
    let failedCount = 0;

    async function test(caseNumber, name, fn) {
        try {
            const res = await fn();
            results.push({ caseNumber, name, success: true, ...res });
            console.log(`[PASS] Caso ${caseNumber}: ${name} -> Status: ${res.obtainedStatus}`);
            passedCount++;
        } catch (error) {
            results.push({ caseNumber, name, success: false, error: error.message });
            console.error(`[FAIL] Caso ${caseNumber}: ${name} -> Error: ${error.message}`);
            failedCount++;
        }
    }

    let tokenAdmin = null;
    let tokenUserA = null;
    let tokenUserB = null;
    let createdProdId = null;
    const expiredToken = jwt.sign(
        { id: 999, correo: 'vencido@catalogo.com', rol: 'usuario' },
        env.JWT.secret,
        { expiresIn: '-10s' } // Ya expirado
    );

    // 1. Registro Usuario A
    await test('1', 'Registro exitoso de Usuario A (rol usuario)', async () => {
        const res = await request(server, { method: 'POST', path: '/api/auth/registro' }, {
            nombre: 'Fernando Zavala',
            correo: 'fernando.zavala@prueba.com',
            password: 'Password123!'
        });
        if (res.status !== 201) throw new Error(`Esperado 201, obtenido ${res.status}`);
        if (res.body.usuario.rol !== 'usuario') throw new Error(`Rol esperado 'usuario', obtenido ${res.body.usuario.rol}`);
        if (res.body.usuario.password || res.body.usuario.password_hash) throw new Error('Se filtró hash de contraseña');
        return { expectedStatus: 201, obtainedStatus: res.status, detail: 'Usuario creado con rol usuario sin filtrar contraseña' };
    });

    // 2. Rechazo de correo duplicado
    await test('2', 'Rechazo de registro con correo duplicado (409 Conflict)', async () => {
        const res = await request(server, { method: 'POST', path: '/api/auth/registro' }, {
            nombre: 'Fernando Duplicado',
            correo: 'fernando.zavala@prueba.com',
            password: 'OtraPassword123!'
        });
        if (res.status !== 409) throw new Error(`Esperado 409, obtenido ${res.status}`);
        return { expectedStatus: 409, obtainedStatus: res.status, detail: 'Rechazado con 409 Conflict' };
    });

    // 3. Validación de campos obligatorios
    await test('3', 'Rechazo de registro con campos vacíos (400 Bad Request)', async () => {
        const res = await request(server, { method: 'POST', path: '/api/auth/registro' }, {
            nombre: '',
            correo: 'incompleto@prueba.com',
            password: '123'
        });
        if (res.status !== 400) throw new Error(`Esperado 400, obtenido ${res.status}`);
        return { expectedStatus: 400, obtainedStatus: res.status, detail: 'Rechazado con 400 Bad Request' };
    });

    // 4. Registro Usuario B
    await test('4', 'Registro exitoso de Usuario B (para pruebas de aislamiento)', async () => {
        const res = await request(server, { method: 'POST', path: '/api/auth/registro' }, {
            nombre: 'Fernando Cataña',
            correo: 'fernando.catana@prueba.com',
            password: 'Password456!'
        });
        if (res.status !== 201) throw new Error(`Esperado 201, obtenido ${res.status}`);
        return { expectedStatus: 201, obtainedStatus: res.status, detail: 'Usuario B creado exitosamente' };
    });

    // 5. Login Usuario A
    await test('5', 'Inicio de sesión exitoso de Usuario A (emisión de JWT)', async () => {
        const res = await request(server, { method: 'POST', path: '/api/auth/login' }, {
            correo: 'fernando.zavala@prueba.com',
            password: 'Password123!'
        });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        if (!res.body.token) throw new Error('No se recibió token JWT');
        tokenUserA = res.body.token;
        return { expectedStatus: 200, obtainedStatus: res.status, detail: 'Token JWT emitido y verificado' };
    });

    // 6. Login Usuario B
    await test('6', 'Inicio de sesión exitoso de Usuario B', async () => {
        const res = await request(server, { method: 'POST', path: '/api/auth/login' }, {
            correo: 'fernando.catana@prueba.com',
            password: 'Password456!'
        });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        tokenUserB = res.body.token;
        return { expectedStatus: 200, obtainedStatus: res.status, detail: 'Token JWT para Usuario B emitido' };
    });

    // 7. Login Administrador
    await test('7', 'Inicio de sesión exitoso de Administrador (rol admin)', async () => {
        const res = await request(server, { method: 'POST', path: '/api/auth/login' }, {
            correo: env.ADMIN.email,
            password: env.ADMIN.password
        });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        if (res.body.usuario.rol !== 'admin') throw new Error(`Rol esperado 'admin', obtenido ${res.body.usuario.rol}`);
        tokenAdmin = res.body.token;
        return { expectedStatus: 200, obtainedStatus: res.status, detail: 'Admin autenticado correctamente' };
    });

    // 8. Login Credenciales Incorrectas
    await test('8', 'Rechazo de login con credenciales incorrectas (401 Unauthorized)', async () => {
        const res = await request(server, { method: 'POST', path: '/api/auth/login' }, {
            correo: env.ADMIN.email,
            password: 'ClaveTotalmenteErronea999!'
        });
        if (res.status !== 401) throw new Error(`Esperado 401, obtenido ${res.status}`);
        return { expectedStatus: 401, obtainedStatus: res.status, detail: 'Rechazado con 401 Unauthorized' };
    });

    // 9. Listar productos público
    await test('9', 'Consulta pública del catálogo sin token (al menos 5 productos)', async () => {
        const res = await request(server, { method: 'GET', path: '/api/productos' });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        if (!Array.isArray(res.body.productos) || res.body.productos.length < 5) {
            throw new Error(`Se esperaban al menos 5 productos, hay ${res.body.productos?.length}`);
        }
        return { expectedStatus: 200, obtainedStatus: res.status, detail: `Catálogo consultado: ${res.body.productos.length} productos disponibles` };
    });

    // 10. Filtrar por categoría
    await test('10', 'Filtrar catálogo por categoría pública (ej. Accesorios)', async () => {
        const res = await request(server, { method: 'GET', path: '/api/productos?categoria=Accesorios' });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        const todosAccesorios = res.body.productos.every(p => p.categoria.toLowerCase() === 'accesorios');
        if (!todosAccesorios) throw new Error('Un producto devuelto no coincide con el filtro');
        return { expectedStatus: 200, obtainedStatus: res.status, detail: 'Filtro por categoría aplicado correctamente' };
    });

    // 11. Consultar producto por ID
    await test('11', 'Consultar detalle de producto existente por ID', async () => {
        const res = await request(server, { method: 'GET', path: '/api/productos/1' });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        if (!res.body.producto || res.body.producto.precio <= 0) throw new Error('Precio debe ser > 0');
        return { expectedStatus: 200, obtainedStatus: res.status, detail: 'Detalle de producto obtenido con precio > 0' };
    });

    // 12. Consultar producto inexistente
    await test('12', 'Consulta de producto inexistente (404 Not Found)', async () => {
        const res = await request(server, { method: 'GET', path: '/api/productos/999999' });
        if (res.status !== 404) throw new Error(`Esperado 404, obtenido ${res.status}`);
        return { expectedStatus: 404, obtainedStatus: res.status, detail: 'Rechazado con 404 Not Found' };
    });

    // 13. Modificar catálogo sin token
    await test('13', 'Acceso a ruta protegida de catálogo sin token (401 Unauthorized)', async () => {
        const res = await request(server, { method: 'POST', path: '/api/productos' }, {
            nombre: 'Intento', descripcion: 'Desc', categoria: 'Cat', precio: 10
        });
        if (res.status !== 401) throw new Error(`Esperado 401, obtenido ${res.status}`);
        return { expectedStatus: 401, obtainedStatus: res.status, detail: 'Bloqueado con 401 sin token' };
    });

    // 14. Modificar catálogo con token vencido
    await test('14', 'Acceso a ruta protegida con token vencido (401 Unauthorized)', async () => {
        const res = await request(server, {
            method: 'POST',
            path: '/api/productos',
            headers: { 'Authorization': `Bearer ${expiredToken}` }
        }, {
            nombre: 'Intento', descripcion: 'Desc', categoria: 'Cat', precio: 10
        });
        if (res.status !== 401) throw new Error(`Esperado 401, obtenido ${res.status}`);
        return { expectedStatus: 401, obtainedStatus: res.status, detail: 'Bloqueado con 401 por expiración de token' };
    });

    // 15. Modificar catálogo con rol usuario
    await test('15', 'Modificación de catálogo con rol usuario normal (403 Forbidden)', async () => {
        const res = await request(server, {
            method: 'POST',
            path: '/api/productos',
            headers: { 'Authorization': `Bearer ${tokenUserA}` }
        }, {
            nombre: 'Hack', descripcion: 'Desc', categoria: 'Cat', precio: 10
        });
        if (res.status !== 403) throw new Error(`Esperado 403, obtenido ${res.status}`);
        return { expectedStatus: 403, obtainedStatus: res.status, detail: 'Bloqueado con 403 Forbidden por rol insuficiente' };
    });

    // 16. Rechazo de precio inválido (<= 0)
    await test('16', 'Creación de producto con precio <= 0 (422 Unprocessable Entity)', async () => {
        const res = await request(server, {
            method: 'POST',
            path: '/api/productos',
            headers: { 'Authorization': `Bearer ${tokenAdmin}` }
        }, {
            nombre: 'Producto Gratis', descripcion: 'Desc', categoria: 'Cat', precio: -5
        });
        if (res.status !== 422) throw new Error(`Esperado 422, obtenido ${res.status}`);
        return { expectedStatus: 422, obtainedStatus: res.status, detail: 'Rechazado con 422 Unprocessable Entity' };
    });

    // 17. CRUD: Crear producto como Admin
    await test('17', 'Crear nuevo producto en catálogo como Administrador (201 Created)', async () => {
        const res = await request(server, {
            method: 'POST',
            path: '/api/productos',
            headers: { 'Authorization': `Bearer ${tokenAdmin}` }
        }, {
            nombre: 'Silla Ergonómica Gamer',
            descripcion: 'Silla con soporte lumbar regulable y descansabrazos 4D',
            categoria: 'Muebles',
            precio: 289.50
        });
        if (res.status !== 201) throw new Error(`Esperado 201, obtenido ${res.status}`);
        createdProdId = res.body.producto.id;
        return { expectedStatus: 201, obtainedStatus: res.status, detail: `Producto creado con ID: ${createdProdId}` };
    });

    // 18. CRUD: Actualizar producto como Admin
    await test('18', 'Actualizar producto como Administrador (200 OK)', async () => {
        const res = await request(server, {
            method: 'PUT',
            path: `/api/productos/${createdProdId}`,
            headers: { 'Authorization': `Bearer ${tokenAdmin}` }
        }, {
            nombre: 'Silla Ergonómica Gamer Pro',
            descripcion: 'Versión Pro con respaldo reclinable 180 grados',
            categoria: 'Muebles',
            precio: 310.00
        });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        if (res.body.producto.precio !== 310.00) throw new Error('Precio no se actualizó');
        return { expectedStatus: 200, obtainedStatus: res.status, detail: 'Producto actualizado con nuevo precio y nombre' };
    });

    // 19. CRUD: Eliminar producto como Admin
    await test('19', 'Eliminar producto como Administrador (200 OK)', async () => {
        const res = await request(server, {
            method: 'DELETE',
            path: `/api/productos/${createdProdId}`,
            headers: { 'Authorization': `Bearer ${tokenAdmin}` }
        });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        return { expectedStatus: 200, obtainedStatus: res.status, detail: 'Producto eliminado exitosamente del catálogo' };
    });

    // 20. Favoritos: Agregar producto a favoritos (Usuario A)
    await test('20', 'Usuario A agrega producto 1 a sus favoritos (201 Created)', async () => {
        const res = await request(server, {
            method: 'POST',
            path: '/api/favoritos',
            headers: { 'Authorization': `Bearer ${tokenUserA}` }
        }, {
            productoId: 1
        });
        if (res.status !== 201) throw new Error(`Esperado 201, obtenido ${res.status}`);
        return { expectedStatus: 201, obtainedStatus: res.status, detail: 'Favorito agregado para Usuario A' };
    });

    // 21. Favoritos: Rechazo de favorito duplicado
    await test('21', 'Rechazo de favorito duplicado para Usuario A (409 Conflict)', async () => {
        const res = await request(server, {
            method: 'POST',
            path: '/api/favoritos',
            headers: { 'Authorization': `Bearer ${tokenUserA}` }
        }, {
            productoId: 1
        });
        if (res.status !== 409) throw new Error(`Esperado 409, obtenido ${res.status}`);
        return { expectedStatus: 409, obtainedStatus: res.status, detail: 'Rechazado con 409 Conflict ante duplicado' };
    });

    // 22. Favoritos: Rechazo de producto inexistente
    await test('22', 'Rechazo de favorito sobre producto inexistente (404 Not Found)', async () => {
        const res = await request(server, {
            method: 'POST',
            path: '/api/favoritos',
            headers: { 'Authorization': `Bearer ${tokenUserA}` }
        }, {
            productoId: 999999
        });
        if (res.status !== 404) throw new Error(`Esperado 404, obtenido ${res.status}`);
        return { expectedStatus: 404, obtainedStatus: res.status, detail: 'Rechazado con 404 Not Found' };
    });

    // 23. Favoritos: Listar favoritos de Usuario A
    await test('23', 'Usuario A lista sus favoritos (200 OK, contiene producto 1)', async () => {
        const res = await request(server, {
            method: 'GET',
            path: '/api/favoritos',
            headers: { 'Authorization': `Bearer ${tokenUserA}` }
        });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        const tieneP1 = res.body.favoritos.some(f => f.producto_id === 1);
        if (!tieneP1) throw new Error('Usuario A no tiene el producto 1 en favoritos');
        return { expectedStatus: 200, obtainedStatus: res.status, detail: 'Usuario A ve su lista con producto 1' };
    });

    // 24. Aislamiento: Usuario B no ve los favoritos de Usuario A
    await test('24', 'Aislamiento: Usuario B consulta sus favoritos y su lista está vacía', async () => {
        const res = await request(server, {
            method: 'GET',
            path: '/api/favoritos',
            headers: { 'Authorization': `Bearer ${tokenUserB}` }
        });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        if (res.body.total !== 0 || res.body.favoritos.length !== 0) {
            throw new Error('Aislamiento vulnerado: Usuario B está viendo favoritos de otro usuario');
        }
        return { expectedStatus: 200, obtainedStatus: res.status, detail: 'Usuario B solo ve sus propios favoritos (0 elementos)' };
    });

    // 25. Aislamiento: Usuario B no puede quitar el favorito de Usuario A
    await test('25', 'Aislamiento: Usuario B intenta quitar favorito de Usuario A (404 Not Found)', async () => {
        const res = await request(server, {
            method: 'DELETE',
            path: '/api/favoritos/1',
            headers: { 'Authorization': `Bearer ${tokenUserB}` }
        });
        if (res.status !== 404) throw new Error(`Esperado 404, obtenido ${res.status}`);
        return { expectedStatus: 404, obtainedStatus: res.status, detail: 'Usuario B no puede borrar el favorito de A; recibe 404' };
    });

    // 26. Aislamiento: Comprobar que el favorito de Usuario A permanece
    await test('26', 'Aislamiento: Verificar que el favorito de Usuario A permanece intacto', async () => {
        const res = await request(server, {
            method: 'GET',
            path: '/api/favoritos',
            headers: { 'Authorization': `Bearer ${tokenUserA}` }
        });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        const tieneP1 = res.body.favoritos.some(f => f.producto_id === 1);
        if (!tieneP1) throw new Error('El favorito de Usuario A desapareció tras intento de B');
        return { expectedStatus: 200, obtainedStatus: res.status, detail: 'El favorito de Usuario A se mantiene íntegro' };
    });

    // 27. Favoritos: Usuario A quita su favorito exitosamente
    await test('27', 'Usuario A elimina su favorito exitosamente (200 OK)', async () => {
        const res = await request(server, {
            method: 'DELETE',
            path: '/api/favoritos/1',
            headers: { 'Authorization': `Bearer ${tokenUserA}` }
        });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        return { expectedStatus: 200, obtainedStatus: res.status, detail: 'Favorito eliminado correctamente' };
    });

    // 28. Favoritos: Lista de Usuario A vacía
    await test('28', 'Verificar que la lista de favoritos de Usuario A quedó vacía', async () => {
        const res = await request(server, {
            method: 'GET',
            path: '/api/favoritos',
            headers: { 'Authorization': `Bearer ${tokenUserA}` }
        });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        if (res.body.total !== 0) throw new Error('La lista no está vacía');
        return { expectedStatus: 200, obtainedStatus: res.status, detail: 'Lista de favoritos vacía confirmada' };
    });

    // 29. Persistencia de registros
    await test('29', 'Persistencia de datos: Verificación de catálogo inicial íntegro en PostgreSQL', async () => {
        const res = await request(server, { method: 'GET', path: '/api/productos' });
        if (res.status !== 200) throw new Error(`Esperado 200, obtenido ${res.status}`);
        if (res.body.productos.length < 5) throw new Error('Pérdida de datos en catálogo');
        return { expectedStatus: 200, obtainedStatus: res.status, detail: `${res.body.productos.length} productos persisten en PostgreSQL` };
    });

    await new Promise(resolve => server.close(resolve));

    console.log('\n========================================================================');
    console.log(` RESULTADO FINAL DE LAS PRUEBAS: ${passedCount} PASADAS, ${failedCount} FALLIDAS`);
    console.log('========================================================================\n');

    return { results, passedCount, failedCount };
}

if (require.main === module) {
    runTestSuite()
        .then(({ failedCount }) => {
            process.exit(failedCount === 0 ? 0 : 1);
        })
        .catch(err => {
            console.error('Error fatal al ejecutar pruebas:', err);
            process.exit(1);
        });
}

module.exports = { runTestSuite };
