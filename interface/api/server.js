require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('../../utils/logger');
const { errorHandler } = require('../../utils/errors');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// Security Middleware (Zafkiel's Wall)
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts/styles for React
}));
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true, 
  legacyHeaders: false,
  message: { success: false, message: "Too many time manipulations from this IP, please try again after 15 minutes." },
  handler: (req, res, next, options) => {
    logger.error(`[RATE LIMIT EXCEEDED] IP: ${req.ip} tried to access ${req.url}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Apply rate limiting to API routes
app.use('/api', limiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use(errorHandler);

// Only listen if not running as a serverless function (Vercel)
if (!isProduction) {
  app.listen(PORT, () => {
    logger.info(`Zafkiel Arcade 1 backend running on port ${PORT}`);
  });
}

// Export the app for Vercel
module.exports = app;
