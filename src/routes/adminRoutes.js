const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/authJWT');

// Página de administración (requiere admin)
router.get('/', requireAdmin, adminController.index);

module.exports = router;

