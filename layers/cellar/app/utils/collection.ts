import type { Bottle, Pairing } from '#shared/types/bottle'

const pairings: Pairing[] = ['Apéro', 'Fromage', 'Viande rouge', 'Poisson']
const bottleColors: Bottle['color'][] = ['Rouge', 'Blanc', 'Rosé', 'Champagne']
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function parseBottleList(value: unknown): Bottle[] {
  if (!Array.isArray(value)) throw new Error('Le format de la liste de bouteilles est invalide.')

  return value.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('Une bouteille enregistrée est invalide.')
    }

    const bottle = entry as Partial<Bottle>
    if (
      typeof bottle.id !== 'string'
      || !uuidPattern.test(bottle.id)
      || typeof bottle.name !== 'string'
      || typeof bottle.appellation !== 'string'
      || typeof bottle.year !== 'string'
      || typeof bottle.color !== 'string'
      || !bottleColors.includes(bottle.color as Bottle['color'])
      || typeof bottle.pairing !== 'string'
      || !pairings.includes(bottle.pairing as Pairing)
      || typeof bottle.boughtAt !== 'string'
      || typeof bottle.note !== 'string'
      || typeof bottle.image !== 'string'
      || (bottle.region !== undefined && typeof bottle.region !== 'string')
    ) {
      throw new Error('Une bouteille enregistrée contient des informations invalides.')
    }

    if (bottle.region) return bottle as Bottle

    const appellationParts = bottle.appellation.split(' · ')
    const region = appellationParts.length > 1 ? appellationParts.pop()! : 'Région à préciser'
    return {
      ...bottle,
      appellation: appellationParts.join(' · ') || bottle.appellation,
      region,
    } as Bottle
  })
}

export function migrateLocalBottleLists(cellarValue: unknown, wishlistValue: unknown) {
  if (!Array.isArray(cellarValue) || !Array.isArray(wishlistValue)) {
    throw new Error('Le format des listes locales de bouteilles est invalide.')
  }

  const legacyIds = new Map<string, string>()
  for (const entry of [...cellarValue, ...wishlistValue]) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const bottle = entry as Partial<Bottle> & { id?: number | string }
    if (typeof bottle.id === 'string' || (typeof bottle.id === 'number' && Number.isFinite(bottle.id))) {
      const legacyId = String(bottle.id)
      if (!legacyIds.has(legacyId)) legacyIds.set(legacyId, crypto.randomUUID())
    }
  }

  const convert = (value: unknown) => {
    if (!Array.isArray(value)) throw new Error('Le format de la liste de bouteilles locale est invalide.')
    return value.map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error('Une bouteille locale est invalide.')
      }
      const bottle = entry as Partial<Bottle> & { id?: number | string; recommendedFromId?: number | string }
      const id = typeof bottle.id === 'string' || typeof bottle.id === 'number'
        ? legacyIds.get(String(bottle.id))
        : undefined
      if (!id) throw new Error('Une bouteille locale n’a pas d’identifiant valide.')
      const recommendedFromId = bottle.recommendedFromId === undefined
        ? undefined
        : legacyIds.get(String(bottle.recommendedFromId))
      return { ...bottle, id, recommendedFromId }
    })
  }

  return {
    bottles: parseBottleList(convert(cellarValue)),
    wishlistBottles: parseBottleList(convert(wishlistValue)),
  }
}
