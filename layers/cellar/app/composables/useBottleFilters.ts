import type { Bottle, Pairing } from '#shared/types/bottle'
import type { BottleShelf } from '../stores/useCellarStore'

const pairings: Pairing[] = ['Apéro', 'Fromage', 'Viande rouge', 'Poisson']

export function useBottleFilters(
  bottles: Ref<Bottle[]>,
  wishlistBottles: Ref<Bottle[]>,
  pendingToastBottleIds: Ref<string[]>,
) {
  const activePairing = ref<Pairing | 'Tout'>('Tout')
  const activeRegion = ref('Toutes les régions')
  const activeShelf = ref<BottleShelf>('cellar')
  const search = ref('')

  const regions = computed(() => [
    'Toutes les régions',
    ...new Set([...bottles.value, ...wishlistBottles.value]
      .map((bottle) => bottle.region)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'fr'))),
  ])

  const cellarCount = computed(() => bottles.value.filter((bottle) => !bottle.consumedAt).length)
  const drunkCount = computed(() => bottles.value.length - cellarCount.value)
  const wishlistCount = computed(() => wishlistBottles.value.length)
  const activeBottles = computed(() => {
    if (activeShelf.value === 'wishlist') return wishlistBottles.value
    return bottles.value.filter((bottle) => {
      if (activeShelf.value === 'drunk') return !!bottle.consumedAt
      return !bottle.consumedAt || pendingToastBottleIds.value.includes(bottle.id)
    })
  })

  const filteredBottles = computed(() => {
    const query = search.value.trim().toLocaleLowerCase('fr')
    return activeBottles.value.filter((bottle) => {
      const matchesPairing = activePairing.value === 'Tout' || bottle.pairing === activePairing.value
      const matchesRegion = activeRegion.value === 'Toutes les régions' || bottle.region === activeRegion.value
      const searchable = `${bottle.name} ${bottle.appellation} ${bottle.region} ${bottle.boughtAt} ${bottle.tastedAt ?? ''} ${bottle.year}`.toLocaleLowerCase('fr')
      return matchesPairing && matchesRegion && (!query || searchable.includes(query))
    })
  })

  function resetFilters() {
    activePairing.value = 'Tout'
    activeRegion.value = 'Toutes les régions'
    search.value = ''
  }

  return {
    pairings,
    activePairing,
    activeRegion,
    activeShelf,
    search,
    regions,
    cellarCount,
    drunkCount,
    wishlistCount,
    filteredBottles,
    resetFilters,
  }
}
