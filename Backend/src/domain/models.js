// ============================================================
// CAPA DE DOMINIO - Entidades del negocio (Sequelize ORM)
// Esquema basado en el diagrama de la prueba (con ajustes permitidos)
// ============================================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// ---------- Catálogos ----------
const Rol = sequelize.define('Rol', {
  rolid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  rolname: { type: DataTypes.STRING(50), allowNull: false }
}, { tableName: 'rol', timestamps: false });

const UserStatus = sequelize.define('UserStatus', {
  statusid: { type: DataTypes.STRING(3), primaryKey: true },
  description: { type: DataTypes.STRING(50), allowNull: false }
}, { tableName: 'userstatus', timestamps: false });

const StatusContract = sequelize.define('StatusContract', {
  statusid: { type: DataTypes.STRING(3), primaryKey: true },
  description: { type: DataTypes.STRING(50), allowNull: false }
}, { tableName: 'statuscontract', timestamps: false });

const MethodPayment = sequelize.define('MethodPayment', {
  methodpaymentid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.STRING(50), allowNull: false }
}, { tableName: 'methodpayment', timestamps: false });

const AttentionType = sequelize.define('AttentionType', {
  attentiontypeid: { type: DataTypes.STRING(3), primaryKey: true },
  description: { type: DataTypes.STRING(100), allowNull: false }
}, { tableName: 'attentiontype', timestamps: false });

// ---------- Seguridad / usuarios ----------
const User = sequelize.define('User', {
  userid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(100), allowNull: false },
  password: { type: DataTypes.STRING(100), allowNull: false },
  rol_rolid: { type: DataTypes.INTEGER, allowNull: false },
  creationdate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  usercreate: { type: DataTypes.INTEGER },          // usuario que lo creó
  userapproval: { type: DataTypes.INTEGER },        // admin que lo aprobó
  dateapproval: { type: DataTypes.DATE },
  userstatus_statusid: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'ACT' },
  session_active: { type: DataTypes.BOOLEAN, defaultValue: false },
  failed_attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  deleted: { type: DataTypes.BOOLEAN, defaultValue: false }  // eliminación lógica
}, { tableName: 'user', timestamps: false });

// ---------- Cajas ----------
const Cash = sequelize.define('Cash', {
  cashid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cashdescription: { type: DataTypes.STRING(50), allowNull: false },
  active: { type: DataTypes.STRING(1), defaultValue: 'S' },
  inuse_userid: { type: DataTypes.INTEGER, allowNull: true } // controla que 2 usuarios no la usen a la vez
}, { tableName: 'cash', timestamps: false });

const UserCash = sequelize.define('UserCash', {
  user_userid: { type: DataTypes.INTEGER, primaryKey: true },
  cash_cashid: { type: DataTypes.INTEGER, primaryKey: true }
}, { tableName: 'usercash', timestamps: false });

// ---------- Clientes ----------
const Client = sequelize.define('Client', {
  clientid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  lastname: { type: DataTypes.STRING(50), allowNull: false },
  identification: { type: DataTypes.STRING(13), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(120), allowNull: false },
  phonenumber: { type: DataTypes.STRING(13), allowNull: false },
  address: { type: DataTypes.STRING(100), allowNull: false },
  referenceaddress: { type: DataTypes.STRING(100), allowNull: false },
  status: { type: DataTypes.STRING(3), defaultValue: 'ACT' },
  deleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'client', timestamps: false });

// ---------- Servicios ----------
const Service = sequelize.define('Service', {
  serviceid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  servicename: { type: DataTypes.STRING(100), allowNull: false },
  servicedescription: { type: DataTypes.STRING(150) },
  equipment: { type: DataTypes.STRING(100) },       // Equipos
  speed: { type: DataTypes.INTEGER },               // Velocidad (Mbps)
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { tableName: 'service', timestamps: false });

// ---------- Turnos ----------
const Turn = sequelize.define('Turn', {
  turnid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.STRING(6), allowNull: false }, // 2 letras + 4 números (AC0001)
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  cash_cashid: { type: DataTypes.INTEGER, allowNull: false },
  usergestorid: { type: DataTypes.INTEGER, allowNull: false }, // gestor que asignó
  cajero_userid: { type: DataTypes.INTEGER, allowNull: false }, // cajero asignado
  client_clientid: { type: DataTypes.INTEGER, allowNull: true },
  attentiontype_attentiontypeid: { type: DataTypes.STRING(3), allowNull: false },
  status: { type: DataTypes.STRING(3), defaultValue: 'PEN' }, // PEN | ATE | CAN
  deleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'turn', timestamps: false });

