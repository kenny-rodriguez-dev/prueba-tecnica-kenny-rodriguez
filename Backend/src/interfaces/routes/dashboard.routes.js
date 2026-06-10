// ============================================================
// CAPA DE INTERFACES - Rutas del dashboard (SOLO ADMINISTRADOR)
// ============================================================
const router = require('express').Router();
const dashboardService = require('../../application/dashboard.service');
const { authenticate, authorize } = require('../middlewares/auth');
const handle = require('./handle');

router.use(authenticate, authorize('ADMINISTRADOR'));

// GET /api/dashboard/users  -> indicadores de usuarios (sesión activa/inactiva, bloqueados...)
router.get('/users', handle(() => dashboardService.indicadoresUsuarios()));

// GET /api/dashboard/summary?from=2026-06-01&to=2026-06-10
// -> indicadores de cajas, cajeros y gestores con filtros de fecha
router.get('/summary', handle(req => dashboardService.resumen(req.query.from, req.query.to)));

module.exports = router;
