// ============================================================
// CAPA DE INTERFACES - Rutas de contratos y pagos (CRUD)
// Procesos de caja: contratar, pagar, cambio de servicio,
// cambio de forma de pago y cancelación
// ============================================================
const router = require('express').Router();
const contractService = require('../../application/contract.service');
const { authenticate, authorize } = require('../middlewares/auth');
const handle = require('./handle');

router.use(authenticate);
const cajeros = authorize('CAJERO', 'ADMINISTRADOR');

// ---------- Contratos ----------
// GET /api/contracts?clientid=1
router.get('/contracts', cajeros, handle(req => contractService.listar(req.query)));

// POST /api/contracts  { client_clientid, service_serviceid, methodpayment_methodpaymentid, months? }
router.post('/contracts', cajeros, handle(req => contractService.crear(req.body)));

// PUT /api/contracts/:id/change-service  { service_serviceid }
// Usa la FUNCIÓN PostgreSQL fn_cambiar_servicio: VIG -> SUS + nuevo registro REN con la misma fecha fin
router.put('/contracts/:id/change-service', cajeros, handle(req => contractService.cambiarServicio(req.params.id, req.body.service_serviceid)));

// PUT /api/contracts/:id/payment-method  { methodpayment_methodpaymentid }
router.put('/contracts/:id/payment-method', cajeros, handle(req => contractService.cambiarFormaPago(req.params.id, req.body.methodpayment_methodpaymentid)));

// PUT /api/contracts/:id/cancel  (actualiza estado y fecha fin)
router.put('/contracts/:id/cancel', cajeros, handle(req => contractService.cancelar(req.params.id)));

// DELETE /api/contracts/:id  (eliminación lógica)
router.delete('/contracts/:id', cajeros, handle(req => contractService.eliminar(req.params.id)));

// ---------- Pagos ----------
// GET /api/payments?clientid=1
router.get('/payments', cajeros, handle(req => contractService.listarPagos(req.query)));

// POST /api/payments  { client_clientid, contract_contractid?, amount }
router.post('/payments', cajeros, handle(req => contractService.crearPago(req.body)));

module.exports = router;
