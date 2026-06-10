// ============================================================
// CAPA DE INTERFACES - Rutas de catálogos y gestión de cajas
// ============================================================
const router = require('express').Router();
const { Rol, UserStatus, StatusContract, MethodPayment, AttentionType, Service } = require('../../domain/models');
const userService = require('../../application/user.service');
const turnService = require('../../application/turn.service');
const { authenticate, authorize } = require('../middlewares/auth');
const handle = require('./handle');

router.use(authenticate);

// Catálogos simples (para llenar selects en el frontend)
router.get('/roles', handle(() => Rol.findAll({ order: [['rolid', 'ASC']] })));
router.get('/userstatuses', handle(() => UserStatus.findAll()));
router.get('/statuscontracts', handle(() => StatusContract.findAll()));
router.get('/methodpayments', handle(() => MethodPayment.findAll({ order: [['methodpaymentid', 'ASC']] })));
router.get('/attentiontypes', handle(() => AttentionType.findAll()));
router.get('/services', handle(() => Service.findAll({ order: [['serviceid', 'ASC']] })));

// Lista de cajeros activos (para asignaciones)
router.get('/cajeros', handle(() => userService.listar({ rolid: 3, status: 'ACT' })));

// Cajas con sus usuarios asignados
router.get('/cashes', handle(() => turnService.listarCajas()));

// POST /api/catalogs/cashes/:id/assign  { user_userid }  (gestor asigna cajero, máx 2 por caja)
router.post('/cashes/:id/assign', authorize('GESTOR', 'ADMINISTRADOR'), handle(req => turnService.asignarCajero(req.params.id, req.body.user_userid)));

// POST /api/catalogs/cashes/:id/open | /close  (control: 2 usuarios no operan la caja a la vez)
router.post('/cashes/:id/open', authorize('CAJERO'), handle(req => turnService.abrirCaja(req.params.id, req.user.userid)));
router.post('/cashes/:id/close', authorize('CAJERO'), handle(req => turnService.cerrarCaja(req.params.id, req.user.userid)));

module.exports = router;
