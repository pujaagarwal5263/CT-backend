const express = require('express');
const router = express.Router();
const PlanController = require('../controllers/planController');

// Routes
router.post('/', PlanController.createPlan);
router.get('/', PlanController.getPlans);
router.get('/achievement', PlanController.getPlanAchievement);

module.exports = router;
