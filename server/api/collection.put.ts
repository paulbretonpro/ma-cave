import { and, eq, inArray, notExists, sql } from 'drizzle-orm'
import type { Bottle } from '#shared/types/bottle'
import { getAuthenticatedUserId } from '../utils/authenticated-user'
import { useDatabase } from '../database/client'
import { bottles, userBottles } from '../database/schema'

function isBottleArray(value: unknown): value is Bottle[] {
  if (!Array.isArray(value)) return false

  return value.every((bottle: unknown) => {
    if (!bottle || typeof bottle !== 'object' || Array.isArray(bottle)) return false

    const item = bottle as Partial<Bottle>
    return typeof item.id === 'string'
      && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id)
      && typeof item.name === 'string'
      && typeof item.appellation === 'string'
      && typeof item.region === 'string'
      && typeof item.year === 'string'
      && ['Rouge', 'Blanc', 'Rosé', 'Champagne'].includes(item.color ?? '')
      && ['Apéro', 'Fromage', 'Viande rouge', 'Poisson'].includes(item.pairing ?? '')
      && typeof item.boughtAt === 'string'
      && (item.tastedAt === undefined || typeof item.tastedAt === 'string')
      && typeof item.note === 'string'
      && typeof item.image === 'string'
      && (item.consumedAt === undefined || (typeof item.consumedAt === 'string' && !Number.isNaN(Date.parse(item.consumedAt))))
      && (item.recommendedFromId === undefined || typeof item.recommendedFromId === 'string')
  })
}

export default defineEventHandler(async (event) => {
  const userId = await getAuthenticatedUserId(event)
  const body: unknown = await readBody(event)

  if (
    !body
    || typeof body !== 'object'
    || !('bottles' in body)
    || !('wishlistBottles' in body)
    || !isBottleArray(body.bottles)
    || !isBottleArray(body.wishlistBottles)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Les listes de bouteilles envoyées sont invalides.',
    })
  }

  const cellarBottles = body.bottles
  const wishlist = body.wishlistBottles
  const desiredBottles = [...cellarBottles, ...wishlist]
  const desiredIds = desiredBottles.map((bottle) => bottle.id)
  if (new Set(desiredIds).size !== desiredIds.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Une bouteille ne peut apparaître que dans une seule liste.',
    })
  }

  const desiredIdSet = new Set(desiredIds)
  if (desiredBottles.some((bottle) => bottle.recommendedFromId && !desiredIdSet.has(bottle.recommendedFromId))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Une recommandation doit référencer une bouteille appartenant à la même cave.',
    })
  }

  return await useDatabase().transaction(async (transaction) => {
    const ownedRows = await transaction
      .select({ bottleId: userBottles.bottleId })
      .from(userBottles)
      .where(eq(userBottles.userId, userId))
    const ownedIds = new Set(ownedRows.map(({ bottleId }) => bottleId))

    if (desiredIds.length) {
      const existingRows = await transaction
        .select({ id: bottles.id })
        .from(bottles)
        .where(inArray(bottles.id, desiredIds))
      if (existingRows.some(({ id }) => !ownedIds.has(id))) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Une bouteille envoyée appartient déjà à une autre cave.',
        })
      }
    }

    const bottleValues = desiredBottles.map((bottle) => ({
      id: bottle.id,
      name: bottle.name,
      appellation: bottle.appellation,
      region: bottle.region,
      year: bottle.year,
      color: bottle.color,
      pairing: bottle.pairing,
      boughtAt: bottle.boughtAt,
      tastedAt: bottle.tastedAt ?? null,
      note: bottle.note,
      image: bottle.image,
    }))

    if (bottleValues.length) {
      await transaction
        .insert(bottles)
        .values(bottleValues)
        .onConflictDoUpdate({
          target: bottles.id,
          set: {
            name: sql`excluded.name`,
            appellation: sql`excluded.appellation`,
            region: sql`excluded.region`,
            year: sql`excluded.year`,
            color: sql`excluded.color`,
            pairing: sql`excluded.pairing`,
            boughtAt: sql`excluded.bought_at`,
            tastedAt: sql`excluded.tasted_at`,
            note: sql`excluded.note`,
            image: sql`excluded.image`,
          },
        })
    }

    const obsoleteIds = ownedRows
      .map(({ bottleId }) => bottleId)
      .filter((bottleId) => !desiredIdSet.has(bottleId))

    await transaction.delete(userBottles).where(eq(userBottles.userId, userId))

    const associationValues = [
      ...cellarBottles.map((bottle) => ({
        userId,
        bottleId: bottle.id,
        shelf: bottle.consumedAt ? 'drunk' : 'cellar',
        consumedAt: bottle.consumedAt ? new Date(bottle.consumedAt) : null,
        recommendedFromBottleId: bottle.recommendedFromId ?? null,
        updatedAt: new Date(),
      })),
      ...wishlist.map((bottle) => ({
        userId,
        bottleId: bottle.id,
        shelf: 'wishlist',
        consumedAt: null,
        recommendedFromBottleId: bottle.recommendedFromId ?? null,
        updatedAt: new Date(),
      })),
    ]
    if (associationValues.length) await transaction.insert(userBottles).values(associationValues)

    if (obsoleteIds.length) {
      await transaction
        .delete(bottles)
        .where(and(
          inArray(bottles.id, obsoleteIds),
          notExists(
            transaction
              .select({ bottleId: userBottles.bottleId })
              .from(userBottles)
              .where(eq(userBottles.bottleId, bottles.id)),
          ),
        ))
    }

    return { bottles: cellarBottles, wishlistBottles: wishlist }
  })
})
