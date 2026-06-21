const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

// Routes
router.get('/kpis', DashboardController.getKPIs);
router.get('/warehouse-metrics', DashboardController.getWarehouseMetrics);
router.get('/courier-metrics', DashboardController.getCourierMetrics);
router.get('/daily-trends', DashboardController.getDailyTrends);
router.get('/plan-achievement', DashboardController.getPlanAchievement);
router.get('/orders', DashboardController.getOrders);

module.exports = router;
