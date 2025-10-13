const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'sirds_jwt_secret_key_2024';

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'Autorización requerida' });
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ success: false, message: 'Formato de token inválido' });
        }

        const token = parts[1];
        const payload = jwt.verify(token, JWT_SECRET);

        // Adjuntar payload al request
        req.user = payload;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }
};
