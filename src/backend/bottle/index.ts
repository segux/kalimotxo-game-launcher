import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'
import { BOTTLES_DIR } from '../config/paths'
import { findWine64 } from '../setup/runtime'

export const CONFIG_FILENAME = '.kalimotxo.json'

export interface BottleConfig {
  name: string
  windows_version: string
  graphics_backend: string
  sync_mode: string
  high_dpi: boolean
  env_vars: Record<string, string>
  dll_overrides: Record<string, string>
  created_at: string
  installed_apps: string[]
  installed_deps: string[]
  wine_version: string | null
}

export function getBottlePath(name: string): string {
  return join(BOTTLES_DIR, name)
}

function configPath(bottlePath: string): string | null {
  const kal = join(bottlePath, CONFIG_FILENAME)
  return existsSync(kal) ? kal : null
}

export function getBottleConfig(name: string): BottleConfig {
  const bottlePath = getBottlePath(name)
  const cfg = configPath(bottlePath)
  if (!cfg) throw new Error(`Bottle config not found: ${name}`)
  const data = JSON.parse(readFileSync(cfg, 'utf-8')) as BottleConfig
  return { ...data, name: data.name || name }
}

export function saveBottleConfig(name: string, config: BottleConfig): void {
  const bottlePath = getBottlePath(name)
  mkdirSync(bottlePath, { recursive: true })
  writeFileSync(join(bottlePath, CONFIG_FILENAME), JSON.stringify(config, null, 2) + '\n')
}

export function listBottles(): BottleConfig[] {
  mkdirSync(BOTTLES_DIR, { recursive: true })
  const out: BottleConfig[] = []
  for (const entry of readdirSync(BOTTLES_DIR)) {
    const p = join(BOTTLES_DIR, entry)
    if (!statSync(p).isDirectory()) continue
    if (!configPath(p)) continue
    try {
      out.push(getBottleConfig(entry))
    } catch {
      /* skip */
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

export function createBottle(name: string, windowsVersion = 'win10'): BottleConfig {
  const bottlePath = getBottlePath(name)
  if (existsSync(join(bottlePath, CONFIG_FILENAME))) {
    throw new Error(`Bottle '${name}' already exists`)
  }
  mkdirSync(bottlePath, { recursive: true })
  const wine64 = findWine64()
  if (!wine64) throw new Error('Wine is not installed. Run Setup first.')
  const env = { ...process.env, WINEPREFIX: bottlePath, WINEARCH: 'win64' }
  spawnSync(wine64, ['wineboot', '--init'], { env, stdio: 'pipe', timeout: 120_000 })
  const config: BottleConfig = {
    name,
    windows_version: windowsVersion,
    graphics_backend: 'dxmt',
    sync_mode: 'esync',
    high_dpi: false,
    env_vars: {},
    dll_overrides: {},
    created_at: new Date().toISOString(),
    installed_apps: [],
    installed_deps: [],
    wine_version: null
  }
  saveBottleConfig(name, config)
  return config
}
