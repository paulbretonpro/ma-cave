export function useBottlePhoto() {
  const photoPreview = ref('')
  const fileInput = ref<HTMLInputElement>()

  function selectPhoto() {
    fileInput.value?.click()
  }

  async function onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      window.alert('Choisissez un fichier image.')
      input.value = ''
      return
    }

    let bitmap: ImageBitmap | undefined
    try {
      bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Le navigateur ne peut pas traiter cette image.')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      photoPreview.value = canvas.toDataURL('image/jpeg', 0.82)
    } catch (error) {
      console.error('La photo n’a pas pu être chargée.', error)
      window.alert('La photo n’a pas pu être chargée.')
    } finally {
      bitmap?.close()
      input.value = ''
    }
  }

  return { photoPreview, fileInput, selectPhoto, onPhotoSelected }
}
