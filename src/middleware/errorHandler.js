const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.code === '23505') {
    // Unique violation
    return res.status(400).json({
      error: 'Duplicate entry detected',
      message: err.message
    });
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      error: 'Referenced record does not exist',
      message: err.message
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = errorHandler;
