export type WineRepoId =
  | 'wine-staging-macos'
  | 'wine-crossover'
  | 'game-porting-toolkit'
  | 'wine-battlenet'

export interface WineRepository {
  id: WineRepoId
  name: string
  typeLabel: string
  apiUrl: string
  installCategory: 'wine' | 'game-porting-toolkit'
}

/** Mismos repos que Heroic / kalimotxo Python. */
export const MACOS_REPOSITORIES: WineRepository[] = [
  {
    // Runtime «Battle.net ready»: Wine 11 (CodeWeavers) + DXMT + D3DMetal +
    // MoltenVK del stack D4Mac. Es el único que soporta WRITECOPY y arranca el
    // cliente CEF en Apple Silicon. No tiene API pública de releases: se instala
    // desde un bundle local (ver docs/battlenet-wine-problemas-y-roadmap.md).
    id: 'wine-battlenet',
    name: 'Wine Battle.net (D4Mac)',
    typeLabel: 'Wine-BattleNet',
    apiUrl: '',
    installCategory: 'wine'
  },
  {
    id: 'wine-staging-macos',
    name: 'Wine Staging (macOS)',
    typeLabel: 'Wine-Staging-macOS',
    apiUrl: 'https://api.github.com/repos/Gcenx/macOS_Wine_builds/releases',
    installCategory: 'wine'
  },
  {
    id: 'wine-crossover',
    name: 'Wine Crossover',
    typeLabel: 'Wine-Crossover',
    apiUrl: 'https://api.github.com/repos/Heroic-Games-Launcher/wine-crossover/releases',
    installCategory: 'wine'
  },
  {
    id: 'game-porting-toolkit',
    name: 'Game Porting Toolkit',
    typeLabel: 'Game-Porting-Toolkit',
    apiUrl: 'https://api.github.com/repos/Gcenx/game-porting-toolkit/releases',
    installCategory: 'game-porting-toolkit'
  }
]

export const REPO_BY_ID = Object.fromEntries(
  MACOS_REPOSITORIES.map((r) => [r.id, r])
) as Record<WineRepoId, WineRepository>

export const REPO_BY_TYPE = Object.fromEntries(
  MACOS_REPOSITORIES.map((r) => [r.typeLabel, r])
) as Record<string, WineRepository>
