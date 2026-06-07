import type { StoreDefinition } from 'common/types/store'

export const STORES: StoreDefinition[] = [
  {
    id: 'battlenet',
    name: 'Battle.net',
    tagline: 'Blizzard — WoW, Diablo, Overwatch y más',
    availability: 'available',
    route: '/store/battlenet',
    gradient: 'linear-gradient(135deg, #0d1f3c 0%, #1a4a8a 45%, #00aeff 100%)',
    accentColor: '#00aeff',
    games: ['World of Warcraft', 'Diablo IV', 'Overwatch', 'Hearthstone']
  },
  {
    id: 'epic',
    name: 'Epic Games',
    tagline: 'Epic Games Store y exclusivos',
    availability: 'coming_soon',
    route: '/store/epic',
    gradient: 'linear-gradient(135deg, #1a1028 0%, #2d1b4e 50%, #7b5cff 100%)',
    accentColor: '#7b5cff',
    games: ['Fortnite', 'Rocket League', 'Exclusivos Epic']
  },
  {
    id: 'steam',
    name: 'Steam',
    tagline: 'La biblioteca más grande de PC',
    availability: 'coming_soon',
    route: '/store/steam',
    gradient: 'linear-gradient(135deg, #0b1622 0%, #1b2838 55%, #66c0f4 100%)',
    accentColor: '#66c0f4',
    games: ['Steam Deck', 'Workshop', 'Proton']
  },
  {
    id: 'gog',
    name: 'GOG',
    tagline: 'Juegos DRM-free de GOG.com',
    availability: 'planned',
    route: '/store/gog',
    gradient: 'linear-gradient(135deg, #1a1020 0%, #3d1f4a 50%, #b07cff 100%)',
    accentColor: '#b07cff',
    games: ['CD Projekt', 'Clásicos', 'Sin DRM']
  },
  {
    id: 'amazon',
    name: 'Amazon Games',
    tagline: 'Prime Gaming y títulos Amazon',
    availability: 'planned',
    route: '/store/amazon',
    gradient: 'linear-gradient(135deg, #0f1419 0%, #232f3e 50%, #ff9900 100%)',
    accentColor: '#ff9900',
    games: ['New World', 'Prime Gaming']
  }
]

export function getStore(id: string): StoreDefinition | undefined {
  return STORES.find((s) => s.id === id)
}

export function getAvailableStores(): StoreDefinition[] {
  return STORES.filter((s) => s.availability === 'available')
}

export function getFeaturedStore(): StoreDefinition {
  return STORES.find((s) => s.id === 'battlenet') ?? STORES[0]
}
