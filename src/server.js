require('dotenv').config();
const express = require('express');
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const uploadRoutes = require('./routes/uploadRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const planRoutes = require('./routes/planRoutes');
const masterDataRoutes = require('./routes/masterDataRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/master', masterDataRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
