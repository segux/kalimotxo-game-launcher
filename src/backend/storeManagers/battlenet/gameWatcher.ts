import { execSync } from 'child_process'
import { appendFileSync } from 'fs'
import { join } from 'path'
import { LOGS_DIR } from '../../config/paths'
import { getGameProfile } from '../../compatibility/catalog'
import type { BlizzardGameId } from '../../compatibility/catalog'

let watcherInterval: NodeJS.Timeout | null = null
let isRunning = false

/** PIDs managed by Kalimotxo that the watcher should ignore. */
const managedPids = new Set<number>()

/** Maximum time a PID stays in managedPids (to avoid stale entries). */
const MANAGED_PID_TTL_MS = 120_000

/**
 * Game IDs that Kalimotxo has recently relaunched. Maps gameId → expiry timestamp.
 * Prevents the watcher from re-killing the process we just started: `runExe` returns
 * the Wine loader PID, but `ps aux` shows the Windows .exe child PID — they differ,
 * so PID-based tracking does not protect the newly launched game process.
 */
const managedGameIds = new Map<string, number>()

/** How long to ignore a gameId after Kalimotxo relaunches it (5 minutes). */
const MANAGED_GAME_TTL_MS = 5 * 60_000

/**
 * Known Blizzard game executables mapped to their game IDs.
 * When Battle.net launches a game, it spawns these exes directly.
 * We detect them and relaunch with the correct profile.
 */
const GAME_EXE_PATTERNS: Record<string, BlizzardGameId> = {
  'D2R.exe': 'diablo2r',
  'Diablo IV.exe': 'diablo4',
  'Wow.exe': 'wow',
  'Overwatch.exe': 'overwatch2',
  'Hearthstone.exe': 'hearthstone',
  'SC2_x64.exe': 'starcraft2'
}

function findWineGameProcesses(): Array<{ pid: number; exe: string; gameId: BlizzardGameId }> {
  const found: Array<{ pid: number; exe: string; gameId: BlizzardGameId }> = []
  try {
    const output = execSync(
      'ps aux | grep -E "D2R.exe|Diablo IV.exe|Wow.exe|Overwatch.exe|Hearthstone.exe|SC2_x64.exe" | grep -v grep',
      { encoding: 'utf-8', timeout: 5000 }
    )
    for (const line of output.split('\n')) {
      const parts = line.trim().split(/\s+/)
      if (parts.length < 11) continue
      const pid = parseInt(parts[1], 10)
      if (!pid || isNaN(pid)) continue
      // Skip PIDs that Kalimotxo has already managed.
      if (managedPids.has(pid)) continue
      const cmd = parts.slice(10).join(' ')
      for (const [pattern, gameId] of Object.entries(GAME_EXE_PATTERNS)) {
        if (cmd.includes(pattern)) {
          found.push({ pid, exe: pattern, gameId })
          break
        }
      }
    }
  } catch {
    /* no matching processes */
  }
  return found
}

function killWineProcess(pid: number): void {
  try {
    execSync(`kill -9 ${pid}`, { timeout: 3000 })
  } catch {
    /* ignore */
  }
}

/** Mark a PID as Kalimotxo-managed so the watcher ignores it. */
export function markPidManaged(pid: number): void {
  managedPids.add(pid)
  setTimeout(() => {
    managedPids.delete(pid)
  }, MANAGED_PID_TTL_MS).unref()
}

/**
 * Mark a game ID so the watcher ignores any process matching it for `durationMs`.
 * Use this instead of (or in addition to) markPidManaged when the Wine loader PID
 * differs from the Windows .exe child PID visible in `ps aux`.
 */
export function markGameManaged(gameId: string, durationMs = MANAGED_GAME_TTL_MS): void {
  managedGameIds.set(gameId, Date.now() + durationMs)
}

/** Clear all managed PIDs and game IDs (e.g. when stopping the watcher). */
function clearManagedPids(): void {
  managedPids.clear()
  managedGameIds.clear()
}

/**
 * Starts the game watcher. It polls for Blizzard game processes launched by
 * Battle.net (which inherit the client's wined3d environment) and relaunches
 * them with the correct profile (D3DMetal, DXMT, etc.) via launchBlizzardGame.
 */
export async function startGameWatcher(): Promise<void> {
  if (isRunning) return
  isRunning = true
  clearManagedPids()

  const logPath = join(LOGS_DIR, 'game-watcher.log')
  const log = (m: string): void => {
    try {
      appendFileSync(logPath, `${new Date().toISOString()} ${m}\n`)
    } catch {
      /* ignore */
    }
  }
  log('[gameWatcher] Starting...')

  watcherInterval = setInterval(async () => {
    if (!isRunning) return
    const processes = findWineGameProcesses()
    for (const proc of processes) {
      // Skip games Kalimotxo just relaunched — the Wine loader PID differs from the
      // Windows .exe child PID in ps, so PID-based tracking alone is not enough.
      const cooldownExpiry = managedGameIds.get(proc.gameId)
      if (cooldownExpiry && Date.now() < cooldownExpiry) {
        log(`[gameWatcher] Skipping ${proc.exe} (pid ${proc.pid}) — cooldown active for ${proc.gameId}`)
        continue
      }

      log(`[gameWatcher] Detected ${proc.exe} (pid ${proc.pid}) gameId=${proc.gameId}`)

      // Kill the process launched by Battle.net (wrong environment)
      log(`[gameWatcher] Killing pid ${proc.pid} (inherited wrong env)`)
      killWineProcess(proc.pid)
      await new Promise((r) => setTimeout(r, 1000))

      // Guard against duplicate relaunches: mark BEFORE the async call so
      // concurrent interval ticks don't also try to relaunch the same game.
      markGameManaged(proc.gameId)

      // Relaunch with the correct profile via Kalimotxo
      log(`[gameWatcher] Relaunching ${proc.gameId} with correct env`)
      try {
        const { launchBlizzardGame } = await import('./games')
        const result = await launchBlizzardGame(proc.gameId)
        log(`[gameWatcher] Relaunch result: ${result.success} - ${result.message}`)
      } catch (e) {
        log(`[gameWatcher] Relaunch error: ${String(e)}`)
        // On error, remove the cooldown so the next detection can retry
        managedGameIds.delete(proc.gameId)
      }
    }
  }, 3500)
}

export function stopGameWatcher(): void {
  if (watcherInterval) {
    clearInterval(watcherInterval)
    watcherInterval = null
  }
  isRunning = false
  clearManagedPids()
}
