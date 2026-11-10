const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const env = require('../config/env');

const AuthController = {
    /**
     * POST /api/auth/registro
     * Acceso: Público. Registra un usuario con rol 'usuario' estricto.
     */
    async registro(req, res, next) {
        try {
            const { nombre, correo, password } = req.body;

            // 1. Verificar si el correo ya está en uso
            const yaExiste = await UserModel.existsByEmail(correo);
            if (yaExiste) {
                return res.status(409).json({
                    error: 'El correo electrónico ya se encuentra registrado. Por favor, use otro correo o inicie sesión.'
                });
            }

            // 2. Hashear la contraseña con salt seguro
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // 3. Crear usuario (rol siempre forzado a 'usuario')
            const nuevoUsuario = await UserModel.create({
                nombre,
                correo,
                passwordHash,
                rol: 'usuario'
            });

            // 4. Respuesta 201 (NUNCA devolver password ni hash)
            return res.status(201).json({
                mensaje: 'Usuario registrado exitosamente.',
                usuario: {
                    id: nuevoUsuario.id,
                    nombre: nuevoUsuario.nombre,
                    correo: nuevoUsuario.correo,
                    rol: nuevoUsuario.rol,
                    creado_en: nuevoUsuario.creado_en
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/auth/login
     * Acceso: Público. Valida credenciales y emite un JWT firmado.
     */
    async login(req, res, next) {
        try {
            const { correo, password } = req.body;

            // 1. Buscar usuario por correo
            const usuario = await UserModel.findByEmailWithPassword(correo);
            if (!usuario) {
                // Mensaje genérico para evitar enumeración de usuarios
                return res.status(401).json({
                    error: 'Credenciales inválidas: correo o contraseña incorrectos.'
                });
            }

            // 2. Comparar contraseña con el hash
            const match = await bcrypt.compare(password, usuario.password_hash);
            if (!match) {
                return res.status(401).json({
                    error: 'Credenciales inválidas: correo o contraseña incorrectos.'
                });
            }

            // 3. Generar token JWT con tiempo de expiración
            const payload = {
                id: usuario.id,
                correo: usuario.correo,
                rol: usuario.rol,
                nombre: usuario.nombre
            };

            const token = jwt.sign(payload, env.JWT.secret, {
                expiresIn: env.JWT.expiresIn
            });

            // 4. Respuesta 200 con token y datos públicos del usuario
            return res.status(200).json({
                mensaje: 'Inicio de sesión exitoso.',
                token,
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    correo: usuario.correo,
                    rol: usuario.rol
                }
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = AuthController;
