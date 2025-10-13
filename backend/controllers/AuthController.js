const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const EmpleadoModel = require('../models/EmpleadoModel');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'sirds_jwt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email y password son requeridos' });
            }

            const empleado = await EmpleadoModel.findByEmail(email);
            if (!empleado) {
                return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }

            // Verificar contraseña
            if (!empleado.password) {
                return res.status(401).json({ success: false, message: 'Usuario no tiene contraseña configurada' });
            }

            const match = await bcrypt.compare(password, empleado.password);
            if (!match) {
                return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }

            const payload = {
                id_empleado: empleado.id_empleado,
                nombre: empleado.nombre,
                apellido: empleado.apellido,
                id_rol: empleado.id_rol
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            res.json({ success: true, data: { token }, message: 'Autenticación correcta' });
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ success: false, message: 'Error interno', error: error.message });
        }
    }

    static async me(req, res) {
        try {
            // authMiddleware ya adjunta req.user
            const user = req.user;
            res.json({ success: true, data: user });
        } catch (error) {
            console.error('Error en me:', error);
            res.status(500).json({ success: false, message: 'Error interno', error: error.message });
        }
    }
}

module.exports = AuthController;
