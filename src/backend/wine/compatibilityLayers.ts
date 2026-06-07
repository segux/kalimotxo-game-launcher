import { existsSync, readdirSync, readFileSync } from 'fs'
import { MAIN_EXE_REL_PATHS } from '../storeManagers/battlenet/constants'
import { homedir } from 'os'
import { join } from 'path'
import { execSync } from 'child_process'
import { loadGlobalConfig, saveGlobalConfig } from '../config/paths'
import { findWine64 } from '../setup/runtime'
import { findRelease, getActiveVersionId } from './manager/catalog'
import type { KalimotxoWineSettings, WineInstallation, WineLayerPreference } from './types'

export const CROSSOVER_BOTTLES_DIR = join(
  homedir(),
  'Library/Application Support/CrossOver/Bottles'
)
/** @deprecated use CROSSOVER_BOTTLES_DIR */
const CROSSOVER_BOTTLES = CROSSOVER_BOTTLES_DIR

/** Deja de usar CrossOver como motor; solo Wine en ~/.kalimotxo. */
export function migrateWineSettingsToKalimotxo(): void {
  const cfg = loadGlobalConfig()
  if (cfg.wineLayer === 'auto' || cfg.wineLayer === 'crossover') {
    cfg.wineLayer = 'runtime'
    saveGlobalConfig(cfg)
  }
}

export function getWineSettings(): KalimotxoWineSettings {
  const cfg = loadGlobalConfig()
  let wineLayer = (cfg.wineLayer as WineLayerPreference) ?? 'runtime'
  if (wineLayer === 'auto' || wineLayer === 'crossover') {
    wineLayer = 'runtime'
  }
  const crossoverBottle =
    typeof cfg.crossoverBottle === 'string' && cfg.crossoverBottle.trim()
      ? cfg.crossoverBottle.trim()
      : 'Battle.net'
  return { wineLayer, crossoverBottle }
}

function wineExecs(wineBin: string): Pick<WineInstallation, 'bin' | 'wineserver'> {
  const wineserver = wineBin.replace(/wine64?$/, 'wineserver')
  return {
    bin: wineBin.replace(/wine64$/, 'wine'),
    wineserver: existsSync(wineserver) ? wineserver : undefined
  }
}

export function getRuntimeWineInstallation(): WineInstallation | null {
  const wine64 = findWine64()
  if (!wine64) return null
  const versionId = getActiveVersionId()
  const release = versionId ? findRelease(versionId) : null
  const label = release?.version ?? 'Kalimotxo Wine'
  return {
    ...wineExecs(wine64),
    name: label,
    type: 'wine'
  }
}

/** Heroic: mdfind CrossOver.app → wine binary */
export function getCrossoverInstallations(): WineInstallation[] {
  if (process.platform !== 'darwin') return []
  const out: WineInstallation[] = []
  try {
    const stdout = execSync(
      'mdfind \'kMDItemCFBundleIdentifier = "com.codeweavers.CrossOver"\'',
      { encoding: 'utf-8', timeout: 8000 }
    )
    for (const appPath of stdout.split('\n').filter(Boolean)) {
      const wineBin = join(
        appPath,
        'Contents/SharedSupport/CrossOver/bin/wine'
      )
      if (!existsSync(wineBin)) continue
      let version = ''
      const plist = join(appPath, 'Contents/Info.plist')
      if (existsSync(plist)) {
        const m = readFileSync(plist, 'utf-8').match(
          /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/
        )
        version = m?.[1] ?? ''
      }
      out.push({
        bin: wineBin,
        wineserver: join(appPath, 'Contents/SharedSupport/CrossOver/bin/wineserver'),
        name: version ? `CrossOver ${version}` : 'CrossOver',
        type: 'crossover'
      })
    }
  } catch {
    /* CrossOver no instalado */
  }
  return out
}

export function crossoverBottleExists(bottleName: string): boolean {
  return existsSync(join(CROSSOVER_BOTTLES, bottleName, 'cxbottle.conf'))
}

export function listDetectedWineInstallations(): WineInstallation[] {
  const list: WineInstallation[] = []
  const runtime = getRuntimeWineInstallation()
  if (runtime) list.push(runtime)
  list.push(...getCrossoverInstallations())
  return list
}

export function resolveBattleNetWineInstallation(): WineInstallation {
  const runtime = getRuntimeWineInstallation()
  if (runtime) return runtime
  throw new Error(
    'Wine de Kalimotxo no está listo. Pulsa «Empezar» en Battle.net o completa la descarga en Ajustes.'
  )
}

function crossoverHasBattleNetClient(bottleName: string): boolean {
  const driveC = join(CROSSOVER_BOTTLES_DIR, bottleName, 'drive_c')
  return MAIN_EXE_REL_PATHS.some((rel) => existsSync(join(driveC, rel)))
}

/** Botella CrossOver con cliente Battle.net (p. ej. «Battle.net Desktop App-2»). */
export function findCrossoverBattleNetBottle(): string | undefined {
  const { crossoverBottle } = getWineSettings()
  if (crossoverBottleExists(crossoverBottle) && crossoverHasBattleNetClient(crossoverBottle)) {
    return crossoverBottle
  }
  for (const name of listCrossoverBottleNames()) {
    if (!/battle\.net/i.test(name)) continue
    if (crossoverHasBattleNetClient(name)) return name
  }
  return undefined
}

/** Solo referencia legacy; Kalimotxo no usa botellas CrossOver por defecto. */
export function resolveCrossoverBottleName(): string | undefined {
  return undefined
}

export function listCrossoverBottleNames(): string[] {
  if (!existsSync(CROSSOVER_BOTTLES)) return []
  try {
    return readdirSync(CROSSOVER_BOTTLES).filter((name) =>
      crossoverBottleExists(name)
    )
  } catch {
    return []
  }
}

export type CrossoverBottleInfo = {
  name: string
  hasBattleNetClient: boolean
}

export function listCrossoverBottleInfos(): CrossoverBottleInfo[] {
  return listCrossoverBottleNames()
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      hasBattleNetClient: crossoverHasBattleNetClient(name)
    }))
}
