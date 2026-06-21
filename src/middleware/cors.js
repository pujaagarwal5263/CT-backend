const cors = require('cors');

const corsOptions = {
  origin: 'https://rad-puffpuff-2be048.netlify.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = cors(corsOptions);
