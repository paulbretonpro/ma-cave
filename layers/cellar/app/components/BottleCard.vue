<script setup lang="ts">
import type { Bottle } from '#shared/types/bottle'
import type { BottleShelf } from '../stores/useCellarStore'

defineProps<{
  bottle: Bottle
  shelf: BottleShelf
  showImage: boolean
  alreadyRecommended: boolean
}>()

const emit = defineEmits<{
  markDrunk: [bottle: Bottle]
  returnToCellar: [bottle: Bottle]
  recommend: [bottle: Bottle]
  addToCellar: [bottle: Bottle]
}>()

function wineColorClass(color: Bottle['color']) {
  return `wine-color-${color.toLowerCase()}`
}
</script>

<template>
  <UCard class="wine-card">
    <template v-if="showImage" #header>
      <img :src="bottle.image" :alt="`Bouteille de ${bottle.name}`" class="wine-photo" loading="lazy">
    </template>
    <p class="wine-vintage">{{ bottle.year }} · {{ bottle.appellation }} · {{ bottle.region }}</p>
    <h3>{{ bottle.name }}</h3>
    <p class="wine-origin">
      {{ shelf === 'wishlist' ? `Goûté à ${bottle.tastedAt || 'Lieu à préciser'}` : bottle.boughtAt }}
    </p>
    <p class="wine-note">{{ bottle.note }}</p>
    <p v-if="bottle.consumedAt" class="consumed-date">
      Bue le {{ new Date(bottle.consumedAt).toLocaleDateString('fr-FR') }}
    </p>
    <template #footer>
      <div class="wine-card-footer">
        <div class="wine-badges">
          <UBadge color="neutral" variant="subtle">{{ bottle.pairing }}</UBadge>
          <UBadge color="neutral" variant="subtle" :class="['wine-color-badge', wineColorClass(bottle.color)]">
            {{ bottle.color }}
          </UBadge>
        </div>
        <UButton
          v-if="shelf === 'wishlist'"
          color="neutral"
          size="sm"
          variant="ghost"
          icon="i-lucide-arrow-down-to-line"
          @click="emit('addToCellar', bottle)"
        >
          Ajouter à ma cave
        </UButton>
        <UButton
          v-else-if="shelf === 'drunk'"
          color="neutral"
          size="sm"
          :variant="alreadyRecommended ? 'outline' : 'ghost'"
          :icon="alreadyRecommended ? 'i-lucide-check' : 'i-lucide-repeat-2'"
          :disabled="alreadyRecommended"
          @click="emit('recommend', bottle)"
        >
          {{ alreadyRecommended ? 'Déjà recommandée' : 'Recommander' }}
        </UButton>
        <UButton
          v-else
          color="neutral"
          size="sm"
          :variant="bottle.consumedAt ? 'outline' : 'ghost'"
          :icon="bottle.consumedAt ? 'i-lucide-rotate-ccw' : 'i-lucide-check'"
          @click="bottle.consumedAt ? emit('returnToCellar', bottle) : emit('markDrunk', bottle)"
        >
          {{ bottle.consumedAt ? 'Remettre en cave' : 'Marquer comme bue' }}
        </UButton>
      </div>
    </template>
  </UCard>
</template>
