const jwt = require('jsonwebtoken');
require('dotenv').config();

const hasRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No se proporcionó token de autenticación'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // Si no se requieren roles específicos, permitir acceso
      if (!requiredRoles || requiredRoles.length === 0) {
        return next();
      }

      // Verificar si el usuario tiene al menos uno de los roles requeridos
      const hasRequiredRole = requiredRoles.some(role => 
        decoded.roles && decoded.roles.includes(role)
      );

      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: 'No tiene los permisos necesarios para realizar esta acción'
        });
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  };
};

module.exports = {
  hasRole
};