// ---------- Contratos y pagos ----------
const Contract = sequelize.define('Contract', {
  contractid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  startdate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  enddate: { type: DataTypes.DATE },
  service_serviceid: { type: DataTypes.INTEGER, allowNull: false },
  statuscontract_statusid: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'VIG' },
  client_clientid: { type: DataTypes.INTEGER, allowNull: false },
  methodpayment_methodpaymentid: { type: DataTypes.INTEGER, allowNull: false },
  deleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'contract', timestamps: false });

const Payment = sequelize.define('Payment', {
  paymentid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paymentdate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  client_clientid: { type: DataTypes.INTEGER, allowNull: false },
  contract_contractid: { type: DataTypes.INTEGER, allowNull: true },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { tableName: 'payments', timestamps: false });

// ---------- Menú dinámico por rol ----------
const Menu = sequelize.define('Menu', {
  menuid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  label: { type: DataTypes.STRING(50), allowNull: false },
  route: { type: DataTypes.STRING(50), allowNull: false },
  icon: { type: DataTypes.STRING(50) }
}, { tableName: 'menu', timestamps: false });

const RolMenu = sequelize.define('RolMenu', {
  rol_rolid: { type: DataTypes.INTEGER, primaryKey: true },
  menu_menuid: { type: DataTypes.INTEGER, primaryKey: true }
}, { tableName: 'rolmenu', timestamps: false });

// ============================================================
// ASOCIACIONES
// ============================================================
User.belongsTo(Rol, { foreignKey: 'rol_rolid' });
User.belongsTo(UserStatus, { foreignKey: 'userstatus_statusid' });
Rol.hasMany(User, { foreignKey: 'rol_rolid' });

User.belongsToMany(Cash, { through: UserCash, foreignKey: 'user_userid', otherKey: 'cash_cashid' });
Cash.belongsToMany(User, { through: UserCash, foreignKey: 'cash_cashid', otherKey: 'user_userid' });

Turn.belongsTo(Cash, { foreignKey: 'cash_cashid' });
Turn.belongsTo(User, { as: 'gestor', foreignKey: 'usergestorid' });
Turn.belongsTo(User, { as: 'cajero', foreignKey: 'cajero_userid' });
Turn.belongsTo(Client, { foreignKey: 'client_clientid' });
Turn.belongsTo(AttentionType, { foreignKey: 'attentiontype_attentiontypeid' });

Contract.belongsTo(Service, { foreignKey: 'service_serviceid' });
Contract.belongsTo(StatusContract, { foreignKey: 'statuscontract_statusid' });
Contract.belongsTo(Client, { foreignKey: 'client_clientid' });
Contract.belongsTo(MethodPayment, { foreignKey: 'methodpayment_methodpaymentid' });
Client.hasMany(Contract, { foreignKey: 'client_clientid' });

Payment.belongsTo(Client, { foreignKey: 'client_clientid' });
Payment.belongsTo(Contract, { foreignKey: 'contract_contractid' });

Menu.belongsToMany(Rol, { through: RolMenu, foreignKey: 'menu_menuid', otherKey: 'rol_rolid' });
Rol.belongsToMany(Menu, { through: RolMenu, foreignKey: 'rol_rolid', otherKey: 'menu_menuid' });

module.exports = {
  sequelize, Rol, UserStatus, StatusContract, MethodPayment, AttentionType,
  User, Cash, UserCash, Client, Service, Turn, Contract, Payment, Menu, RolMenu
};
