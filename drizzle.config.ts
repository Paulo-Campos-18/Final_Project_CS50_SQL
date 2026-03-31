import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/infra/database/schema.ts',
  out: './src/infra/database/migrations',
  dbCredentials: {
    url: 'store.db',
  },
  verbose: true,
  strict: true,
});
