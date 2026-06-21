const pool = require('../config/database');

class Order {
  // Insert or update order (duplicate prevention)
  static async upsertOrder(orderData, uploadId) {
    const {
      order_id,
      awb_number,
      order_date,
      warehouse,
      courier,
      client = null,
      sku = null,
      quantity = 1,
      order_status = 'Confirmed',
      shipping_status = null,
      tat = null,
      manifested_at = null,
      delivered_at = null
    } = orderData;

    try {
      // Check if order exists
      const existingOrder = await pool.query(
        'SELECT id FROM orders_master WHERE order_id = $1 AND awb_number = $2',
        [order_id, awb_number]
      );

      // Insert into history first
      await pool.query(
        `INSERT INTO orders_history 
         (order_id, awb_number, order_date, warehouse, courier, client, sku, quantity, 
          order_status, shipping_status, tat, manifested_at, delivered_at, sla_status, upload_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [order_id, awb_number, order_date, warehouse, courier, client, sku, quantity,
          order_status, shipping_status, tat, manifested_at, delivered_at, 'PENDING', uploadId]
      );

      if (existingOrder.rows.length > 0) {
        // Update existing order
        const result = await pool.query(
          `UPDATE orders_master 
           SET order_date = $1, warehouse = $2, courier = $3, client = $4, sku = $5, 
               quantity = $6, order_status = $7, shipping_status = $8, tat = $9, 
               manifested_at = $10, delivered_at = $11, updated_at = CURRENT_TIMESTAMP
           WHERE order_id = $12 AND awb_number = $13
           RETURNING id`,
          [order_date, warehouse, courier, client, sku, quantity, order_status,
            shipping_status, tat, manifested_at, delivered_at, order_id, awb_number]
        );
        return { action: 'updated', id: result.rows[0].id };
      } else {
        // Insert new order
        const result = await pool.query(
          `INSERT INTO orders_master 
           (order_id, awb_number, order_date, warehouse, courier, client, sku, quantity, 
            order_status, shipping_status, tat, manifested_at, delivered_at, sla_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           RETURNING id`,
          [order_id, awb_number, order_date, warehouse, courier, client, sku, quantity,
            order_status, shipping_status, tat, manifested_at, delivered_at, 'PENDING']
        );
        return { action: 'inserted', id: result.rows[0].id };
      }
    } catch (error) {
      throw error;
    }
  }

  // Get all orders with filters
  static async getOrders(filters = {}) {
    let query = 'SELECT * FROM orders_master WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.startDate) {
      query += ` AND order_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND order_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters.warehouse) {
      query += ` AND warehouse = $${paramIndex}`;
      params.push(filters.warehouse);
      paramIndex++;
    }

    if (filters.courier) {
      query += ` AND courier = $${paramIndex}`;
      params.push(filters.courier);
      paramIndex++;
    }

    if (filters.client) {
      query += ` AND client = $${paramIndex}`;
      params.push(filters.client);
      paramIndex++;
    }

    if (filters.orderStatus) {
      query += ` AND order_status = $${paramIndex}`;
      params.push(filters.orderStatus);
      paramIndex++;
    }

    if (filters.slaStatus) {
      query += ` AND sla_status = $${paramIndex}`;
      params.push(filters.slaStatus);
      paramIndex++;
    }

    query += ' ORDER BY order_date DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get dashboard KPIs
  static async getDashboardKPIs(filters = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.startDate) {
      whereClause += ` AND order_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      whereClause += ` AND order_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters.warehouse) {
      whereClause += ` AND warehouse = $${paramIndex}`;
      params.push(filters.warehouse);
      paramIndex++;
    }

    if (filters.courier) {
      whereClause += ` AND courier = $${paramIndex}`;
      params.push(filters.courier);
      paramIndex++;
    }

    const queries = {
      totalOrders: `SELECT COUNT(*) as count FROM orders_master ${whereClause}`,
      confirmedOrders: `SELECT COUNT(*) as count FROM orders_master ${whereClause} AND order_status = 'Confirmed'`,
      manifestedOrders: `SELECT COUNT(*) as count FROM orders_master ${whereClause} AND manifested_at IS NOT NULL`,
      pendingOrders: `SELECT COUNT(*) as count FROM orders_master ${whereClause} AND order_status = 'Pending'`,
      deliveredOrders: `SELECT COUNT(*) as count FROM orders_master ${whereClause} AND delivered_at IS NOT NULL`,
      slaMet: `SELECT COUNT(*) as count FROM orders_master ${whereClause} AND manifested_at IS NOT NULL AND manifested_at <= tat`,
    };

    const results = {};
    for (const [key, query] of Object.entries(queries)) {
      const result = await pool.query(query, params);
      results[key] = parseInt(result.rows[0].count);
    }

    // Calculate SLA missed separately with filter end date parameter
    const filterEndDate = filters.endDate ? filters.endDate : new Date().toISOString();
    const slaMissedQuery = `SELECT COUNT(*) as count FROM orders_master ${whereClause} AND (
      (manifested_at IS NOT NULL AND manifested_at > tat) OR 
      (manifested_at IS NULL AND tat IS NOT NULL AND $${paramIndex} > tat)
    )`;
    const slaMissedResult = await pool.query(slaMissedQuery, [...params, filterEndDate]);
    results.slaMissed = parseInt(slaMissedResult.rows[0].count);

    // Calculate SLA percentage based on business rules
    // SLA Met = Total - SLA Missed
    results.slaMet = results.totalOrders - results.slaMissed;
    results.slaPercentage = results.totalOrders > 0 
      ? ((results.slaMet / results.totalOrders) * 100).toFixed(2) 
      : 0;

    return results;
  }

  // Get warehouse-wise metrics
  static async getWarehouseMetrics(filters = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.startDate) {
      whereClause += ` AND order_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      whereClause += ` AND order_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    const query = `
      SELECT 
        warehouse,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN manifested_at IS NULL THEN 1 END) as pending_orders,
        COUNT(CASE WHEN manifested_at IS NOT NULL THEN 1 END) as manifested_orders,
        COUNT(CASE WHEN sla_status = 'MET' THEN 1 END) as sla_met,
        COUNT(CASE WHEN sla_status IN ('MISSED', 'BREACHED') THEN 1 END) as sla_missed
      FROM orders_master 
      ${whereClause}
      GROUP BY warehouse
      ORDER BY warehouse
    `;

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      warehouse: row.warehouse,
      totalOrders: parseInt(row.total_orders),
      pendingOrders: parseInt(row.pending_orders),
      manifestedOrders: parseInt(row.manifested_orders),
      slaMet: parseInt(row.sla_met),
      slaMissed: parseInt(row.sla_missed),
      slaPercentage: (parseInt(row.sla_met) + parseInt(row.sla_missed)) > 0
        ? ((parseInt(row.sla_met) / (parseInt(row.sla_met) + parseInt(row.sla_missed))) * 100).toFixed(2)
        : 0
    }));
  }

  // Get courier-wise metrics
  static async getCourierMetrics(filters = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.startDate) {
      whereClause += ` AND order_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      whereClause += ` AND order_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    const query = `
      SELECT 
        courier,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN manifested_at IS NOT NULL THEN 1 END) as manifested_orders,
        COUNT(CASE WHEN delivered_at IS NOT NULL THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN sla_status = 'MET' THEN 1 END) as sla_met,
        COUNT(CASE WHEN sla_status IN ('MISSED', 'BREACHED') THEN 1 END) as sla_missed
      FROM orders_master 
      ${whereClause}
      GROUP BY courier
      ORDER BY courier
    `;

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      courier: row.courier,
      totalOrders: parseInt(row.total_orders),
      manifestedOrders: parseInt(row.manifested_orders),
      deliveredOrders: parseInt(row.delivered_orders),
      slaMet: parseInt(row.sla_met),
      slaMissed: parseInt(row.sla_missed),
      slaPercentage: (parseInt(row.sla_met) + parseInt(row.sla_missed)) > 0
        ? ((parseInt(row.sla_met) / (parseInt(row.sla_met) + parseInt(row.sla_missed))) * 100).toFixed(2)
        : 0
    }));
  }

  // Get daily order trends
  static async getDailyTrends(filters = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.startDate) {
      whereClause += ` AND order_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      whereClause += ` AND order_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    const query = `
      SELECT 
        order_date,
        COUNT(*) as orders,
        COUNT(CASE WHEN manifested_at IS NOT NULL THEN 1 END) as manifested
      FROM orders_master 
      ${whereClause}
      GROUP BY order_date
      ORDER BY order_date
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = Order;
