const app = require('./app');
const { port } = require('./config');

const server = app.listen(port, () => {
  console.log('========================================================');
  console.log(`  ACXIOMCRM Backend REST API Service running`);
  console.log(`  Port: ${port}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Health Check: http://localhost:${port}/api/health`);
  console.log('========================================================');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
});
