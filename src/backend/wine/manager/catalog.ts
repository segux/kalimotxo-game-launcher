import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname } from 'path'

import { WINE_RELEASES_PATH, loadGlobalConfig, saveGlobalConfig } from '../../config/paths'
import type { WineRelease } from './types'

export function loadCatalog(): WineRelease[] {
  try {
    const data = JSON.parse(readFileSync(WINE_RELEASES_PATH, 'utf-8'))
    return Array.isArray(data) ? (data as WineRelease[]) : []
  } catch {
    return []
  }
}

export function saveCatalog(releases: WineRelease[]): void {
  mkdirSync(dirname(WINE_RELEASES_PATH), { recursive: true })
  writeFileSync(WINE_RELEASES_PATH, JSON.stringify(releases, null, 2) + '\n', 'utf-8')
}

export function findRelease(version: string): WineRelease | null {
  return loadCatalog().find((r) => r.version === version) ?? null
}

export function getActiveVersionId(): string | null {
  const cfg = loadGlobalConfig()
  const v = cfg.active_wine_version
  return v ? String(v) : null
}

export function setActiveVersionId(version: string | null): void {
  const cfg = loadGlobalConfig()
  if (version) cfg.active_wine_version = version
  else delete cfg.active_wine_version
  saveGlobalConfig(cfg)
}

export function getInstalledFromCatalog(): WineRelease[] {
  return loadCatalog().filter((r) => r.is_installed)
}
