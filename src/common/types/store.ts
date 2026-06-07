/** Identificadores de plataformas soportadas o planificadas. */
export type StoreId = 'battlenet' | 'epic' | 'steam' | 'gog' | 'amazon'

export type StoreAvailability = 'available' | 'coming_soon' | 'planned'

export interface StoreDefinition {
  id: StoreId
  name: string
  tagline: string
  availability: StoreAvailability
  /** Ruta interna de la app (`/store/battlenet`). */
  route: string
  /** Gradiente CSS para hero / tarjeta (sin logos de marca). */
  gradient: string
  accentColor: string
  games: string[]
}
