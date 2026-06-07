import { existsSync } from 'fs'
import { execSync, spawnSync } from 'child_process'

import { getBottlePath } from '../bottle'
import { WINE_DIR } from '../config/paths'
import { findWine64InTree } from './manager/installed'
import { loadCatalog } from './manager/catalog'
import {
  getCrossoverInstallations,
  getRuntimeWineInstallation
} from './compatibilityLayers'
import type { WineInstallation } from './types'

function wineserverPath(installation: WineInstallation): string | null {
  const ws =
    installation.wineserver ??
    installation.bin.replace(/wine64?$/, 'wineserver')
  return ws && existsSync(ws) ? ws : null
}

/** Todos los wineserver instalados (CrossOver, Wine-Crossover, legacy, etc.). */
export function collectWineserverPaths(): string[] {
  const paths = new Set<string>()
  const add = (installation: WineInstallation | null): void => {
    const ws = installation ? wineserverPath(installation) : null
    if (ws) paths.add(ws)
  }

  add(getRuntimeWineInstallation())
  for (const cx of getCrossoverInstallations()) add(cx)
  for (const rel of loadCatalog()) {
    if (!rel.is_installed) continue
    if (!rel.install_dir) continue
    const wine64 = findWine64InTree(rel.install_dir)
    if (!wine64) continue
    const ws = wine64.replace(/wine64?$/, 'wineserver')
    if (existsSync(ws)) paths.add(ws)
  }
  const legacy = findWine64InTree(WINE_DIR)
  if (legacy) {
    const ws = legacy.replace(/wine64?$/, 'wineserver')
    if (existsSync(ws)) paths.add(ws)
  }

  return [...paths]
}

/**
 * Mata wineserver del prefix con cada binario conocido (tras cambiar de Wine-Staging a
 * Wine-Crossover el servidor viejo suele quedar en 768 y el cliente en 932).
 */
export function killWineServersForEnv(env: NodeJS.ProcessEnv, bottlePrefix?: string): void {
  for (const ws of collectWineserverPaths()) {
    try {
      spawnSync(ws, ['-k'], { env, timeout: 12_000 })
    } catch {
      /* ignore */
    }
  }

  if (bottlePrefix) {
    try {
      execSync(`pkill -9 -f "${bottlePrefix.replace(/"/g, '\\"')}"`, { timeout: 5000 })
    } catch {
      /* ignore */
    }
  }

  try {
    spawnSync('pkill', ['-9', 'wineserver'], { timeout: 5000 })
  } catch {
    /* ignore */
  }
}

export function killWineServersForBottle(
  bottleName: string,
  env: NodeJS.ProcessEnv
): void {
  killWineServersForEnv(env, getBottlePath(bottleName))
}
