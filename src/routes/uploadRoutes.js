const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const UploadController = require('../controllers/uploadController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Routes
router.post('/upload', upload.single('file'), UploadController.uploadCSV);
router.get('/history', UploadController.getUploadHistory);
router.get('/history/:id', UploadController.getUploadById);

module.exports = router;
