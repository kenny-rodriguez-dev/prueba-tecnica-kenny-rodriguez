// ============================================================
// CAPA DE INTERFACES - Ruta del menú dinámico
// EL MENÚ SE CARGA DESDE LA BASE DE DATOS SEGÚN EL ROL (requisito del PDF)
// ============================================================
const router = require('express').Router();
const { Menu, Rol } = require('../../domain/models');
const { authenticate } = require('../middlewares/auth');
const handle = require('./handle');

// GET /api/menu  -> opciones de menú del rol del usuario autenticado (según su JWT)
router.get('/', authenticate, handle(async (req) => {
  const menus = await Menu.findAll({
    include: [{ model: Rol, where: { rolid: req.user.rolid }, attributes: [], through: { attributes: [] } }],
    order: [['menuid', 'ASC']]
  });
  return menus;
}));

module.exports = router;
