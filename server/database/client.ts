import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let sqlClient: ReturnType<typeof postgres> | undefined
let database: PostgresJsDatabase<typeof schema> | undefined

export function useDatabase() {
  if (database) return database

  const { databaseUrl } = useRuntimeConfig()
  if (!databaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'La variable serveur NUXT_DATABASE_URL n’est pas configurée.',
    })
  }

  sqlClient = postgres(databaseUrl, { max: 5, prepare: false })
  database = drizzle(sqlClient, { schema })
  return database
}
