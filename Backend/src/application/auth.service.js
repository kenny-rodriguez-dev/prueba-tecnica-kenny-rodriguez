// ============================================================
// CAPA DE APLICACIÓN - Autenticación
// ============================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Rol } = require('../domain/models');

const PASS_RE = /^(?=.*\d)(?=.*[A-Z]).{8,30}$/;
const MAX_ATTEMPTS = 3;

async function login(loginValue, password) {
  if (!loginValue || !password) {
    throw { status: 400, message: 'Usuario y contraseña son obligatorios' };
  }

  const user = await User.findOne({
    where: { [Op.or]: [{ username: loginValue }, { email: loginValue }], deleted: false },
    include: [{ model: Rol }]
  });

  if (!user) throw { status: 401, message: 'Credenciales inválidas' };
  if (user.userstatus_statusid === 'PEN') throw { status: 401, message: 'Usuario pendiente de aprobación por un administrador' };
  if (user.userstatus_statusid === 'BLO') throw { status: 401, message: 'Usuario bloqueado por intentos fallidos. Contacte al administrador' };
  if (user.userstatus_statusid === 'INA') throw { status: 401, message: 'Usuario inactivo' };

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) {
    user.failed_attempts = (user.failed_attempts || 0) + 1;
    if (user.failed_attempts >= MAX_ATTEMPTS) user.userstatus_statusid = 'BLO';
    await user.save();
    const restantes = Math.max(0, MAX_ATTEMPTS - user.failed_attempts);
    throw {
      status: 401,
      message: user.userstatus_statusid === 'BLO'
        ? 'Usuario bloqueado por superar los intentos permitidos'
        : `Credenciales inválidas. Intentos restantes: ${restantes}`
    };
  }

  user.failed_attempts = 0;
  user.session_active = true;
  await user.save();

  const payload = {
    userid: user.userid,
    username: user.username,
    rolid: user.rol_rolid,
    rolname: user.Rol ? user.Rol.rolname : ''
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'viamatica_secret_2026', {
    expiresIn: process.env.JWT_EXPIRES || '8h'
  });

  return {
    token,
    user: { userid: user.userid, username: user.username, email: user.email, rolid: user.rol_rolid, rolname: payload.rolname }
  };
}

async function logout(userid) {
  const user = await User.findByPk(userid);
  if (user) {
    user.session_active = false;
    await user.save();
  }
  return { message: 'Sesión cerrada correctamente' };
}

// Recuperación simple de contraseña (en producción se enviaría un correo con token)
async function recover(email, newPassword) {
  if (!email || !newPassword) throw { status: 400, message: 'Correo y nueva contraseña son obligatorios' };
  if (!PASS_RE.test(newPassword)) {
    throw { status: 400, message: 'La contraseña debe tener entre 8 y 30 caracteres, al menos un número y una letra mayúscula' };
  }
  const user = await User.findOne({ where: { email, deleted: false } });
  if (user) {
    user.password = bcrypt.hashSync(newPassword, 10);
    user.failed_attempts = 0;
    if (user.userstatus_statusid === 'BLO') user.userstatus_statusid = 'ACT';
    await user.save();
  }
  // Respuesta genérica para no revelar si el correo existe o no
  return { message: 'Si el correo está registrado, la contraseña fue restablecida' };
}

module.exports = { login, logout, recover, PASS_RE };
