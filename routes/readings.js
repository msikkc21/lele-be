const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// POST /api/readings - Receive sensor data from IoT devices
router.post('/', async (req, res, next) => {
  try {
    const { suhu, tds, ph, raw, deviceId } = req.body;

    // Validation
    if (suhu === undefined || tds === undefined || ph === undefined || !deviceId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields. Please provide: suhu, tds, ph, and deviceId.'
      });
    }

    const parsedSuhu = parseFloat(suhu);
    const parsedTds = parseFloat(tds);
    const parsedPh = parseFloat(ph);
    let parsedRaw = null;

    if (raw !== undefined && raw !== null) {
      parsedRaw = parseFloat(raw);
      if (isNaN(parsedRaw)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid numerical value for raw sensor voltage. raw must be a number.'
        });
      }
    }

    if (isNaN(parsedSuhu) || isNaN(parsedTds) || isNaN(parsedPh)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid numerical values for sensor readings. suhu, tds, and ph must be numbers.'
      });
    }

    if (parsedPh < 0 || parsedPh > 14) {
      return res.status(400).json({
        status: 'error',
        message: 'pH value must be between 0 and 14.'
      });
    }

    // Save to Supabase via Prisma
    const newReading = await prisma.waterReading.create({
      data: {
        suhu: parsedSuhu,
        tds: parsedTds,
        ph: parsedPh,
        raw: parsedRaw,
        deviceId: String(deviceId).trim()
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Sensor reading saved successfully!',
      data: newReading
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/readings - Get historical readings (latest first)
router.get('/', async (req, res, next) => {
  try {
    const { deviceId, limit } = req.query;

    const parsedLimit = parseInt(limit, 10);
    const queryLimit = !isNaN(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 1000) : 100;

    const whereClause = {};
    if (deviceId) {
      whereClause.deviceId = String(deviceId);
    }

    const readings = await prisma.waterReading.findMany({
      where: whereClause,
      take: queryLimit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      count: readings.length,
      limit: queryLimit,
      data: readings
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/readings/latest - Get the absolute latest reading
router.get('/latest', async (req, res, next) => {
  try {
    const { deviceId } = req.query;

    const whereClause = {};
    if (deviceId) {
      whereClause.deviceId = String(deviceId);
    }

    const latestReading = await prisma.waterReading.findFirst({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!latestReading) {
      return res.status(404).json({
        status: 'error',
        message: 'No sensor readings found.'
      });
    }

    res.json({
      status: 'success',
      data: latestReading
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
