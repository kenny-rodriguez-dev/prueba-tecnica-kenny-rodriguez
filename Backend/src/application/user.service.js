// ============================================================
// CAPA DE APLICACIÓN - Usuarios
// Reglas de la prueba:
//  - Admin crea cajeros y gestores (quedan activos)
//  - Gestor crea cajeros y gestores (quedan PENDIENTES de aprobación)
//  - Username: 8-20 caracteres, letras y al menos un número, sin especiales, único
//  - Password: al menos un número, una mayúscula, 8-30 caracteres
//  - Eliminación lógica
// ============================================================
const bcrypt = require('bcryptjs');
const { User, Rol, UserStatus } = require('../domain/models');
const { PASS_RE } = require('./auth.service');

const USERNAME_RE = /^[A-Za-z0-9]{8,20}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const ROLES_PERMITIDOS = [2, 3]; // 2 = GESTOR, 3 = CAJERO

function validarDatosUsuario(data, esCreacion) {
  if (esCreacion || data.username !== undefined) {
    if (!data.username || !USERNAME_RE.test(data.username) || !/[A-Za-z]/.test(data.username) || !/\d/.test(data.username)) {
      throw { status: 400, message: 'El nombre de usuario debe tener entre 8 y 20 caracteres, contener letras y al menos un número, sin caracteres especiales' };
    }
  }
  if (esCreacion || data.password) {
    if (!data.password || !PASS_RE.test(data.password)) {
      throw { status: 400, message: 'La contraseña debe tener entre 8 y 30 caracteres, al menos un número y al menos una letra mayúscula' };
    }
  }
  if (esCreacion || data.email !== undefined) {
    if (!data.email || !EMAIL_RE.test(data.email)) {
      throw { status: 400, message: 'El correo electrónico no es válido' };
    }
  }
  if (esCreacion || data.rol_rolid !== undefined) {
    if (!ROLES_PERMITIDOS.includes(Number(data.rol_rolid))) {
      throw { status: 400, message: 'Solo se pueden crear usuarios con rol GESTOR o CAJERO' };
    }
  }
}

async function listar(filtros = {}) {
  const where = { deleted: false };
  if (filtros.status) where.userstatus_statusid = filtros.status;
  if (filtros.rolid) where.rol_rolid = filtros.rolid;
  return User.findAll({
    where,
    attributes: { exclude: ['password'] },
    include: [{ model: Rol }, { model: UserStatus }],
    order: [['userid', 'ASC']]
  });
}

async function crear(creador, data) {
  validarDatosUsuario(data, true);

  const duplicadoUsername = await User.findOne({ where: { username: data.username } });
  if (duplicadoUsername) throw { status: 409, message: 'El nombre de usuario ya está registrado' };
  const duplicadoEmail = await User.findOne({ where: { email: data.email } });
  if (duplicadoEmail) throw { status: 409, message: 'El correo ya está registrado' };

  const esAdmin = creador.rolname === 'ADMINISTRADOR';
  const nuevo = await User.create({
    username: data.username,
    email: data.email,
    password: bcrypt.hashSync(data.password, 10),
    rol_rolid: Number(data.rol_rolid),
    usercreate: creador.userid,
    userstatus_statusid: esAdmin ? 'ACT' : 'PEN', // creado por gestor => requiere aprobación
    userapproval: esAdmin ? creador.userid : null,
    dateapproval: esAdmin ? new Date() : null
  });

  const plano = nuevo.toJSON();
  delete plano.password;
  return plano;
}

async function crearMasivo(creador, usuarios) {
  if (!Array.isArray(usuarios) || usuarios.length === 0) {
    throw { status: 400, message: 'Debe enviar una lista de usuarios' };
  }
  const creados = [];
  const errores = [];
  for (let i = 0; i < usuarios.length; i++) {
    try {
      const u = await crear(creador, usuarios[i]);
      creados.push(u.username);
    } catch (e) {
      errores.push({ fila: i + 1, username: usuarios[i] && usuarios[i].username, mensaje: e.message || 'Error desconocido' });
    }
  }
  return { totalCreados: creados.length, creados, totalErrores: errores.length, errores };
}

async function aprobar(adminUserid, userid) {
  const user = await User.findOne({ where: { userid, deleted: false } });
  if (!user) throw { status: 404, message: 'Usuario no encontrado' };
  if (user.userstatus_statusid !== 'PEN') throw { status: 400, message: 'El usuario no está pendiente de aprobación' };
  user.userstatus_statusid = 'ACT';
  user.userapproval = adminUserid;
  user.dateapproval = new Date();
  await user.save();
  return { message: `Usuario ${user.username} aprobado correctamente` };
}

async function actualizar(userid, data) {
  const user = await User.findOne({ where: { userid, deleted: false } });
  if (!user) throw { status: 404, message: 'Usuario no encontrado' };

  validarDatosUsuario(data, false);

  if (data.email !== undefined) user.email = data.email;
  if (data.rol_rolid !== undefined) user.rol_rolid = Number(data.rol_rolid);
  if (data.userstatus_statusid !== undefined) {
    user.userstatus_statusid = data.userstatus_statusid;
    if (data.userstatus_statusid === 'ACT') user.failed_attempts = 0;
  }
  if (data.password) user.password = bcrypt.hashSync(data.password, 10);
  await user.save();

  const plano = user.toJSON();
  delete plano.password;
  return plano;
}

async function eliminar(userid) {
  const user = await User.findOne({ where: { userid, deleted: false } });
  if (!user) throw { status: 404, message: 'Usuario no encontrado' };
  user.deleted = true; // eliminación lógica
  user.userstatus_statusid = 'INA';
  user.session_active = false;
  await user.save();
  return { message: 'Usuario eliminado (lógicamente) correctamente' };
}

module.exports = { listar, crear, crearMasivo, aprobar, actualizar, eliminar };
