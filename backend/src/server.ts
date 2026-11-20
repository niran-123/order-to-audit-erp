import { createApp } from './app';
import { env } from './config/env';
import { checkDatabaseConnection } from './services/prisma';

const app = createApp();

const server = app.listen(env.PORT, '0.0.0.0', async () => {
  console.log(`[ERP-BACKEND] Server initialized in ${env.NODE_ENV} mode.`);
  console.log(`[ERP-BACKEND] Listening on port: ${env.PORT} -> http://localhost:${env.PORT}`);

  // Test database connection at startup
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.connected) {
    console.log(`[ERP-BACKEND] PostgreSQL connected successfully (${dbHealth.latencyMs}ms latency).`);
  } else {
    console.warn(`[ERP-BACKEND] PostgreSQL connection not yet ready. Retry on request.`);
  }
});

// Process Life-Cycle & Graceful Shutdown
function handleShutdown(signal: string) {
  console.log(`[ERP-BACKEND] ${signal} signal received. Initiating graceful shutdown...`);
  server.close(() => {
    console.log('[ERP-BACKEND] HTTP server closed cleanly. Exiting process.');
    process.exit(0);
  });

  // Force close after 10s timeout
  setTimeout(() => {
    console.error('[ERP-BACKEND] Forcefully terminating server after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[ERP-BACKEND] CRITICAL: Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('[ERP-BACKEND] CRITICAL: Uncaught Exception:', error);
  handleShutdown('UNCAUGHT_EXCEPTION');
});
