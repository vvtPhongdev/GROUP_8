import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

type PrismaLogLevel = 'query' | 'warn' | 'error';

const isAccelerateUrl = (url?: string) => Boolean(url && url.startsWith('prisma://'));

export const getAccelerateClientOptions = () => {
  const log: PrismaLogLevel[] =
    process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['warn', 'error'];

  if (isAccelerateUrl(process.env.DATABASE_URL)) {
    return {
      accelerateUrl: process.env.DATABASE_URL || '',
      log,
    };
  }

  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/works_reruiter?schema=public',
  });
  const adapter = new PrismaPg(pool);

  return {
    adapter,
    log,
  };
};

export const getPrismaClientOptions = getAccelerateClientOptions;

/**
 * The application-wide Prisma client. Every runtime client uses the Accelerate
 * URL when configured, or standard direct PostgreSQL connection when running locally.
 */
export const createAcceleratedPrismaClient = (): PrismaClient => {
  const client = new PrismaClient(getAccelerateClientOptions() as any);
  if (isAccelerateUrl(process.env.DATABASE_URL)) {
    return client.$extends(withAccelerate()) as unknown as PrismaClient;
  }
  return client;
};

export type AcceleratedPrismaClient = PrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma client.
 * In development, reuses the same instance across hot-reloads.
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  createAcceleratedPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
export * from '@prisma/client';
export * from './audit-log.service';
