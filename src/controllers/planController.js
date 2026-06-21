const DailyPlan = require('../models/planModel');

class PlanController {
  static async createPlan(req, res) {
    try {
      const { plan_date, warehouse, planned_manifest_qty, created_by } = req.body;

      if (!plan_date || !warehouse || !planned_manifest_qty) {
        return res.status(400).json({ 
          error: 'plan_date, warehouse, and planned_manifest_qty are required' 
        });
      }

      const result = await DailyPlan.upsertPlan({
        plan_date,
        warehouse,
        planned_manifest_qty,
        created_by: created_by || 'system'
      });

      res.json({
        success: true,
        message: `Plan ${result.action} successfully`,
        id: result.id
      });
    } catch (error) {
      console.error('Create plan error:', error);
      res.status(500).json({ error: 'Failed to create plan' });
    }
  }

  static async getPlans(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const plans = await DailyPlan.getPlansWithAchievement(startDate, endDate);
      res.json(plans);
    } catch (error) {
      console.error('Get plans error:', error);
      res.status(500).json({ error: 'Failed to retrieve plans' });
    }
  }

  static async getPlanAchievement(req, res) {
    try {
      const { planDate, warehouse } = req.query;

      if (!planDate || !warehouse) {
        return res.status(400).json({ error: 'planDate and warehouse are required' });
      }

      const achievement = await DailyPlan.getPlanAchievement(planDate, warehouse);
      res.json(achievement);
    } catch (error) {
      console.error('Get plan achievement error:', error);
      res.status(500).json({ error: 'Failed to retrieve plan achievement' });
    }
  }
}

module.exports = PlanController;
