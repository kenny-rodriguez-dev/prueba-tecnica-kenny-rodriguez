// ============================================================
// CAPA DE APLICACIÓN - Clientes
// Reglas de la prueba:
//  - Identificación: 10 a 13 dígitos, solo números, única (se registra una sola vez)
//  - Dirección y referencia: 20 a 100 caracteres
//  - Teléfono: mínimo 10 dígitos, solo números, empieza con 09
//  - Eliminación lógica
// ============================================================
const { Client } = require('../domain/models');

const ID_RE = /^\d{10,13}$/;
const PHONE_RE = /^09\d{8,}$/; // empieza con 09 y mínimo 10 dígitos en total
const EMAIL_RE = /^\S+@\S+\.\S+$/;

function validarCliente(data, esCreacion) {
  if (esCreacion || data.identification !== undefined) {
    if (!data.identification || !ID_RE.test(String(data.identification))) {
      throw { status: 400, message: 'La identificación debe tener entre 10 y 13 dígitos y solo números' };
    }
  }
  if (esCreacion || data.name !== undefined) {
    if (!data.name || String(data.name).trim().length < 2) throw { status: 400, message: 'El nombre es obligatorio' };
  }
  if (esCreacion || data.lastname !== undefined) {
    if (!data.lastname || String(data.lastname).trim().length < 2) throw { status: 400, message: 'El apellido es obligatorio' };
  }
  if (esCreacion || data.email !== undefined) {
    if (!data.email || !EMAIL_RE.test(data.email)) throw { status: 400, message: 'El correo electrónico no es válido' };
  }
  if (esCreacion || data.phonenumber !== undefined) {
    if (!data.phonenumber || !PHONE_RE.test(String(data.phonenumber))) {
      throw { status: 400, message: 'El teléfono debe tener mínimo 10 dígitos, solo números y empezar con 09' };
    }
  }
  if (esCreacion || data.address !== undefined) {
    const len = data.address ? String(data.address).trim().length : 0;
    if (len < 20 || len > 100) throw { status: 400, message: 'La dirección debe tener entre 20 y 100 caracteres' };
  }
  if (esCreacion || data.referenceaddress !== undefined) {
    const len = data.referenceaddress ? String(data.referenceaddress).trim().length : 0;
    if (len < 20 || len > 100) throw { status: 400, message: 'La referencia de la dirección debe tener entre 20 y 100 caracteres' };
  }
}

async function listar(filtros = {}) {
  const where = { deleted: false };
  if (filtros.identification) where.identification = String(filtros.identification);
  return Client.findAll({ where, order: [['clientid', 'ASC']] });
}

async function buscarPorIdentificacion(identification) {
  const cliente = await Client.findOne({ where: { identification: String(identification), deleted: false } });
  if (!cliente) throw { status: 404, message: 'Cliente no encontrado con esa identificación' };
  return cliente;
}

async function crear(data) {
  validarCliente(data, true);
  const existe = await Client.findOne({ where: { identification: String(data.identification) } });
  if (existe) {
    throw { status: 409, message: 'El cliente ya se encuentra registrado con esa identificación' };
  }
  return Client.create({
    name: data.name,
    lastname: data.lastname,
    identification: String(data.identification),
    email: data.email,
    phonenumber: String(data.phonenumber),
    address: data.address,
    referenceaddress: data.referenceaddress
  });
}

async function crearMasivo(clientes) {
  if (!Array.isArray(clientes) || clientes.length === 0) {
    throw { status: 400, message: 'Debe enviar una lista de clientes' };
  }
  const creados = [];
  const errores = [];
  for (let i = 0; i < clientes.length; i++) {
    try {
      const c = await crear(clientes[i]);
      creados.push(c.identification);
    } catch (e) {
      errores.push({ fila: i + 1, identification: clientes[i] && clientes[i].identification, mensaje: e.message || 'Error desconocido' });
    }
  }
  return { totalCreados: creados.length, creados, totalErrores: errores.length, errores };
}

async function actualizar(clientid, data) {
  const cliente = await Client.findOne({ where: { clientid, deleted: false } });
  if (!cliente) throw { status: 404, message: 'Cliente no encontrado' };
  validarCliente(data, false);

  const campos = ['name', 'lastname', 'email', 'phonenumber', 'address', 'referenceaddress', 'status'];
  campos.forEach((c) => { if (data[c] !== undefined) cliente[c] = data[c]; });
  await cliente.save();
  return cliente;
}

async function eliminar(clientid) {
  const cliente = await Client.findOne({ where: { clientid, deleted: false } });
  if (!cliente) throw { status: 404, message: 'Cliente no encontrado' };
  cliente.deleted = true; // eliminación lógica
  cliente.status = 'INA';
  await cliente.save();
  return { message: 'Cliente eliminado (lógicamente) correctamente' };
}

module.exports = { listar, buscarPorIdentificacion, crear, crearMasivo, actualizar, eliminar };
