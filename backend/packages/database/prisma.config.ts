import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed-runner.cjs',
  },
  datasource: {
    url: process.env['DIRECT_DATABASE_URL'] ?? process.env['DATABASE_URL'] ?? '',
  },
});

