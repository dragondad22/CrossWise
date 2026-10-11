import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Only migrate/status need a database; `prisma generate` (postinstall) runs without one.
  datasource: { url: process.env.DATABASE_URL ?? '' },
})
