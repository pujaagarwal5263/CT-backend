const express = require('express');
const router = express.Router();
const MasterDataController = require('../controllers/masterDataController');

// Routes
router.get('/warehouses', MasterDataController.getWarehouses);
router.get('/couriers', MasterDataController.getCouriers);
router.get('/clients', MasterDataController.getClients);

module.exports = router;
