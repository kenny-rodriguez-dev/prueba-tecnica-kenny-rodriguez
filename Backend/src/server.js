// ============================================================
// SERVIDOR PRINCIPAL - Express + Sequelize + Swagger
// Arquitectura Onion: domain -> application -> infrastructure -> interfaces
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const { sequelize } = require('./domain/models');
const seed = require('./infrastructure/seed');
const swaggerSpec = require('./config/swagger');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Rutas ----------
app.use('/api/auth', require('./interfaces/routes/auth.routes'));
app.use('/api/users', require('./interfaces/routes/user.routes'));
app.use('/api/clients', require('./interfaces/routes/client.routes'));
app.use('/api/turns', require('./interfaces/routes/turn.routes'));
app.use('/api', require('./interfaces/routes/contract.routes')); // /api/contracts y /api/payments
app.use('/api/catalogs', require('./interfaces/routes/catalog.routes'));
app.use('/api/dashboard', require('./interfaces/routes/dashboard.routes'));
app.use('/api/menu', require('./interfaces/routes/menu.routes'));

// ---------- Swagger ----------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/', (req, res) => res.json({ message: 'API Sistema de Caja - Viamatica. Documentación en /api-docs' }));

// ---------- Arranque con reintentos de conexión a la BD ----------
const PORT = process.env.PORT || 3000;

async function start() {
  for (let intento = 1; intento <= 10; intento++) {
    try {
      await sequelize.authenticate();
      console.log('>> Conexión a PostgreSQL establecida');
      break;
    } catch (e) {
      console.log(`>> BD no disponible (intento ${intento}/10). Reintentando en 3s...`);
      if (intento === 10) {
        console.error('>> No se pudo conectar a la base de datos:', e.message);
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  await sequelize.sync();   // crea las tablas si no existen (ORM)
  await seed();             // función SQL + datos iniciales

  app.listen(PORT, () => {
    console.log(`>> API corriendo en http://localhost:${PORT}`);
    console.log(`>> Swagger en http://localhost:${PORT}/api-docs`);
  });
}

start();
