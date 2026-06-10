// ============================================================
// CAPA DE APLICACIÓN - Servicio de Dashboard (solo ADMINISTRADOR)
// Indicadores de usuarios y resumen de turnos por caja/cajero/gestor
// ============================================================
const { Op } = require('sequelize');
const { User, Turn, Cash } = require('../domain/models');

// Indicadores de usuarios: sesión activa/inactiva, bloqueados, por estado
async function indicadoresUsuarios() {
  const usuarios = await User.findAll({ where: { deleted: false }, attributes: ['userstatus_statusid', 'session_active'] });
  const r = {
    total: usuarios.length,
    sesionActiva: 0,
    sesionInactiva: 0,
    activos: 0,
    inactivos: 0,
    bloqueados: 0,
    pendientesAprobacion: 0
  };
  for (const u of usuarios) {
    if (u.session_active) r.sesionActiva++; else r.sesionInactiva++;
    if (u.userstatus_statusid === 'ACT') r.activos++;
    if (u.userstatus_statusid === 'INA') r.inactivos++;
    if (u.userstatus_statusid === 'BLO') r.bloqueados++;
    if (u.userstatus_statusid === 'PEN') r.pendientesAprobacion++;
  }
  return r;
}

// Agrupa una lista de turnos por una clave y cuenta total/atendidos
function agrupar(turnos, obtenerClave) {
  const mapa = {};
  for (const t of turnos) {
    const { clave, nombre } = obtenerClave(t);
    if (!mapa[clave]) mapa[clave] = { nombre, total: 0, atendidos: 0 };
    mapa[clave].total++;
    if (t.status === 'ATE') mapa[clave].atendidos++;
  }
  return Object.values(mapa);
}

// Resumen de cajas, cajeros y gestores con filtro de fechas (from / to)
async function resumen(from, to) {
  const inicio = from ? new Date(from + 'T00:00:00') : new Date(new Date().setHours(0, 0, 0, 0));
  const fin = to ? new Date(to + 'T23:59:59') : new Date(new Date().setHours(23, 59, 59, 999));

  const turnos = await Turn.findAll({
    where: { deleted: false, date: { [Op.between]: [inicio, fin] } },
    include: [
      { model: Cash },
      { model: User, as: 'cajero', attributes: ['userid', 'username'] },
      { model: User, as: 'gestor', attributes: ['userid', 'username'] }
    ]
  });

  return {
    desde: inicio,
    hasta: fin,
    totalTurnos: turnos.length,
    totalAtendidos: turnos.filter(t => t.status === 'ATE').length,
    porCaja: agrupar(turnos, t => ({ clave: t.cash_cashid, nombre: t.Cash ? t.Cash.cashdescription : 'Caja ' + t.cash_cashid })),
    porCajero: agrupar(turnos, t => ({ clave: t.cajero_userid, nombre: t.cajero ? t.cajero.username : 'Cajero ' + t.cajero_userid })),
    porGestor: agrupar(turnos, t => ({ clave: t.usergestorid, nombre: t.gestor ? t.gestor.username : 'Gestor ' + t.usergestorid }))
  };
}

module.exports = { indicadoresUsuarios, resumen };
