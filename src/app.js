const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(helmet());         // security headers
app.use(cors());           // allow cross-origin requests
app.use(morgan('dev'));    // log every request to console
app.use(express.json());   // parse JSON request bodies

// Health check route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Observability Tool API is running',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;