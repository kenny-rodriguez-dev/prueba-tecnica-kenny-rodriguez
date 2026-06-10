// ============================================================
// CAPA DE INTERFACES - Rutas de autenticación
// ============================================================
const router = require('express').Router();
const authService = require('../../application/auth.service');
const { authenticate } = require('../middlewares/auth');
const handle = require('./handle');

// POST /api/auth/login  { login, password }  (login = username o email)
router.post('/login', handle(req => authService.login(req.body.login, req.body.password)));

// POST /api/auth/logout
router.post('/logout', authenticate, handle(req => authService.logout(req.user.userid)));

// POST /api/auth/recover  { email, newPassword }
router.post('/recover', handle(req => authService.recover(req.body.email, req.body.newPassword)));

module.exports = router;
