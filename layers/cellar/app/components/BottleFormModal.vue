<script setup lang="ts">
import type { Bottle, Pairing } from '#shared/types/bottle'
import type { BottleDestination } from '../stores/useCellarStore'
import { useBottlePhoto } from '../composables/useBottlePhoto'

const props = defineProps<{
  open: boolean
  initialDestination: BottleDestination
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  save: [bottle: Bottle, destination: BottleDestination]
}>()

const pairings: Pairing[] = ['Apéro', 'Fromage', 'Viande rouge', 'Poisson']
const addDestination = ref<BottleDestination>('cellar')
const newBottle = reactive({
  name: '',
  appellation: '',
  region: '',
  year: '',
  color: 'Rouge' as Bottle['color'],
  pairing: 'Apéro' as Pairing,
  boughtAt: '',
  tastedAt: '',
  note: '',
})
const { photoPreview, fileInput, selectPhoto, onPhotoSelected } = useBottlePhoto()

watch(() => props.open, (isOpen) => {
  if (isOpen) resetForm()
})

function resetForm() {
  addDestination.value = props.initialDestination
  photoPreview.value = ''
  Object.assign(newBottle, {
    name: '',
    appellation: '',
    region: '',
    year: '',
    color: 'Rouge',
    pairing: 'Apéro',
    boughtAt: '',
    tastedAt: '',
    note: '',
  })
}

function closeForm() {
  emit('update:open', false)
  resetForm()
}

function saveBottle() {
  const bottle: Bottle = {
    ...newBottle,
    id: crypto.randomUUID(),
    appellation: newBottle.appellation || 'Appellation à préciser',
    region: newBottle.region || 'Région à préciser',
    year: newBottle.year || 'NV',
    boughtAt: addDestination.value === 'wishlist'
      ? 'Lieu d’achat à préciser'
      : newBottle.boughtAt || 'Lieu d’achat à préciser',
    tastedAt: addDestination.value === 'wishlist' ? newBottle.tastedAt || 'Lieu à préciser' : undefined,
    consumedAt: addDestination.value === 'drunk' ? new Date().toISOString() : undefined,
    note: newBottle.note || 'Aucun commentaire pour le moment.',
    image: photoPreview.value || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=85',
  }
  emit('save', bottle, addDestination.value)
  closeForm()
}
</script>

<template>
  <UModal :open="open" title="Ajouter un vin" @update:open="emit('update:open', $event)">
    <template #body>
      <form class="bottle-form" @submit.prevent="saveBottle">
        <div class="form-fields">
          <UFormField label="Ajouter dans">
            <USelect
              v-model="addDestination"
              :items="[
                { label: 'Dans ma cave', value: 'cellar' },
                { label: 'Bues', value: 'drunk' },
                { label: 'À commander', value: 'wishlist' },
              ]"
              class="w-full"
            />
          </UFormField>
          <div class="photo-field">
            <img v-if="photoPreview" :src="photoPreview" alt="Aperçu de la photo" class="photo-preview">
            <UButton type="button" color="neutral" variant="outline" icon="i-lucide-image" block @click="selectPhoto">
              {{ photoPreview ? 'Changer la photo' : 'Ajouter une photo' }}
            </UButton>
            <input ref="fileInput" class="visually-hidden" type="file" accept="image/*" @change="onPhotoSelected">
          </div>
          <UFormField label="Nom du vin" required>
            <UInput v-model.trim="newBottle.name" required maxlength="80" placeholder="Ex. Château La Coste" class="w-full" />
          </UFormField>
          <div class="form-row">
            <UFormField label="Appellation">
              <UInput v-model.trim="newBottle.appellation" maxlength="80" placeholder="Ex. Côtes de Provence" class="w-full" />
            </UFormField>
            <UFormField label="Millésime">
              <UInput v-model.trim="newBottle.year" maxlength="8" placeholder="2022" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Région">
            <UInput v-model.trim="newBottle.region" maxlength="60" placeholder="Bourgogne, Bordeaux, Côte du Rhône..." class="w-full" />
          </UFormField>
          <div class="form-row">
            <UFormField label="Couleur">
              <USelect v-model="newBottle.color" :items="['Rouge', 'Blanc', 'Rosé', 'Champagne']" class="w-full" />
            </UFormField>
            <UFormField label="À déguster avec">
              <USelect v-model="newBottle.pairing" :items="pairings" class="w-full" />
            </UFormField>
          </div>
          <UFormField v-if="addDestination !== 'wishlist'" label="Lieu d’achat">
            <UInput
              v-model.trim="newBottle.boughtAt"
              maxlength="100"
              placeholder="Caviste, domaine, ville..."
              class="w-full"
            />
          </UFormField>
          <UFormField v-else label="Où l’avez-vous goûté ?">
            <UInput
              v-model.trim="newBottle.tastedAt"
              maxlength="100"
              placeholder="Restaurant, chez des amis, ville..."
              class="w-full"
            />
          </UFormField>
          <UFormField label="Commentaire">
            <UTextarea v-model.trim="newBottle.note" maxlength="240" :rows="3" placeholder="Note de dégustation ou souvenir..." class="w-full" />
          </UFormField>
        </div>
        <div class="modal-actions">
          <UButton type="button" color="neutral" variant="ghost" @click="closeForm">Annuler</UButton>
          <UButton type="submit" color="neutral" icon="i-lucide-check">Enregistrer</UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>
