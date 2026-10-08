const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { clientUrl } = require('./config');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const leadRoutes = require('./routes/leadRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const followupRoutes = require('./routes/followupRoutes');
const activityRoutes = require('./routes/activityRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditRoutes = require('./routes/auditRoutes');
const customerPortalRoutes = require('./routes/customerPortalRoutes');
const systemRoutes = require('./routes/systemRoutes');

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General API rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AcxiomCRM API service operational',
    timestamp: new Date().toISOString()
  });
});

// Mount modular routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/customer-portal', customerPortalRoutes);
app.use('/api/system', systemRoutes);

// Catch 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' was not found on this server.`
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
