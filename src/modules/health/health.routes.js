/**
 * TaskFlow API - Health Check Routes
 * Provides liveness and readiness probe endpoints for Kubernetes / Render / AWS.
 */

const express = require('express');
const router = express.Router();
const { testConnection } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');

router.get('/', async (req, res) => {
  const dbHealth = await testConnection();
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  const healthData = {
    status: dbHealth.healthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(uptime),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: {
      status: dbHealth.healthy ? 'CONNECTED' : 'DISCONNECTED',
      latencyMs: dbHealth.latencyMs,
      ...(dbHealth.error && { error: dbHealth.error }),
    },
    memory: {
      heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      rssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
    },
  };

  const statusCode = dbHealth.healthy ? 200 : 503;
  return ApiResponse.success(
    res,
    healthData,
    dbHealth.healthy ? 'Service is healthy' : 'Service is experiencing degraded database connectivity',
    statusCode
  );
});

module.exports = router;
