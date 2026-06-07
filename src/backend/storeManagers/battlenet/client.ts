import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { getBottlePath } from '../../bottle'
import { BATTLENET_BOTTLE, LAUNCHER_REL_PATHS, MAIN_EXE_REL_PATHS, MIN_CLIENT_BYTES } from './constants'
import { battleNetDriveC, resolveBattleNetPrefix } from './prefix'

export function battlenetProgramDir(bottleName = BATTLENET_BOTTLE): string {
  return join(battleNetDriveC(bottleName), 'Program Files (x86)', 'Battle.net')
}

export function findBattleNetExe(bottleName = BATTLENET_BOTTLE): string | null {
  const driveC = battleNetDriveC(bottleName)
  for (const rel of MAIN_EXE_REL_PATHS) {
    const p = join(driveC, rel)
    if (existsSync(p)) return p
  }
  return null
}

export function findLauncherExe(bottleName = BATTLENET_BOTTLE): string | null {
  const driveC = battleNetDriveC(bottleName)
  for (const rel of LAUNCHER_REL_PATHS) {
    const p = join(driveC, rel)
    if (existsSync(p)) return p
  }
  return null
}

/** Cliente principal (Battle.net.exe); el Launcher.exe suele salir al instante bajo Wine. */
export function resolveBattleNetLaunchExe(bottleName = BATTLENET_BOTTLE): string | null {
  return findBattleNetExe(bottleName) ?? findLauncherExe(bottleName)
}

/** Cierra Battle.net y el launcher (no Agent ni wineserver). */
export function stopBattleNetClientProcesses(): void {
  for (const pattern of ['Battle.net.exe', 'Battle.net Launcher.exe']) {
    try {
      execSync(`pkill -f "${pattern}" 2>/dev/null || true`, {
        shell: '/bin/bash',
        timeout: 5000
      })
    } catch {
      /* ignore */
    }
  }
}

export function isBattleNetWineProcessRunning(bottleName = BATTLENET_BOTTLE): boolean {
  const prefix = resolveBattleNetPrefix(bottleName)
  const patterns = [
    'Battle.net.exe',
    'Battle.net Launcher.exe',
    'Battle.net\\\\Agent\\\\Agent.exe',
    prefix
  ]
  for (const pattern of patterns) {
    try {
      const out = execSync(`pgrep -lf "${pattern.replace(/"/g, '\\"')}"`, {
        encoding: 'utf-8',
        timeout: 3000
      })
      if (/Battle\.net|Agent\.exe/i.test(out)) return true
    } catch {
      /* try next */
    }
  }
  return false
}

export function findVersionDir(bottleName = BATTLENET_BOTTLE): string | null {
  const bnet = battlenetProgramDir(bottleName)
  if (!existsSync(bnet)) return null
  const dirs = readdirSync(bnet)
    .filter((n) => n.startsWith('Battle.net.') && n !== 'Battle.net')
    .map((n) => join(bnet, n))
    .filter((p) => statSync(p).isDirectory())
    .sort()
    .reverse()
  return dirs[0] ?? null
}

export function isBattleNetInstalled(bottleName = BATTLENET_BOTTLE): boolean {
  return findBattleNetExe(bottleName) !== null || findLauncherExe(bottleName) !== null
}

export function isClientComplete(bottleName = BATTLENET_BOTTLE): boolean {
  if (!findBattleNetExe(bottleName)) return false

  const bnetDir = battlenetProgramDir(bottleName)
  const patch = join(bnetDir, '.patch.result')
  if (existsSync(patch)) {
    const v = readFileSync(patch, 'utf-8').trim()
    if (v === '1' || v === '2') return true
  }

  const versionDir = findVersionDir(bottleName)
  if (versionDir) {
    for (const name of ['battle.net.dll', 'libcef.dll', 'BlizzardBrowser.exe']) {
      if (existsSync(join(versionDir, name))) return true
    }
  }

  let total = 0
  function walk(dir: string): void {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isFile()) total += statSync(p).size
      else if (e.isDirectory()) walk(p)
    }
  }
  try {
    if (existsSync(bnetDir)) walk(bnetDir)
  } catch {
    return false
  }
  return total >= MIN_CLIENT_BYTES
}

export function fixBrokenUpdateFolders(bottleName = BATTLENET_BOTTLE): number {
  const bnet = battlenetProgramDir(bottleName)
  if (!existsSync(bnet)) return 0
  let removed = 0
  for (const name of readdirSync(bnet)) {
    if (!name.startsWith('Battle.net.')) continue
    const dir = join(bnet, name)
    if (!statSync(dir).isDirectory()) continue
    const hasDll =
      existsSync(join(dir, 'libcef.dll')) || existsSync(join(dir, 'battle.net.dll'))
    if (!hasDll && statSync(dir).size < 50_000_000) {
      try {
        rmSync(dir, { recursive: true, force: true })
        removed++
      } catch {
        /* ignore */
      }
    }
  }
  return removed
}
