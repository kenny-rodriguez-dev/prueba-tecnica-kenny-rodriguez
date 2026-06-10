// ============================================================
// CAPA DE INTERFACES - Rutas de usuarios (CRUD)
// Admin crea activos | Gestor crea pendientes de aprobación
// ============================================================
const router = require('express').Router();
const userService = require('../../application/user.service');
const { authenticate, authorize } = require('../middlewares/auth');
const handle = require('./handle');

router.use(authenticate);

// GET /api/users?status=ACT&rolid=3
router.get('/', authorize('ADMINISTRADOR', 'GESTOR'), handle(req => userService.listar(req.query)));

// GET /api/users/pending  (usuarios pendientes de aprobación)
router.get('/pending', authorize('ADMINISTRADOR', 'GESTOR'), handle(req => userService.listar({ status: 'PEN' })));

// POST /api/users  { username, email, password, rol_rolid }
router.post('/', authorize('ADMINISTRADOR', 'GESTOR'), handle(req => userService.crear(req.user, req.body)));

// POST /api/users/bulk  { users: [...] }  (carga masiva desde Excel/CSV)
router.post('/bulk', authorize('ADMINISTRADOR'), handle(req => userService.crearMasivo(req.user, req.body.users)));

// PUT /api/users/:id/approve  (el admin aprueba usuarios creados por gestores)
router.put('/:id/approve', authorize('ADMINISTRADOR'), handle(req => userService.aprobar(req.user.userid, req.params.id)));

// PUT /api/users/:id  (actualizar campos y/o estado)
router.put('/:id', authorize('ADMINISTRADOR'), handle(req => userService.actualizar(req.params.id, req.body)));

// DELETE /api/users/:id  (eliminación lógica)
router.delete('/:id', authorize('ADMINISTRADOR'), handle(req => userService.eliminar(req.params.id)));

module.exports = router;
