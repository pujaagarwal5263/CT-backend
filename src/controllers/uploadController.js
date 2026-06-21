const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Order = require('../models/orderModel');
const UploadHistory = require('../models/uploadModel');
const SLAEngine = require('../utils/slaEngine');
const CSVValidator = require('../utils/csvValidator');

class UploadController {
  static async uploadCSV(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname;
      const uploadedBy = req.body.uploaded_by || 'system';

      // Parse CSV
      const rows = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      // Validate CSV
      const validation = CSVValidator.validateFile(rows);

      console.log(`CSV Validation Results:`, {
        totalRows: rows.length,
        validRows: validation.validRows.length,
        invalidRows: validation.invalidRows.length,
        duplicateRows: validation.duplicateRows.length,
        errors: validation.errors
      });

      if (validation.invalidRows.length > 0) {
        console.log('Invalid rows:', validation.invalidRows);
        fs.unlinkSync(filePath);
        return res.status(400).json({
          error: 'CSV validation failed',
          invalidRows: validation.invalidRows,
          duplicateRows: validation.duplicateRows
        });
      }

      // Create upload history record
      const uploadRecord = await UploadHistory.createUpload({
        file_name: fileName,
        total_rows: validation.validRows.length,
        inserted_rows: 0,
        updated_rows: 0,
        failed_rows: 0,
        uploaded_by: uploadedBy,
        status: 'PROCESSING'
      });

      // Process orders
      let insertedCount = 0;
      let updatedCount = 0;
      let failedCount = 0;

      for (const row of validation.validRows) {
        try {
          // Parse dates - order_date is already converted by validator to YYYY-MM-DD format
          const orderDate = row.order_date.split(' ')[0]; // Extract date part only
          
          // Helper function to safely parse dates
          const parseDate = (dateStr) => {
            if (!dateStr || dateStr.trim() === '' || dateStr === 'NA' || dateStr === 'null') {
              return null;
            }
            const parsed = new Date(dateStr);
            return isNaN(parsed.getTime()) ? null : parsed;
          };

          const orderData = {
            order_id: row.order_id,
            awb_number: row.awb_number || null,
            order_date: orderDate,
            warehouse: row.warehouse,
            courier: row.courier,
            client: row.client || null,
            sku: row.sku || null,
            quantity: row.quantity ? parseInt(row.quantity) : 1,
            order_status: row.order_status || 'Confirmed',
            shipping_status: row.shipping_status || null,
            tat: parseDate(row.tat),
            manifested_at: parseDate(row.manifested_at),
            delivered_at: parseDate(row.delivered_at)
          };

          const result = await Order.upsertOrder(orderData, uploadRecord.id);

          if (result.action === 'inserted') {
            insertedCount++;
          } else {
            updatedCount++;
          }
        } catch (error) {
          failedCount++;
          console.error(`Error processing row: ${error.message}`);
        }
      }

      // Recalculate SLA for all orders
      await SLAEngine.recalculateAllSLA();

      // Update upload history
      await UploadHistory.createUpload({
        file_name: fileName,
        total_rows: validation.validRows.length,
        inserted_rows: insertedCount,
        updated_rows: updatedCount,
        failed_rows: failedCount,
        uploaded_by: uploadedBy,
        status: 'COMPLETED'
      });

      // Delete uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: 'CSV uploaded successfully',
        upload_id: uploadRecord.id,
        total_rows: validation.validRows.length,
        inserted_rows: insertedCount,
        updated_rows: updatedCount,
        failed_rows: failedCount,
        duplicate_rows: validation.duplicateRows.length
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to process CSV file' });
    }
  }

  static async getUploadHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const history = await UploadHistory.getUploadHistory(limit);
      res.json(history);
    } catch (error) {
      console.error('Get upload history error:', error);
      res.status(500).json({ error: 'Failed to retrieve upload history' });
    }
  }

  static async getUploadById(req, res) {
    try {
      const { id } = req.params;
      const upload = await UploadHistory.getUploadById(id);
      
      if (!upload) {
        return res.status(404).json({ error: 'Upload not found' });
      }

      res.json(upload);
    } catch (error) {
      console.error('Get upload by ID error:', error);
      res.status(500).json({ error: 'Failed to retrieve upload' });
    }
  }
}

module.exports = UploadController;
