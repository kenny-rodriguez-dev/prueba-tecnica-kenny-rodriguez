// ============================================================
// CAPA DE APLICACIÓN - Turnos y cajas
// Reglas de la prueba:
//  - Descripción del turno: 6 caracteres = 2 letras mayúsculas + 4 números
//  - La descripción se asigna según el tipo de atención (AC0001, PS0001, ...)
//  - Máximo 2 usuarios asignados por caja
//  - Los 2 usuarios no pueden usar la caja al mismo tiempo
// ============================================================
const { Op } = require('sequelize');
const { Turn, Cash, UserCash, User, Client, AttentionType } = require('../domain/models');

const DESC_RE = /^[A-Z]{2}\d{4}$/;

function rangoHoy() {
  const inicio = new Date(); inicio.setHours(0, 0, 0, 0);
  const fin = new Date(); fin.setHours(23, 59, 59, 999);
  return { inicio, fin };
}

const INCLUDES = [
  { model: Cash },
  { model: AttentionType },
  { model: Client },
  { model: User, as: 'gestor', attributes: ['userid', 'username'] },
  { model: User, as: 'cajero', attributes: ['userid', 'username'] }
];

async function listar(filtros = {}) {
  const where = { deleted: false };
  if (filtros.hoy === 'true' || filtros.hoy === true) {
    const { inicio, fin } = rangoHoy();
    where.date = { [Op.between]: [inicio, fin] };
  }
  if (filtros.cajero_userid) where.cajero_userid = filtros.cajero_userid;
  if (filtros.status) where.status = filtros.status;
  return Turn.findAll({ where, include: INCLUDES, order: [['turnid', 'DESC']] });
}

async function generarDescripcion(attentiontypeid) {
  let n = (await Turn.count({ where: { attentiontype_attentiontypeid: attentiontypeid } })) + 1;
  let descripcion = attentiontypeid + String(n).padStart(4, '0');
  // por si existen huecos por datos manuales
  while (await Turn.findOne({ where: { description: descripcion } })) {
    n++;
    descripcion = attentiontypeid + String(n).padStart(4, '0');
  }
  return descripcion;
}

async function crear(gestor, data) {
  const { cash_cashid, cajero_userid, attentiontypeid } = data;
  if (!cash_cashid || !cajero_userid || !attentiontypeid) {
    throw { status: 400, message: 'Caja, cajero y tipo de atención son obligatorios' };
  }

  const tipo = await AttentionType.findByPk(String(attentiontypeid).toUpperCase());
  if (!tipo) throw { status: 404, message: 'Tipo de atención no encontrado' };

  const caja = await Cash.findByPk(cash_cashid);
  if (!caja || caja.active !== 'S') throw { status: 404, message: 'Caja no encontrada o inactiva' };

  // El cajero debe estar asignado a esa caja
  const asignado = await UserCash.findOne({ where: { cash_cashid, user_userid: cajero_userid } });
  if (!asignado) throw { status: 400, message: 'El cajero seleccionado no está asignado a esa caja' };

  const descripcion = await generarDescripcion(tipo.attentiontypeid);
  if (!DESC_RE.test(descripcion)) {
    throw { status: 400, message: 'La descripción del turno no cumple el formato (2 letras mayúsculas + 4 números)' };
  }

  const turno = await Turn.create({
    description: descripcion,
    cash_cashid,
    cajero_userid,
    usergestorid: gestor.userid,
    attentiontype_attentiontypeid: tipo.attentiontypeid,
    client_clientid: data.client_clientid || null,
    status: 'PEN'
  });
  return Turn.findByPk(turno.turnid, { include: INCLUDES });
}

