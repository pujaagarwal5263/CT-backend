const pool = require('../config/database');

class UploadHistory {
  // Create upload history record
  static async createUpload(uploadData) {
    const {
      file_name,
      total_rows,
      inserted_rows,
      updated_rows,
      failed_rows,
      uploaded_by,
      status = 'COMPLETED'
    } = uploadData;

    const result = await pool.query(
      `INSERT INTO upload_history 
       (file_name, total_rows, inserted_rows, updated_rows, failed_rows, uploaded_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [file_name, total_rows, inserted_rows, updated_rows, failed_rows, uploaded_by, status]
    );

    return result.rows[0];
  }

  // Get all upload history
  static async getUploadHistory(limit = 50) {
    const result = await pool.query(
      `SELECT * FROM upload_history 
       ORDER BY upload_timestamp DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // Get upload by ID
  static async getUploadById(id) {
    const result = await pool.query(
      'SELECT * FROM upload_history WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = UploadHistory;
