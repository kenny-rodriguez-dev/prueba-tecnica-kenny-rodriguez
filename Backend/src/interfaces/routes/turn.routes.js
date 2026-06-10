// ============================================================
// CAPA DE INTERFACES - Rutas de turnos (CRUD)
// Gestor asigna turnos | Cajero los atiende
// ============================================================
const router = require('express').Router();
const turnService = require('../../application/turn.service');
const { authenticate, authorize } = require('../middlewares/auth');
const handle = require('./handle');

router.use(authenticate);

// GET /api/turns?hoy=true&cajero_userid=3&status=PEN
router.get('/', handle(req => turnService.listar(req.query)));

// GET /api/turns/stats/today  (turnos atendidos hoy según el rol del usuario)
router.get('/stats/today', handle(req => turnService.estadisticasHoy(req.user)));

// POST /api/turns  { cash_cashid, cajero_userid, attentiontypeid }
// La descripción (AC0001, PS0001...) se genera automáticamente según el tipo de atención
router.post('/', authorize('GESTOR', 'ADMINISTRADOR'), handle(req => turnService.crear(req.user, req.body)));

// PUT /api/turns/:id/attend  { client_clientid? }  (el cajero atiende su turno)
router.put('/:id/attend', authorize('CAJERO'), handle(req => turnService.atender(req.user, req.params.id, req.body)));

// DELETE /api/turns/:id  (eliminación lógica)
router.delete('/:id', authorize('GESTOR', 'ADMINISTRADOR'), handle(req => turnService.eliminar(req.params.id)));

module.exports = router;
