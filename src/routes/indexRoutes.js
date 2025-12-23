const express = require('express');
const router = express.Router();
const seguimientoController = require('../controllers/seguimientoController');
const syncController = require('../controllers/syncController');

// Página principal
router.get('/', seguimientoController.index);

// Página de proyectos internos
router.get('/proyectos-internos', seguimientoController.proyectosInternos);

// Página de Sync
router.get('/sync', syncController.index);

module.exports = router;