async function atender(cajero, turnid, data = {}) {
  const turno = await Turn.findOne({ where: { turnid, deleted: false } });
  if (!turno) throw { status: 404, message: 'Turno no encontrado' };
  if (turno.cajero_userid !== cajero.userid) {
    throw { status: 403, message: 'Solo el cajero asignado puede atender este turno' };
  }
  if (turno.status !== 'PEN') throw { status: 400, message: 'El turno ya fue atendido o cancelado' };

  // Regla: los 2 usuarios de una caja no pueden operar al mismo tiempo
  const caja = await Cash.findByPk(turno.cash_cashid);
  if (caja.inuse_userid && caja.inuse_userid !== cajero.userid) {
    throw { status: 409, message: 'La caja está siendo utilizada por otro usuario en este momento' };
  }
  caja.inuse_userid = cajero.userid;
  await caja.save();

  if (data.client_clientid) turno.client_clientid = data.client_clientid;
  turno.status = 'ATE';
  await turno.save();
  return Turn.findByPk(turno.turnid, { include: INCLUDES });
}

async function eliminar(turnid) {
  const turno = await Turn.findOne({ where: { turnid, deleted: false } });
  if (!turno) throw { status: 404, message: 'Turno no encontrado' };
  turno.deleted = true; // eliminación lógica
  turno.status = 'CAN';
  await turno.save();
  return { message: 'Turno cancelado (eliminación lógica) correctamente' };
}

// Turnos atendidos HOY según el rol:
//  - CAJERO: los que él atendió
//  - GESTOR: los que él asignó a los cajeros
//  - ADMINISTRADOR: el total
async function estadisticasHoy(usuario) {
  const { inicio, fin } = rangoHoy();
  const where = { deleted: false, status: 'ATE', date: { [Op.between]: [inicio, fin] } };
  if (usuario.rolname === 'CAJERO') where.cajero_userid = usuario.userid;
  if (usuario.rolname === 'GESTOR') where.usergestorid = usuario.userid;
  const total = await Turn.count({ where });
  return { rol: usuario.rolname, totalAtendidosHoy: total };
}

// ---------- Gestión de cajas ----------
async function listarCajas() {
  return Cash.findAll({ include: [{ model: User, attributes: ['userid', 'username'], through: { attributes: [] } }], order: [['cashid', 'ASC']] });
}

async function asignarCajero(cash_cashid, user_userid) {
  const caja = await Cash.findByPk(cash_cashid);
  if (!caja) throw { status: 404, message: 'Caja no encontrada' };
  const usuario = await User.findOne({ where: { userid: user_userid, deleted: false } });
  if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };

  const yaAsignado = await UserCash.findOne({ where: { cash_cashid, user_userid } });
  if (yaAsignado) throw { status: 409, message: 'El usuario ya está asignado a esta caja' };

  const total = await UserCash.count({ where: { cash_cashid } });
  if (total >= 2) throw { status: 400, message: 'La caja ya tiene el máximo de 2 usuarios asignados' };

  await UserCash.create({ cash_cashid, user_userid });
  return { message: 'Cajero asignado a la caja correctamente' };
}

async function abrirCaja(cash_cashid, userid) {
  const caja = await Cash.findByPk(cash_cashid);
  if (!caja) throw { status: 404, message: 'Caja no encontrada' };
  const asignado = await UserCash.findOne({ where: { cash_cashid, user_userid: userid } });
  if (!asignado) throw { status: 403, message: 'No está asignado a esta caja' };
  if (caja.inuse_userid && caja.inuse_userid !== userid) {
    throw { status: 409, message: 'La caja está siendo utilizada por otro usuario' };
  }
  caja.inuse_userid = userid;
  await caja.save();
  return { message: 'Caja abierta correctamente' };
}

async function cerrarCaja(cash_cashid, userid) {
  const caja = await Cash.findByPk(cash_cashid);
  if (!caja) throw { status: 404, message: 'Caja no encontrada' };
  if (caja.inuse_userid && caja.inuse_userid !== userid) {
    throw { status: 403, message: 'La caja está abierta por otro usuario' };
  }
  caja.inuse_userid = null;
  await caja.save();
  return { message: 'Caja cerrada correctamente' };
}

module.exports = { listar, crear, atender, eliminar, estadisticasHoy, listarCajas, asignarCajero, abrirCaja, cerrarCaja };
