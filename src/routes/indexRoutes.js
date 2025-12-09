const express = require('express');
const router = express.Router();
const seguimientoController = require('../controllers/seguimientoController');

// Página principal
router.get('/', seguimientoController.index);

// Página de proyectos internos
router.get('/proyectos-internos', seguimientoController.proyectosInternos);

module.exports = router;







