import { eq } from 'drizzle-orm'
import { getAuthenticatedUserId } from '../utils/authenticated-user'
import { useDatabase } from '../database/client'
import { bottles, userBottles } from '../database/schema'

export default defineEventHandler(async (event) => {
  const userId = await getAuthenticatedUserId(event)
  const rows = await useDatabase()
    .select({
      id: bottles.id,
      name: bottles.name,
      appellation: bottles.appellation,
      region: bottles.region,
      year: bottles.year,
      color: bottles.color,
      pairing: bottles.pairing,
      boughtAt: bottles.boughtAt,
      tastedAt: bottles.tastedAt,
      note: bottles.note,
      image: bottles.image,
      shelf: userBottles.shelf,
      consumedAt: userBottles.consumedAt,
      recommendedFromId: userBottles.recommendedFromBottleId,
    })
    .from(userBottles)
    .innerJoin(bottles, eq(userBottles.bottleId, bottles.id))
    .where(eq(userBottles.userId, userId))

  if (rows.length === 0) return null

  const cellarBottles = []
  const wishlistBottles = []

  for (const row of rows) {
    const bottle = {
      id: row.id,
      name: row.name,
      appellation: row.appellation,
      region: row.region,
      year: row.year,
      color: row.color as 'Rouge' | 'Blanc' | 'Rosé' | 'Champagne',
      pairing: row.pairing as 'Apéro' | 'Fromage' | 'Viande rouge' | 'Poisson',
      boughtAt: row.boughtAt,
      tastedAt: row.tastedAt ?? undefined,
      note: row.note,
      image: row.image,
      consumedAt: row.consumedAt?.toISOString(),
      recommendedFromId: row.recommendedFromId ?? undefined,
    }
    if (row.shelf === 'wishlist') wishlistBottles.push(bottle)
    else if (row.shelf === 'cellar' || row.shelf === 'drunk') cellarBottles.push(bottle)
  }

  return { bottles: cellarBottles, wishlistBottles }
})
