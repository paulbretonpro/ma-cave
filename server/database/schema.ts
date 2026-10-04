import { check, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const bottles = pgTable('bottles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  appellation: text('appellation').notNull(),
  region: text('region').notNull(),
  year: text('year').notNull(),
  color: text('color').notNull(),
  pairing: text('pairing').notNull(),
  boughtAt: text('bought_at').notNull(),
  tastedAt: text('tasted_at'),
  note: text('note').notNull(),
  image: text('image').notNull(),
})

export const userBottles = pgTable('user_bottles', {
  userId: uuid('user_id').notNull(),
  bottleId: uuid('bottle_id').notNull().references(() => bottles.id, { onDelete: 'cascade' }),
  shelf: text('shelf').notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  recommendedFromBottleId: uuid('recommended_from_bottle_id').references(() => bottles.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.bottleId] }),
  check('user_bottles_shelf_check', sql`${table.shelf} in ('cellar', 'drunk', 'wishlist')`),
])
