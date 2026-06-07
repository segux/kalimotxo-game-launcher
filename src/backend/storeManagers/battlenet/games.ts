import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

import { getBottleConfig, saveBottleConfig } from '../../bottle'
import { LOGS_DIR } from '../../config/paths'
import {
  BLIZZARD_GAME_IDS,
  getGameProfile,
  resolveGameExe,
  type BlizzardGameId
} from '../../compatibility/catalog'

export type { BlizzardGameId }
import { runExe, stopWineProcesses } from '../../launcher/wineRunner'
import { applyGraphicsBackend, type GraphicsBackendId } from '../../wine/graphicsBackend'
import { ensureD3dmetal, ensureD3dmetalForDx12Games } from '../../wine/d3dmetalSetup'
import { prepareBattleNetWineLaunch } from '../../wine/prepareLaunch'
import { BATTLENET_BOTTLE, BATTLENET_LAUNCHER_BACKEND } from './constants'
import { ensureLaunchDependencies } from './deps'
import { isBattleNetInstalled } from './client'
import { prepareBottleForLauncher } from './launcherPrep'

export type InstalledBlizzardGame = {
  id: BlizzardGameId
  name: string
  exePath: string
  backend: string
  rating: number
}

export function listInstalledBlizzardGames(
  bottleName = BATTLENET_BOTTLE
): InstalledBlizzardGame[] {
  const out: InstalledBlizzardGame[] = []
  for (const id of BLIZZARD_GAME_IDS) {
    const profile = getGameProfile(id)
    if (!profile) continue
    const exe = resolveGameExe(bottleName, id)
    if (!exe) continue
    out.push({
      id,
      name: profile.name,
      exePath: exe,
      backend: profile.backend,
      rating: profile.rating ?? 0
    })
  }
  return out
}

async function applyGameProfileToBottle(
  bottleName: string,
  profileId: BlizzardGameId,
  log?: (m: string) => void
): Promise<[boolean, string]> {
  const profile = getGameProfile(profileId)
  if (!profile) return [false, `Perfil desconocido: ${profileId}`]

  const backend = profile.backend as GraphicsBackendId
  if (backend === 'd3dmetal') {
    let [d3dOk, d3dMsg] = ensureD3dmetalForDx12Games()
    if (!d3dOk) {
      log?.('Instalando D3DMetal automáticamente…')
      ;[d3dOk, d3dMsg] = await ensureD3dmetal({ onLog: log })
    }
    if (!d3dOk) return [false, d3dMsg]
  }

  const [gfxOk, gfxMsg] = applyGraphicsBackend(bottleName, backend)
  if (!gfxOk) return [false, gfxMsg]

  const cfg = getBottleConfig(bottleName)
  cfg.sync_mode = profile.sync === 'msync' ? 'msync' : profile.sync === 'esync' ? 'esync' : 'none'
  cfg.env_vars = { ...cfg.env_vars, ...profile.env }
  for (const [dll, mode] of Object.entries(profile.dll_overrides)) {
    cfg.dll_overrides[dll] = mode
  }
  if (profile.sync === 'esync') {
    cfg.env_vars.WINEESYNC = '1'
    delete cfg.env_vars.WINEMSYNC
  } else if (profile.sync === 'msync') {
    cfg.env_vars.WINEMSYNC = '1'
    delete cfg.env_vars.WINEESYNC
  } else {
    delete cfg.env_vars.WINEESYNC
    delete cfg.env_vars.WINEMSYNC
  }
  saveBottleConfig(bottleName, cfg)
  return [true, gfxMsg]
}

/** Lanza un juego Blizzard instalado en la botella Battle.net (perfil CrossOver-style). */
export async function launchBlizzardGame(
  gameId: BlizzardGameId
): Promise<{ success: boolean; message: string }> {
  const logPath = join(LOGS_DIR, `game-${gameId}-launch.log`)
  mkdirSync(LOGS_DIR, { recursive: true })
  writeFileSync(logPath, `--- launch ${gameId} ${new Date().toISOString()} ---\n`)
  const log = (m: string): void => appendFileSync(logPath, m + '\n')

  if (!isBattleNetInstalled()) {
    const { play } = await import('./service')
    const opened = await play()
    if (!opened.success) return opened
    if (!isBattleNetInstalled()) {
      return { success: false, message: 'Abre Battle.net primero con el botón principal' }
    }
  }

  const profile = getGameProfile(gameId)
  if (profile?.backend === 'd3dmetal') {
    const { isD3dmetalInstalled } = await import('../../setup/runtimePaths')
    if (!isD3dmetalInstalled()) {
      log('Instalando gráficos para este juego…')
      const { ensureD3dmetal } = await import('../../wine/d3dmetalSetup')
      await ensureD3dmetal({ onLog: log })
    }
  }

  const exe = resolveGameExe(BATTLENET_BOTTLE, gameId)
  if (!exe) {
    const profile = getGameProfile(gameId)
    return {
      success: false,
      message: `${profile?.name ?? gameId} no está instalado. Instálalo desde Battle.net.`
    }
  }

  const { ensureBattleNetBottleDeps } = await import('../../setup/ensureEnvironment')
  const [prepOk, prepMsg] = await ensureBattleNetBottleDeps(log)
  if (!prepOk) return { success: false, message: prepMsg }

  const [depsOk, depsMsg] = await ensureLaunchDependencies(log)
  if (!depsOk) return { success: false, message: depsMsg }

  stopWineProcesses(BATTLENET_BOTTLE, { wait: false })

  const [profileOk, profileMsg] = await applyGameProfileToBottle(BATTLENET_BOTTLE, gameId, log)
  log(profileMsg)
  if (!profileOk) return { success: false, message: profileMsg }

  const prep = prepareBattleNetWineLaunch(logPath)
  if (!prep.ok) return { success: false, message: prep.message }

  const exeName = exe.split(/[/\\]/).pop() ?? 'game.exe'
  log(`Iniciando ${exeName} (${gameId})…`)
  runExe(BATTLENET_BOTTLE, exe, { battleNetEnv: true, gameLaunch: true, logPath })

  return {
    success: true,
    message: `${getGameProfile(gameId)?.name ?? gameId} en ejecución. Tras jugar, usa «Abrir Battle.net» para volver al modo launcher. Log: ${logPath}`
  }
}

/** Restaura capa wined3d para el cliente Battle.net (como CrossOver al volver al launcher). */
export function restoreBattleNetLauncherGraphics(
  bottleName = BATTLENET_BOTTLE
): [boolean, string] {
  prepareBottleForLauncher(bottleName)
  return applyGraphicsBackend(bottleName, BATTLENET_LAUNCHER_BACKEND as GraphicsBackendId)
}
