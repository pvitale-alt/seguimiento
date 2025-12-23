const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

// Rutas API para Sync
router.get('/pedidos', syncController.obtenerPedidos);
router.get('/pedidos/:id', syncController.obtenerPedidoPorId);
router.get('/equipos', syncController.obtenerEquipos);
router.post('/pedidos', syncController.crearPedido);
router.put('/pedidos/:id', syncController.actualizarPedido);
router.delete('/pedidos/:id', syncController.eliminarPedido);

module.exports = router;

