class SLAEngine {
  static calculateSLA(order, filterEndDate = null) {
    const { tat, manifested_at, delivered_at, order_status } = order;

    // If order is manifested, check if SLA was met
    if (manifested_at) {
      if (tat) {
        const tatDate = new Date(tat);
        const manifestedDate = new Date(manifested_at);
        
        if (manifestedDate <= tatDate) {
          return 'MET';
        } else {
          return 'MISSED';
        }
      }
      return 'PENDING';
    }

    // If not manifested, check if TAT is breached based on filter end date
    if (!manifested_at && tat && filterEndDate) {
      const tatDate = new Date(tat);
      const filterDate = new Date(filterEndDate);
      
      if (filterDate > tatDate) {
        return 'MISSED';
      }
    }

    return 'PENDING';
  }

  static async recalculateAllSLA(filterEndDate = null) {
    const pool = require('../config/database');
    
    // Get all orders that need SLA calculation
    const result = await pool.query(`
      SELECT id, order_id, awb_number, tat, manifested_at, delivered_at, order_status
      FROM orders_master
    `);

    const updates = [];

    for (const order of result.rows) {
      const slaStatus = this.calculateSLA(order, filterEndDate);
      
      await pool.query(
        'UPDATE orders_master SET sla_status = $1 WHERE id = $2',
        [slaStatus, order.id]
      );

      updates.push({
        order_id: order.order_id,
        sla_status: slaStatus
      });
    }

    return updates;
  }

  static async recalculateOrderSLA(orderId, filterEndDate = null) {
    const pool = require('../config/database');
    
    const result = await pool.query(
      'SELECT id, tat, manifested_at, delivered_at, order_status FROM orders_master WHERE order_id = $1',
      [orderId]
    );

    if (result.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = result.rows[0];
    const slaStatus = this.calculateSLA(order, filterEndDate);

    await pool.query(
      'UPDATE orders_master SET sla_status = $1 WHERE id = $2',
      [slaStatus, order.id]
    );

    return slaStatus;
  }
}

module.exports = SLAEngine;
