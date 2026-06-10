// ============================================================
// CAPA DE INFRAESTRUCTURA - Semillas (datos iniciales) y
// creación de la FUNCIÓN de PostgreSQL fn_cambiar_servicio
// ============================================================
const bcrypt = require('bcryptjs');
const {
  sequelize, Rol, UserStatus, StatusContract, MethodPayment, AttentionType,
  User, Cash, UserCash, Service, Menu, RolMenu
} = require('../domain/models');

// La misma función está en Backend/sql/funciones.sql (script entregable).
// Aquí se crea automáticamente al arrancar para que todo funcione sin pasos manuales.
const FN_CAMBIAR_SERVICIO = `
CREATE OR REPLACE FUNCTION fn_cambiar_servicio(p_contractid INTEGER, p_new_serviceid INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_old contract%ROWTYPE;
  v_new_id INTEGER;
BEGIN
  SELECT * INTO v_old FROM contract WHERE contractid = p_contractid AND deleted = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato % no existe o fue eliminado', p_contractid;
  END IF;
  IF v_old.statuscontract_statusid <> 'VIG' THEN
    RAISE EXCEPTION 'Solo se puede cambiar el servicio de un contrato VIGENTE';
  END IF;

  -- 1) El contrato actual pasa a SUSTITUIDO
  UPDATE contract SET statuscontract_statusid = 'SUS' WHERE contractid = p_contractid;

  -- 2) Se crea un nuevo registro en estado RENOVACIÓN manteniendo la fecha fin
  INSERT INTO contract (startdate, enddate, service_serviceid, statuscontract_statusid,
                        client_clientid, methodpayment_methodpaymentid, deleted)
  VALUES (NOW(), v_old.enddate, p_new_serviceid, 'REN',
          v_old.client_clientid, v_old.methodpayment_methodpaymentid, false)
  RETURNING contractid INTO v_new_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;
`;

async function seed() {
  // La función SQL se (re)crea siempre: es idempotente
  await sequelize.query(FN_CAMBIAR_SERVICIO);

  // Los datos solo se insertan si la base está vacía
  const total = await Rol.count();
  if (total > 0) return;

  console.log('>> Insertando datos iniciales (seed)...');

  await Rol.bulkCreate([
    { rolid: 1, rolname: 'ADMINISTRADOR' },
    { rolid: 2, rolname: 'GESTOR' },
    { rolid: 3, rolname: 'CAJERO' }
  ]);

  await UserStatus.bulkCreate([
    { statusid: 'ACT', description: 'Activo' },
    { statusid: 'INA', description: 'Inactivo' },
    { statusid: 'BLO', description: 'Bloqueado' },
    { statusid: 'PEN', description: 'Pendiente de aprobación' }
  ]);

  await StatusContract.bulkCreate([
    { statusid: 'VIG', description: 'Contrato vigente' },
    { statusid: 'SUS', description: 'Contrato sustituido' },
    { statusid: 'REN', description: 'Renovación de servicio' },
    { statusid: 'CAN', description: 'Contrato cancelado' }
  ]);

  await MethodPayment.bulkCreate([
    { description: 'Efectivo' },
    { description: 'Tarjeta de crédito' },
    { description: 'Transferencia bancaria' }
  ]);

  await AttentionType.bulkCreate([
    { attentiontypeid: 'AC', description: 'Atención al cliente' },
    { attentiontypeid: 'PS', description: 'Pago de servicio' }
  ]);

  await Service.bulkCreate([
    { servicename: 'Plan Básico', servicedescription: 'Internet residencial básico', equipment: 'Router WiFi N300', speed: 50, price: 20.00 },
    { servicename: 'Plan Hogar', servicedescription: 'Internet residencial estándar', equipment: 'Router WiFi AC1200', speed: 150, price: 30.00 },
    { servicename: 'Plan Premium', servicedescription: 'Internet de alta velocidad con fibra', equipment: 'Router WiFi 6 + ONT', speed: 400, price: 45.00 }
  ]);

  await Cash.bulkCreate([
    { cashid: 1, cashdescription: 'CAJA 1', active: 'S' },
    { cashid: 2, cashdescription: 'CAJA 2', active: 'S' }
  ]);

  // ---------- Menú dinámico por rol (requisito en rojo del PDF) ----------
  const menus = await Menu.bulkCreate([
    { label: 'Bienvenida', route: '/welcome', icon: 'bi-house' },          // 1 todos
    { label: 'Dashboard', route: '/dashboard', icon: 'bi-bar-chart' },     // 2 admin
    { label: 'Usuarios', route: '/users', icon: 'bi-people' },             // 3 admin, gestor
    { label: 'Turnos', route: '/turns', icon: 'bi-ticket-perforated' },    // 4 todos
    { label: 'Procesos de Caja', route: '/caja', icon: 'bi-cash-coin' },   // 5 cajero
    { label: 'Clientes', route: '/clients', icon: 'bi-person-vcard' }      // 6 cajero
  ], { returning: true });

  const m = {};
  for (const x of menus) m[x.route] = x.menuid;

  await RolMenu.bulkCreate([
    // ADMINISTRADOR
    { rol_rolid: 1, menu_menuid: m['/welcome'] },
    { rol_rolid: 1, menu_menuid: m['/dashboard'] },
    { rol_rolid: 1, menu_menuid: m['/users'] },
    { rol_rolid: 1, menu_menuid: m['/turns'] },
    // GESTOR
    { rol_rolid: 2, menu_menuid: m['/welcome'] },
    { rol_rolid: 2, menu_menuid: m['/users'] },
    { rol_rolid: 2, menu_menuid: m['/turns'] },
    // CAJERO
    { rol_rolid: 3, menu_menuid: m['/welcome'] },
    { rol_rolid: 3, menu_menuid: m['/turns'] },
    { rol_rolid: 3, menu_menuid: m['/caja'] },
    { rol_rolid: 3, menu_menuid: m['/clients'] }
  ]);

  // ---------- Usuarios de demostración ----------
  await User.bulkCreate([
    { userid: 1, username: 'admin1234', email: 'admin@viamatica.com', password: bcrypt.hashSync('Admin1234', 10), rol_rolid: 1, userstatus_statusid: 'ACT' },
    { userid: 2, username: 'gestor123', email: 'gestor@viamatica.com', password: bcrypt.hashSync('Gestor123', 10), rol_rolid: 2, userstatus_statusid: 'ACT', usercreate: 1 },
    { userid: 3, username: 'cajero123', email: 'cajero@viamatica.com', password: bcrypt.hashSync('Cajero123', 10), rol_rolid: 3, userstatus_statusid: 'ACT', usercreate: 1 }
  ]);

  // El cajero demo queda asignado a la CAJA 1
  await UserCash.create({ user_userid: 3, cash_cashid: 1 });

  // Ajustar las secuencias de los IDs insertados manualmente
  await sequelize.query(`SELECT setval(pg_get_serial_sequence('"user"', 'userid'), 3)`);
  await sequelize.query(`SELECT setval(pg_get_serial_sequence('cash', 'cashid'), 2)`);

  console.log('>> Seed completado. Usuarios demo: admin1234/Admin1234, gestor123/Gestor123, cajero123/Cajero123');
}

module.exports = seed;
