import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'

import { getBottlePath } from '../../bottle'
import {
  buildEnv,
  getWineBinary,
  stopWineProcesses
} from '../../launcher/wineRunner'

export interface ReconcileResult {
  ok: boolean
  message: string
  backupDir?: string
}

/** Ficheros de registro de un prefix Wine. */
const REG_FILES = ['system.reg', 'user.reg', 'userdef.reg'] as const

/**
 * Copia los `.reg` del bottle a `.reg-backup-<timestamp>` dentro del prefix.
 * Devuelve la ruta del backup (o null si no había registros que copiar).
 */
export function backupBottleRegistry(bottleName: string): string | null {
  const prefix = getBottlePath(bottleName)
  if (!existsSync(prefix)) return null
  const present = REG_FILES.filter((f) => existsSync(join(prefix, f)))
  if (present.length === 0) return null
  const backupDir = join(prefix, `.reg-backup-${Date.now()}`)
  mkdirSync(backupDir, { recursive: true })
  for (const f of present) {
    try {
      copyFileSync(join(prefix, f), join(backupDir, f))
    } catch {
      /* ignore */
    }
  }
  return backupDir
}

/** ¿El prefix tiene un `drive_c` ya inicializado (no es una carpeta vacía)? */
export function bottlePrefixInitialized(bottleName: string): boolean {
  const driveC = join(getBottlePath(bottleName), 'drive_c')
  if (!existsSync(driveC)) return false
  try {
    return readdirSync(driveC).length > 0
  } catch {
    return false
  }
}

/**
 * Reconcilia un prefix que pudo quedar incoherente tras mezclar versiones de Wine
 * (síntoma documentado en docs/battlenet-wine-problemas-y-roadmap.md §4): para
 * TODOS los wineserver conocidos, hace backup del registro y lanza un único
 * `wineboot --update` con el **Wine activo** (Wine 11 «Battle.net ready»). No
 * borra `drive_c`, así que conserva el cliente y los juegos instalados.
 */
export async function reconcileBottleWithActiveWine(
  bottleName: string,
  log: (msg: string) => void = () => {}
): Promise<ReconcileResult> {
  const prefix = getBottlePath(bottleName)
  if (!existsSync(prefix)) {
    return { ok: false, message: `El bottle «${bottleName}» no existe.` }
  }

  let wine: string
  try {
    wine = getWineBinary(bottleName)
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof Error
          ? e.message
          : 'Wine de Kalimotxo no está listo. Completa la descarga del runtime.'
    }
  }

  // 1) Parar TODO Wine del prefix (todos los wineserver conocidos + espera).
  log('Cerrando procesos Wine del bottle…')
  stopWineProcesses(bottleName, { wait: true })

  // 2) Backup del registro antes de tocar nada.
  const backupDir = backupBottleRegistry(bottleName)
  if (backupDir) log(`Registro respaldado en ${backupDir}`)

  // 3) Un único wineboot --update con el Wine activo para reconciliar el prefix.
  log('Reconciliando el prefix con el Wine activo (wineboot --update)…')
  const env = buildEnv(bottleName)
  const res = spawnSync(wine, ['wineboot', '--update'], {
    env,
    timeout: 240_000,
    encoding: 'utf-8'
  })

  if (res.error) {
    return {
      ok: false,
      message: `wineboot --update falló: ${res.error.message}`,
      backupDir: backupDir ?? undefined
    }
  }
  if (typeof res.status === 'number' && res.status !== 0) {
    return {
      ok: false,
      message: `wineboot --update terminó con código ${res.status}. Revisa el log.`,
      backupDir: backupDir ?? undefined
    }
  }

  // 4) Dejar el prefix en reposo (wineserver se apaga solo tras el update).
  stopWineProcesses(bottleName, { wait: false })

  return {
    ok: true,
    message: 'Prefix reconciliado con el Wine activo.',
    backupDir: backupDir ?? undefined
  }
}
