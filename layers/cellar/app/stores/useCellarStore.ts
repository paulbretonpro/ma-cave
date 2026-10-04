import type { Bottle } from '#shared/types/bottle'
import { sampleBottles } from '../data/sample-bottles'
import { migrateLocalBottleLists, parseBottleList } from '../utils/collection'

export type BottleShelf = 'cellar' | 'drunk' | 'wishlist'
export type BottleDestination = BottleShelf

async function writeCollection(cellarBottles: Bottle[], wishlist: Bottle[]) {
  await $fetch('/api/collection', {
    method: 'PUT',
    body: { bottles: cellarBottles, wishlistBottles: wishlist },
  })
}

export function useCellarStore() {
  const bottles = useState<Bottle[]>('cellar:bottles', () => [...sampleBottles])
  const wishlistBottles = useState<Bottle[]>('cellar:wishlist', () => [])
  const bottlesAwaitingToastDismissal = useState<string[]>('cellar:pending-toast-bottles', () => [])
  const isCollectionLoaded = useState('cellar:is-loaded', () => false)
  const collectionError = useState('cellar:error', () => '')
  const syncWatcherInstalled = useState('cellar:sync-watcher-installed', () => false)
  const user = useSupabaseUser()
  let saveQueue = Promise.resolve()

  if (import.meta.client && !syncWatcherInstalled.value) {
    syncWatcherInstalled.value = true
    watch([bottles, wishlistBottles], ([cellarBottles, wishlist]) => {
      if (!isCollectionLoaded.value || !user.value?.sub) return

      saveQueue = saveQueue
        .then(() => writeCollection(cellarBottles, wishlist))
        .then(() => {
          collectionError.value = ''
        })
        .catch((error: unknown) => {
          console.error('Impossible d’enregistrer la cave Supabase.', error)
          collectionError.value = error instanceof Error
            ? `La sauvegarde a échoué : ${error.message}`
            : 'La sauvegarde de la cave a échoué. Vérifiez votre connexion.'
        })
    }, { deep: true })
  }

  async function loadCollection() {
    if (!user.value?.sub) {
      collectionError.value = 'Votre session n’est pas disponible. Reconnectez-vous pour charger votre cave.'
      return
    }

    isCollectionLoaded.value = false
    collectionError.value = ''

    try {
      const data = await $fetch('/api/collection')

      if (data) {
        bottles.value = parseBottleList(data.bottles)
        wishlistBottles.value = parseBottleList(data.wishlistBottles)
      } else {
        const savedBottles = localStorage.getItem('ma-cave-a-vin')
        const savedWishlist = localStorage.getItem('ma-cave-a-vin-a-commander')
        if (savedBottles || savedWishlist) {
          const migrated = migrateLocalBottleLists(
            savedBottles ? JSON.parse(savedBottles) : bottles.value,
            savedWishlist ? JSON.parse(savedWishlist) : wishlistBottles.value,
          )
          bottles.value = migrated.bottles
          wishlistBottles.value = migrated.wishlistBottles
        }
        await writeCollection(bottles.value, wishlistBottles.value)
      }

      isCollectionLoaded.value = true
    } catch (error) {
      console.error('Impossible de charger ou de migrer la cave Supabase.', error)
      collectionError.value = error instanceof Error
        ? `Impossible de charger la cave : ${error.message}`
        : 'Impossible de charger la cave. Vérifiez la configuration Supabase et réessayez.'
    }
  }

  function addBottle(bottle: Bottle, destination: BottleDestination) {
    if (destination === 'wishlist') wishlistBottles.value.unshift(bottle)
    else bottles.value.unshift(bottle)
  }

  function markBottleDrunk(bottle: Bottle) {
    bottle.consumedAt = new Date().toISOString()
    if (!bottlesAwaitingToastDismissal.value.includes(bottle.id)) {
      bottlesAwaitingToastDismissal.value.push(bottle.id)
    }
  }

  function dismissBottleToast(bottleId: string) {
    bottlesAwaitingToastDismissal.value = bottlesAwaitingToastDismissal.value.filter((id) => id !== bottleId)
  }

  function returnBottleToCellar(bottle: Bottle) {
    delete bottle.consumedAt
  }

  function recommendBottle(bottle: Bottle) {
    if (wishlistBottles.value.some((item) => item.recommendedFromId === bottle.id)) return

    const wine = { ...bottle }
    delete wine.consumedAt
    wishlistBottles.value.unshift({
      ...wine,
      id: crypto.randomUUID(),
      recommendedFromId: bottle.id,
      tastedAt: 'Ma cave',
    })
  }

  function addWishlistBottleToCellar(bottle: Bottle) {
    const cellarBottle = { ...bottle }
    delete cellarBottle.consumedAt
    bottles.value.unshift({ ...cellarBottle, id: crypto.randomUUID() })
    wishlistBottles.value = wishlistBottles.value.filter((item) => item.id !== bottle.id)
  }

  return {
    bottles,
    wishlistBottles,
    bottlesAwaitingToastDismissal,
    isCollectionLoaded,
    collectionError,
    loadCollection,
    addBottle,
    markBottleDrunk,
    dismissBottleToast,
    returnBottleToCellar,
    recommendBottle,
    addWishlistBottleToCellar,
  }
}
