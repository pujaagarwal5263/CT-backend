const pool = require('../config/database');

class DailyPlan {
  // Create or update daily plan
  static async upsertPlan(planData) {
    const { plan_date, warehouse, planned_manifest_qty, created_by } = planData;

    try {
      const existingPlan = await pool.query(
        'SELECT id FROM daily_plan WHERE plan_date = $1 AND warehouse = $2',
        [plan_date, warehouse]
      );

      if (existingPlan.rows.length > 0) {
        const result = await pool.query(
          `UPDATE daily_plan 
           SET planned_manifest_qty = $1, created_by = $2
           WHERE plan_date = $3 AND warehouse = $4
           RETURNING id`,
          [planned_manifest_qty, created_by, plan_date, warehouse]
        );
        return { action: 'updated', id: result.rows[0].id };
      } else {
        const result = await pool.query(
          `INSERT INTO daily_plan (plan_date, warehouse, planned_manifest_qty, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [plan_date, warehouse, planned_manifest_qty, created_by]
        );
        return { action: 'inserted', id: result.rows[0].id };
      }
    } catch (error) {
      throw error;
    }
  }

  // Get plans by date range
  static async getPlans(startDate, endDate) {
    const result = await pool.query(
      `SELECT * FROM daily_plan 
       WHERE plan_date >= $1 AND plan_date <= $2
       ORDER BY plan_date, warehouse`,
      [startDate, endDate]
    );
    return result.rows;
  }

  // Get plan achievement
  static async getPlanAchievement(planDate, warehouse) {
    const planResult = await pool.query(
      'SELECT planned_manifest_qty FROM daily_plan WHERE plan_date = $1 AND warehouse = $2',
      [planDate, warehouse]
    );

    if (planResult.rows.length === 0) {
      return { planned: 0, actual: 0, achievement: 0 };
    }

    const planned = planResult.rows[0].planned_manifest_qty;

    const actualResult = await pool.query(
      `SELECT COUNT(*) as count FROM orders_master 
       WHERE order_date = $1 AND warehouse = $2 AND manifested_at IS NOT NULL`,
      [planDate, warehouse]
    );

    const actual = parseInt(actualResult.rows[0].count);
    const achievement = planned > 0 ? ((actual / planned) * 100).toFixed(2) : 0;

    return { planned, actual, achievement };
  }

  // Get all plans with achievement
  static async getPlansWithAchievement(startDate, endDate) {
    const plans = await this.getPlans(startDate, endDate);
    
    const result = await Promise.all(plans.map(async (plan) => {
      const achievement = await this.getPlanAchievement(plan.plan_date, plan.warehouse);
      return {
        ...plan,
        actual_manifest_qty: achievement.actual,
        achievement_percentage: achievement.achievement
      };
    }));

    return result;
  }
}

module.exports = DailyPlan;
