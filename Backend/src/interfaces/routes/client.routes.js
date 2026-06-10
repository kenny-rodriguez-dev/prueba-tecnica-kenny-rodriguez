// ============================================================
// CAPA DE INTERFACES - Rutas de clientes (CRUD)
// ============================================================
const router = require('express').Router();
const clientService = require('../../application/client.service');
const { authenticate, authorize } = require('../middlewares/auth');
const handle = require('./handle');

router.use(authenticate);

// GET /api/clients              -> lista todos
// GET /api/clients?identification=0912345678 -> búsqueda por identificación
router.get('/', authorize('CAJERO', 'ADMINISTRADOR'), handle(req =>
  req.query.identification
    ? clientService.buscarPorIdentificacion(req.query.identification)
    : clientService.listar(req.query)
));

// POST /api/clients
router.post('/', authorize('CAJERO', 'ADMINISTRADOR'), handle(req => clientService.crear(req.body)));

// POST /api/clients/bulk  { clients: [...] }  (carga masiva desde Excel/CSV)
router.post('/bulk', authorize('CAJERO', 'ADMINISTRADOR'), handle(req => clientService.crearMasivo(req.body.clients)));

// PUT /api/clients/:id
router.put('/:id', authorize('CAJERO', 'ADMINISTRADOR'), handle(req => clientService.actualizar(req.params.id, req.body)));

// DELETE /api/clients/:id  (eliminación lógica)
router.delete('/:id', authorize('CAJERO', 'ADMINISTRADOR'), handle(req => clientService.eliminar(req.params.id)));

module.exports = router;
