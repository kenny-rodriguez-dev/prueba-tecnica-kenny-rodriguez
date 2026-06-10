// ============================================================
// CAPA DE INTERFACES - Middlewares de autenticación y autorización
// ============================================================
const jwt = require('jsonwebtoken');

// Verifica el token JWT (header: Authorization: Bearer <token>)
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });
  try {
    // payload: { userid, username, rolid, rolname }
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'viamatica_secret_2026');
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

// Restringe el acceso por rol: authorize('ADMINISTRADOR', 'GESTOR')
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    if (!roles.includes(req.user.rolname)) {
      return res.status(403).json({ message: 'No tiene permisos para esta operación' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
