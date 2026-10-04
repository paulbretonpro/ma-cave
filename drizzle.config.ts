import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/database/schema.ts',
  schemaFilter: ['public'],
  out: './drizzle',
  dbCredentials: {
    url: process.env.NUXT_DATABASE_URL ?? '',
  },
})
