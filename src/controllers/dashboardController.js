const Order = require('../models/orderModel');
const DailyPlan = require('../models/planModel');

class DashboardController {
  static async getKPIs(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        warehouse: req.query.warehouse,
        courier: req.query.courier,
        client: req.query.client,
        orderStatus: req.query.orderStatus,
        slaStatus: req.query.slaStatus
      };

      const kpis = await Order.getDashboardKPIs(filters);
      res.json(kpis);
    } catch (error) {
      console.error('Get KPIs error:', error);
      res.status(500).json({ error: 'Failed to retrieve KPIs' });
    }
  }

  static async getWarehouseMetrics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const metrics = await Order.getWarehouseMetrics(filters);
      res.json(metrics);
    } catch (error) {
      console.error('Get warehouse metrics error:', error);
      res.status(500).json({ error: 'Failed to retrieve warehouse metrics' });
    }
  }

  static async getCourierMetrics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const metrics = await Order.getCourierMetrics(filters);
      res.json(metrics);
    } catch (error) {
      console.error('Get courier metrics error:', error);
      res.status(500).json({ error: 'Failed to retrieve courier metrics' });
    }
  }

  static async getDailyTrends(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const trends = await Order.getDailyTrends(filters);
      res.json(trends);
    } catch (error) {
      console.error('Get daily trends error:', error);
      res.status(500).json({ error: 'Failed to retrieve daily trends' });
    }
  }

  static async getPlanAchievement(req, res) {
    try {
      const { planDate } = req.query;
      
      if (!planDate) {
        return res.status(400).json({ error: 'planDate is required' });
      }

      const plans = await DailyPlan.getPlansWithAchievement(planDate, planDate);
      res.json(plans);
    } catch (error) {
      console.error('Get plan achievement error:', error);
      res.status(500).json({ error: 'Failed to retrieve plan achievement' });
    }
  }

  static async getOrders(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        warehouse: req.query.warehouse,
        courier: req.query.courier,
        client: req.query.client,
        orderStatus: req.query.orderStatus,
        slaStatus: req.query.slaStatus
      };

      const orders = await Order.getOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to retrieve orders' });
    }
  }
}

module.exports = DashboardController;
