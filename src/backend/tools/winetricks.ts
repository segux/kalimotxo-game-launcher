import { existsSync } from 'fs'
import { spawn } from 'child_process'
import { getBottleConfig, saveBottleConfig } from '../bottle'
import { WINETRICKS_PATH } from '../config/paths'
import { buildEnv, stopWineForWinetricks } from '../launcher/wineRunner'
import { filterWinetricksLogLine } from './winetricksLog'

export async function installDep(
  bottleName: string,
  verb: string,
  callback?: (line: string) => void,
  options?: { force?: boolean; skipCabCheck?: boolean }
): Promise<[boolean, string]> {
  if (!options?.skipCabCheck) {
    const { ensureToolsForWinetricks } = await import('../setup/ensureEnvironment')
    const [ready, msg] = await ensureToolsForWinetricks(callback ?? (() => {}))
    if (!ready) return [false, msg]
  }
  if (!existsSync(WINETRICKS_PATH)) {
    const { ensureRuntimeReady } = await import('../setup/ensureEnvironment')
    const [rtOk, rtMsg] = await ensureRuntimeReady(callback ?? (() => {}))
    if (!rtOk) return [false, rtMsg]
  }
  if (!existsSync(WINETRICKS_PATH)) {
    return [false, 'winetricks no encontrado — reintenta en unos segundos']
  }

  return new Promise((resolve) => {
    stopWineForWinetricks(bottleName)
    const env: NodeJS.ProcessEnv = { ...buildEnv(bottleName), WINEDEBUG: '-all' }
    const cmd = [WINETRICKS_PATH, '-q']
    if (options?.force) cmd.push('-f')
    cmd.push(verb)
    const lines: string[] = []
    const proc = spawn(cmd[0], cmd.slice(1), { env, shell: false })
    const emit = (chunk: string): void => {
      lines.push(chunk)
      for (const raw of chunk.split(/\r?\n/)) {
        const line = filterWinetricksLogLine(raw)
        if (line) callback?.(line)
      }
    }
    proc.stdout?.on('data', (d) => emit(d.toString()))
    proc.stderr?.on('data', (d) => emit(d.toString()))
    proc.on('close', (code) => {
      const out = lines.join('\n')
      if (code === 0) {
        try {
          const cfg = getBottleConfig(bottleName)
          if (!cfg.installed_deps.includes(verb)) {
            cfg.installed_deps.push(verb)
            saveBottleConfig(bottleName, cfg)
          }
        } catch {
          /* ignore */
        }
        resolve([true, out])
      } else {
        resolve([false, out || `winetricks exited ${code}`])
      }
    })
    proc.on('error', (e) => resolve([false, e.message]))
  })
}
