// ============================================================
// CONFIGURACIÓN - Especificación OpenAPI 3 para Swagger UI
// Disponible en: http://localhost:3000/api-docs
// ============================================================
const sec = [{ bearerAuth: [] }];
const json = (example) => ({ content: { 'application/json': { schema: { type: 'object' }, example } } });
const ok = { 200: { description: 'OK' } };

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'API - Sistema de Gestión de Caja (Viamatica)',
    version: '1.0.0',
    description: 'API REST para la gestión de caja de una empresa de servicios de internet. Prueba técnica Node.js + Angular. Use /api/auth/login para obtener el token y autorícese con el botón Authorize.'
  },
  servers: [{ url: 'http://localhost:3000' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    }
  },
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Iniciar sesión (username o email). Se bloquea al 3er intento fallido',
        requestBody: json({ login: 'admin1234', password: 'Admin1234' }),
        responses: ok
      }
    },
    '/api/auth/logout': {
      post: { tags: ['Auth'], summary: 'Cerrar sesión', security: sec, responses: ok }
    },
    '/api/auth/recover': {
      post: {
        tags: ['Auth'], summary: 'Recuperar contraseña',
        requestBody: json({ email: 'admin@viamatica.com', newPassword: 'NuevaClave1' }),
        responses: ok
      }
    },
    '/api/users': {
      get: {
        tags: ['Usuarios'], summary: 'Listar usuarios (ADMIN, GESTOR)', security: sec,
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'ACT | INA | BLO | PEN' },
          { name: 'rolid', in: 'query', schema: { type: 'integer' } }
        ],
        responses: ok
      },
      post: {
        tags: ['Usuarios'], summary: 'Crear usuario (gestor crea en estado PEN, admin en ACT)', security: sec,
        requestBody: json({ username: 'cajero002', email: 'cajero002@mail.com', password: 'Cajero1234', rol_rolid: 3 }),
        responses: ok
      }
    },
    '/api/users/pending': {
      get: { tags: ['Usuarios'], summary: 'Usuarios pendientes de aprobación', security: sec, responses: ok }
    },
    '/api/users/bulk': {
      post: {
        tags: ['Usuarios'], summary: 'Carga masiva de usuarios (ADMIN)', security: sec,
        requestBody: json({ users: [{ username: 'gestor002', email: 'g2@mail.com', password: 'Gestor1234', rol_rolid: 2 }] }),
        responses: ok
      }
    },
    '/api/users/{id}/approve': {
      put: {
        tags: ['Usuarios'], summary: 'Aprobar usuario creado por gestor (ADMIN)', security: sec,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: ok
      }
    },
    '/api/users/{id}': {
      put: {
        tags: ['Usuarios'], summary: 'Actualizar usuario / estado (ADMIN)', security: sec,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: json({ email: 'nuevo@mail.com', userstatus_statusid: 'ACT' }),
        responses: ok
      },
      delete: {
        tags: ['Usuarios'], summary: 'Eliminar usuario (lógico, ADMIN)', security: sec,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: ok
      }
    },
    '/api/clients': {
      get: {
        tags: ['Clientes'], summary: 'Listar / buscar por identificación', security: sec,
        parameters: [{ name: 'identification', in: 'query', schema: { type: 'string' } }],
        responses: ok
      },
      post: {
        tags: ['Clientes'], summary: 'Crear cliente (identificación única)', security: sec,
        requestBody: json({
          name: 'Juan', lastname: 'Pérez', identification: '0912345678', email: 'juan@mail.com',
          phonenumber: '0991234567', address: 'Av. 9 de Octubre 1234 y Malecón, Guayaquil',
          referenceaddress: 'Frente al parque central, edificio azul de dos pisos'
        }),
        responses: ok
      }
    },
    '/api/clients/bulk': {
      post: {
        tags: ['Clientes'], summary: 'Carga masiva de clientes', security: sec,
        requestBody: json({ clients: [] }),
        responses: ok
      }
    },
    '/api/clients/{id}': {
      put: {
        tags: ['Clientes'], summary: 'Actualizar cliente / estado', security: sec,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: json({ phonenumber: '0998887766' }),
        responses: ok
      },
      delete: {
        tags: ['Clientes'], summary: 'Eliminar cliente (lógico)', security: sec,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: ok
      }
    },
    '/api/turns': {
      get: {
        tags: ['Turnos'], summary: 'Listar turnos', security: sec,
        parameters: [
          { name: 'hoy', in: 'query', schema: { type: 'string' }, description: 'true = solo de hoy' },
          { name: 'cajero_userid', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'PEN | ATE | CAN' }
        ],
        responses: ok
      },
      post: {
        tags: ['Turnos'], summary: 'Crear turno (GESTOR). Descripción autogenerada: AC0001, PS0001...', security: sec,
        requestBody: json({ cash_cashid: 1, cajero_userid: 3, attentiontypeid: 'AC' }),
        responses: ok
      }
    },
    '/api/turns/stats/today': {
      get: { tags: ['Turnos'], summary: 'Turnos atendidos hoy según rol (cajero: propios, gestor: asignados, admin: total)', security: sec, responses: ok }
    },
    '/api/turns/{id}/attend': {
      put: {
        tags: ['Turnos'], summary: 'Atender turno (CAJERO). Valida que la caja no esté en uso por otro usuario', security: sec,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: json({ client_clientid: 1 }),
        responses: ok
      }
    },
    '/api/turns/{id}': {
      delete: {
        tags: ['Turnos'], summary: 'Eliminar turno (lógico)', security: sec,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: ok
      }
    },
    '/api/contracts': {
      get: {
        tags: ['Contratos'], summary: 'Listar contratos', security: sec,
        parameters: [{ name: 'clientid', in: 'query', schema: { type: 'integer' } }],
        responses: ok
      },
      post: {
        tags: ['Contratos'], summary: 'Contratar servicio de internet', security: sec,
        requestBody: json({ client_clientid: 1, service_serviceid: 1, methodpayment_methodpaymentid: 1, months: 12 }),
        responses: ok
      }
    },
    '/api/contracts/{id}/change-service': {
      put: {
        tags: ['Contratos'], summary: 'Cambio de servicio (usa la FUNCIÓN fn_cambiar_servicio: VIG→SUS + nuevo REN con misma fecha fin)', security: sec,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: json({ service_serviceid: 2 }),
        responses: ok
      }
    },
    '/api/contracts/{id}/payment-method': {
      put: {
        tags: ['Contratos'], summary: 'Cambio de forma de pago', security: sec,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: json({ methodpayment_methodpaymentid: 2 }),
        responses: ok
      }
    },
    '/api/contracts/{id}/cancel': {
      put: {
        tags: ['Contratos'], summary: 'Cancelar contrato (actualiza estado y fecha fin)', security: sec,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: ok
      }
    },
    '/api/contracts/{id}': {
      delete: {
        tags: ['Contratos'], summary: 'Eliminar contrato (lógico)', security: sec,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: ok
      }
    },
    '/api/payments': {
      get: {
        tags: ['Pagos'], summary: 'Listar pagos', security: sec,
        parameters: [{ name: 'clientid', in: 'query', schema: { type: 'integer' } }],
        responses: ok
      },
      post: {
        tags: ['Pagos'], summary: 'Registrar pago', security: sec,
        requestBody: json({ client_clientid: 1, contract_contractid: 1, amount: 30.00 }),
        responses: ok
      }
    },
    '/api/catalogs/services': {
      get: { tags: ['Catálogos'], summary: 'Servicios de internet disponibles', security: sec, responses: ok }
    },
    '/api/catalogs/cashes': {
      get: { tags: ['Catálogos'], summary: 'Cajas con sus usuarios asignados', security: sec, responses: ok }
    },
    '/api/catalogs/cashes/{id}/assign': {
      post: {
        tags: ['Catálogos'], summary: 'Asignar cajero a caja (GESTOR, máx 2 por caja)', security: sec,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: json({ user_userid: 3 }),
        responses: ok
      }
    },
    '/api/dashboard/users': {
      get: { tags: ['Dashboard'], summary: 'Indicadores de usuarios (ADMIN)', security: sec, responses: ok }
    },
    '/api/dashboard/summary': {
      get: {
        tags: ['Dashboard'], summary: 'Indicadores de cajas/cajeros/gestores con filtro de fechas (ADMIN)', security: sec,
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string' }, example: '2026-06-01' },
          { name: 'to', in: 'query', schema: { type: 'string' }, example: '2026-06-10' }
        ],
        responses: ok
      }
    },
    '/api/menu': {
      get: { tags: ['Menú'], summary: 'Menú dinámico cargado desde la BD según el rol del JWT', security: sec, responses: ok }
    }
  }
};
