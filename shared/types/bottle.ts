export type Pairing = 'Apéro' | 'Fromage' | 'Viande rouge' | 'Poisson'

export interface Bottle {
  id: string
  name: string
  appellation: string
  region: string
  year: string
  color: 'Rouge' | 'Blanc' | 'Rosé' | 'Champagne'
  pairing: Pairing
  boughtAt: string
  tastedAt?: string
  note: string
  image: string
  consumedAt?: string
  recommendedFromId?: string
}
