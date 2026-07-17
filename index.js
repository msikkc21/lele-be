const express = require('express');
const cors = require('cors');
const prisma = require('./prisma/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// 1. Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Express + Prisma + Supabase API is running smoothly!',
    timestamp: new Date().toISOString()
  });
});

const readingsRouter = require('./routes/readings');

// 2. Test database connectivity endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    // Perform a raw query to check connection
    const testResult = await prisma.$queryRaw`SELECT 1 as connected`;
    res.json({
      status: 'success',
      message: 'Successfully connected to Supabase database via Prisma!',
      data: testResult
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to the database. Make sure you updated the connection string in your .env file.',
      error: error.message
    });
  }
});

// IoT readings routes
app.use('/api/readings', readingsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
