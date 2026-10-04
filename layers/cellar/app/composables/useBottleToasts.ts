import type { Bottle } from '#shared/types/bottle'

export function useBottleToasts(
  markBottleDrunk: (bottle: Bottle) => void,
  recommendBottle: (bottle: Bottle) => void,
  dismissBottleToast: (bottleId: string) => void,
  isAlreadyRecommended: (bottle: Bottle) => boolean,
) {
  const toast = useToast()
  const pendingBottleToasts = new Map<string | number, { bottleId: string; appeared: boolean }>()

  watch(() => toast.toasts.value.map(({ id }) => id), (visibleToastIds) => {
    for (const [toastId, pending] of pendingBottleToasts) {
      if (visibleToastIds.includes(toastId)) {
        pending.appeared = true
      } else if (pending.appeared) {
        pendingBottleToasts.delete(toastId)
        dismissBottleToast(pending.bottleId)
      }
    }
  })

  function markAsDrunk(bottle: Bottle) {
    markBottleDrunk(bottle)
    const alreadyRecommended = isAlreadyRecommended(bottle)
    let toastId: string | number
    toastId = toast.add({
      title: 'Bouteille marquée comme bue',
      description: bottle.name,
      duration: 8000,
      actions: [{
        label: alreadyRecommended ? 'Déjà recommandée' : 'À recommander',
        icon: alreadyRecommended ? 'i-lucide-check' : 'i-lucide-repeat-2',
        disabled: alreadyRecommended,
        onClick: () => {
          recommendBottle(bottle)
          toast.remove(toastId)
        },
      }],
    }).id
    pendingBottleToasts.set(toastId, { bottleId: bottle.id, appeared: false })
  }

  return { markAsDrunk }
}
