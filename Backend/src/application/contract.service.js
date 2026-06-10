// ============================================================
// CAPA DE APLICACIÓN - Servicio de Contratos y Pagos
// Incluye la llamada a la FUNCIÓN de PostgreSQL fn_cambiar_servicio
// (requisito: usar al menos 1 Stored Procedure o Función)
// ============================================================
const { QueryTypes } = require('sequelize');
const { sequelize, Contract, Payment, Client, Service, StatusContract, MethodPayment } = require('../domain/models');

const INCLUDES = [
  { model: Service },
  { model: StatusContract },
  { model: Client },
  { model: MethodPayment }
];

async function listar(filtros = {}) {
  const where = { deleted: false };
  if (filtros.clientid) where.client_clientid = filtros.clientid;
  return Contract.findAll({ where, include: INCLUDES, order: [['contractid', 'DESC']] });
}

async function crear(data) {
  const { client_clientid, service_serviceid, methodpayment_methodpaymentid } = data;
  if (!client_clientid || !service_serviceid || !methodpayment_methodpaymentid) {
    throw { status: 400, message: 'client_clientid, service_serviceid y methodpayment_methodpaymentid son obligatorios' };
  }
  const cliente = await Client.findOne({ where: { clientid: client_clientid, deleted: false } });
  if (!cliente) throw { status: 404, message: 'Cliente no encontrado' };
  const servicio = await Service.findByPk(service_serviceid);
  if (!servicio) throw { status: 404, message: 'Servicio no encontrado' };

  // Duración del contrato: por defecto 12 meses
  const months = Number(data.months) || 12;
  const startdate = new Date();
  const enddate = new Date(startdate);
  enddate.setMonth(enddate.getMonth() + months);

  const nuevo = await Contract.create({
    startdate, enddate,
    service_serviceid,
    client_clientid,
    methodpayment_methodpaymentid,
    statuscontract_statusid: 'VIG'
  });
  return Contract.findByPk(nuevo.contractid, { include: INCLUDES });
}

// Cambio de servicio: usa la FUNCIÓN de PostgreSQL fn_cambiar_servicio.
// La función marca el contrato actual como SUS (sustituido) y crea un nuevo
// registro en estado REN (renovación) manteniendo la fecha fin original.
async function cambiarServicio(contractid, service_serviceid) {
  if (!service_serviceid) throw { status: 400, message: 'service_serviceid es obligatorio' };
  const servicio = await Service.findByPk(service_serviceid);
  if (!servicio) throw { status: 404, message: 'Servicio no encontrado' };
  try {
    const rows = await sequelize.query(
      'SELECT fn_cambiar_servicio(:cid, :sid) AS newid',
      { replacements: { cid: contractid, sid: service_serviceid }, type: QueryTypes.SELECT }
    );
    const newid = rows[0].newid;
    return Contract.findByPk(newid, { include: INCLUDES });
  } catch (e) {
    // Los RAISE EXCEPTION de la función llegan en e.parent.message
    throw { status: 400, message: (e.parent && e.parent.message) || 'No se pudo cambiar el servicio' };
  }
}

async function cambiarFormaPago(contractid, methodpayment_methodpaymentid) {
  if (!methodpayment_methodpaymentid) throw { status: 400, message: 'methodpayment_methodpaymentid es obligatorio' };
  const contrato = await Contract.findOne({ where: { contractid, deleted: false } });
  if (!contrato) throw { status: 404, message: 'Contrato no encontrado' };
  const metodo = await MethodPayment.findByPk(methodpayment_methodpaymentid);
  if (!metodo) throw { status: 404, message: 'Forma de pago no encontrada' };
  contrato.methodpayment_methodpaymentid = methodpayment_methodpaymentid;
  await contrato.save();
  return Contract.findByPk(contractid, { include: INCLUDES });
}

// Cancelación: actualiza el estado y la fecha fin (requisito del PDF)
async function cancelar(contractid) {
  const contrato = await Contract.findOne({ where: { contractid, deleted: false } });
  if (!contrato) throw { status: 404, message: 'Contrato no encontrado' };
  if (contrato.statuscontract_statusid === 'CAN') {
    throw { status: 400, message: 'El contrato ya está cancelado' };
  }
  contrato.statuscontract_statusid = 'CAN';
  contrato.enddate = new Date();
  await contrato.save();
  return Contract.findByPk(contractid, { include: INCLUDES });
}

async function eliminar(contractid) {
  const contrato = await Contract.findOne({ where: { contractid, deleted: false } });
  if (!contrato) throw { status: 404, message: 'Contrato no encontrado' };
  contrato.deleted = true; // eliminación lógica
  await contrato.save();
  return { message: 'Contrato eliminado (lógicamente) correctamente' };
}

// ---------- Pagos ----------
async function listarPagos(filtros = {}) {
  const where = {};
  if (filtros.clientid) where.client_clientid = filtros.clientid;
  return Payment.findAll({ where, include: [{ model: Client }, { model: Contract }], order: [['paymentid', 'DESC']] });
}

async function crearPago(data) {
  const { client_clientid, contract_contractid, amount } = data;
  if (!client_clientid || amount === undefined) {
    throw { status: 400, message: 'client_clientid y amount son obligatorios' };
  }
  if (Number(amount) <= 0) throw { status: 400, message: 'El monto debe ser mayor a 0' };
  const cliente = await Client.findOne({ where: { clientid: client_clientid, deleted: false } });
  if (!cliente) throw { status: 404, message: 'Cliente no encontrado' };
  if (contract_contractid) {
    const contrato = await Contract.findOne({ where: { contractid: contract_contractid, deleted: false } });
    if (!contrato) throw { status: 404, message: 'Contrato no encontrado' };
  }
  const pago = await Payment.create({ client_clientid, contract_contractid: contract_contractid || null, amount });
  return Payment.findByPk(pago.paymentid, { include: [{ model: Client }, { model: Contract }] });
}

module.exports = { listar, crear, cambiarServicio, cambiarFormaPago, cancelar, eliminar, listarPagos, crearPago };
