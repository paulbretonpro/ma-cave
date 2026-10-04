<script setup lang="ts">
import BottleCard from './BottleCard.vue'
import BottleFormModal from './BottleFormModal.vue'
import { useBottleFilters } from '../composables/useBottleFilters'
import { useBottleToasts } from '../composables/useBottleToasts'
import { useCellarStore } from '../stores/useCellarStore'

const store = useCellarStore()
const user = useSupabaseUser()
const showImages = ref(false)
const isAddingBottle = ref(false)

const {
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
} = useBottleFilters(store.bottles, store.wishlistBottles, store.bottlesAwaitingToastDismissal)

const { markAsDrunk } = useBottleToasts(
  store.markBottleDrunk,
  store.recommendBottle,
  store.dismissBottleToast,
  (bottle) => store.wishlistBottles.value.some((item) => item.recommendedFromId === bottle.id),
)

onMounted(() => {
  void store.loadCollection()
})

function addBottle(bottle: Parameters<typeof store.addBottle>[0], destination: Parameters<typeof store.addBottle>[1]) {
  store.addBottle(bottle, destination)
  activeShelf.value = destination
}
</script>

<template>
  <main class="cellar-page">
    <UContainer class="page-content">
      <header class="topbar">
        <h1>Ma cave</h1>
        <div class="topbar-actions">
          <span v-if="user?.email" class="account-email">{{ user.email }}</span>
          <UButton color="neutral" icon="i-lucide-plus" @click="isAddingBottle = true">
            {{ activeShelf === 'wishlist' ? 'Ajouter un vin à commander' : 'Ajouter une bouteille' }}
          </UButton>
        </div>
      </header>

      <UAlert
        v-if="store.collectionError.value"
        color="error"
        variant="subtle"
        title="Un problème est survenu"
        :description="store.collectionError.value"
        class="collection-alert"
      />
      <UCard v-if="!store.isCollectionLoaded.value" class="empty-state">
        <p>{{ store.collectionError.value ? 'Votre cave n’a pas pu être chargée.' : 'Chargement de votre cave…' }}</p>
        <UButton v-if="store.collectionError.value" color="neutral" variant="outline" @click="store.loadCollection">
          Réessayer
        </UButton>
      </UCard>

      <section v-else class="collection-section" aria-labelledby="collection-title">
        <div class="collection-heading">
          <h2 id="collection-title">
            {{ activeShelf === 'cellar' ? 'Dans ma cave' : activeShelf === 'drunk' ? 'Bouteilles bues' : 'À commander' }}
          </h2>
          <div class="toolbar">
            <UInput v-model="search" icon="i-lucide-search" placeholder="Rechercher un vin" aria-label="Rechercher un vin" />
            <USelect
              v-model="activePairing"
              :items="['Tout', ...pairings]"
              aria-label="Filtrer par accord"
            />
            <USelect v-model="activeRegion" :items="regions" aria-label="Filtrer par région" />
            <UButton
              class="images-toggle"
              color="neutral"
              variant="outline"
              :icon="showImages ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-pressed="showImages"
              @click="showImages = !showImages"
            >
              {{ showImages ? 'Masquer les images' : 'Afficher les images' }}
            </UButton>
          </div>
        </div>

        <div class="shelf-tabs" aria-label="Listes de bouteilles">
          <UButton
            color="neutral"
            :variant="activeShelf === 'cellar' ? 'solid' : 'outline'"
            :aria-pressed="activeShelf === 'cellar'"
            @click="activeShelf = 'cellar'"
          >
            Dans ma cave <UBadge color="neutral" variant="subtle">{{ cellarCount }}</UBadge>
          </UButton>
          <UButton
            color="neutral"
            :variant="activeShelf === 'drunk' ? 'solid' : 'outline'"
            :aria-pressed="activeShelf === 'drunk'"
            @click="activeShelf = 'drunk'"
          >
            Bues <UBadge color="neutral" variant="subtle">{{ drunkCount }}</UBadge>
          </UButton>
          <UButton
            color="neutral"
            :variant="activeShelf === 'wishlist' ? 'solid' : 'outline'"
            :aria-pressed="activeShelf === 'wishlist'"
            @click="activeShelf = 'wishlist'"
          >
            À commander <UBadge color="neutral" variant="subtle">{{ wishlistCount }}</UBadge>
          </UButton>
        </div>

        <div v-if="filteredBottles.length" class="bottle-grid">
          <BottleCard
            v-for="bottle in filteredBottles"
            :key="bottle.id"
            :bottle="bottle"
            :shelf="activeShelf"
            :show-image="showImages"
            :already-recommended="store.wishlistBottles.value.some((item) => item.recommendedFromId === bottle.id)"
            @mark-drunk="markAsDrunk"
            @return-to-cellar="store.returnBottleToCellar"
            @recommend="store.recommendBottle"
            @add-to-cellar="store.addWishlistBottleToCellar"
          />
        </div>
        <UCard v-else class="empty-state">
          <p>
            {{
              activeShelf === 'cellar'
                ? 'Aucune bouteille dans la cave.'
                : activeShelf === 'drunk'
                  ? 'Aucune bouteille bue pour le moment.'
                  : 'Aucun vin à commander pour le moment.'
            }}
          </p>
          <UButton
            v-if="search || activePairing !== 'Tout' || activeRegion !== 'Toutes les régions'"
            color="neutral"
            variant="link"
            @click="resetFilters"
          >
            Réinitialiser les filtres
          </UButton>
        </UCard>
      </section>
    </UContainer>

    <BottleFormModal
      :open="isAddingBottle"
      :initial-destination="activeShelf"
      @update:open="isAddingBottle = $event"
      @save="addBottle"
    />
  </main>
</template>
