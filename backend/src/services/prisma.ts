import { PrismaClient } from '@prisma/client';
import net from 'net';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'test' ? [] : env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

/**
 * Checks if the PostgreSQL port is actively listening with a 150ms timeout.
 * Prevents long blocking timeouts when PostgreSQL is offline.
 */
export function isPostgresPortListening(host = '127.0.0.1', port = 5432, timeoutMs = 150): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export async function checkDatabaseConnection(): Promise<{ connected: boolean; latencyMs: number }> {
  const start = Date.now();
  const isPortUp = await isPostgresPortListening('127.0.0.1', 5432, 200);
  if (!isPortUp) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
    };
  }

  try {
    // Ping PostgreSQL using lightweight SELECT 1
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
    };
  }
}
