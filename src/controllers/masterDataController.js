const pool = require('../config/database');

class MasterDataController {
  static async getWarehouses(req, res) {
    try {
      const result = await pool.query(
        'SELECT * FROM warehouse_master WHERE is_active = true ORDER BY warehouse_name'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Get warehouses error:', error);
      res.status(500).json({ error: 'Failed to retrieve warehouses' });
    }
  }

  static async getCouriers(req, res) {
    try {
      const result = await pool.query(
        'SELECT * FROM courier_master WHERE is_active = true ORDER BY courier_name'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Get couriers error:', error);
      res.status(500).json({ error: 'Failed to retrieve couriers' });
    }
  }

  static async getClients(req, res) {
    try {
      const result = await pool.query(
        'SELECT * FROM client_master WHERE is_active = true ORDER BY client_name'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Get clients error:', error);
      res.status(500).json({ error: 'Failed to retrieve clients' });
    }
  }
}

module.exports = MasterDataController;
