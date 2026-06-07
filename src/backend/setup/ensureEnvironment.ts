import { existsSync } from 'fs'
import { join } from 'path'

import { listBottles } from '../bottle'
import { CACHE_DIR } from '../config/paths'
import { logInfo } from '../logger'
import { cabextractAvailable, gstreamerAvailable } from './toolPaths'
import { downloadAll, isSetupComplete } from './runtime'
import {
  bottleLaunchDepsOk,
  syncLaunchRuntime
} from '../storeManagers/battlenet/deps'
import {
  BATTLENET_BOTTLE,
  BATTLENET_DEPS,
  BATTLENET_DEPS_QUICK,
  BATTLENET_LAUNCH_PREP
} from '../storeManagers/battlenet/constants'
import { installBattlenetVerbs } from '../storeManagers/battlenet/winetricksInstall'
import { createBattleNetBottle } from '../storeManagers/battlenet/bottleSetup'
import { installSystemDependencies } from './systemInstaller'

const VC_REDIST_URL =
  'https://download.microsoft.com/download/9/0/6/906AD0A8-70FB-4926-8A83-8F50A7746B39/vc_redist.x86.exe'

async function ensureVcRedistCache(log: (m: string) => void): Promise<void> {
  const dest = join(CACHE_DIR, 'vc_redist.x86.exe')
  if (existsSync(dest)) return
  const alt = join(CACHE_DIR, 'vc_redist_2015.x86.exe')
  if (existsSync(alt)) return
  log('Descargando Visual C++ Redistributable (UCRT)…')
  try {
    const res = await fetch(VC_REDIST_URL, { redirect: 'follow' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 1_000_000) throw new Error('archivo demasiado pequeño')
    const { writeFileSync, mkdirSync } = await import('fs')
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(dest, buf)
    log('vc_redist.x86.exe en caché')
  } catch (e) {
    log(
      `Aviso: no se pudo descargar vc_redist (${e instanceof Error ? e.message : String(e)}); winetricks intentará obtenerlo`
    )
  }
}

/** cabextract (+ GStreamer si es posible) sin pedir pasos manuales. */
export async function ensureToolsForWinetricks(
  log: (m: string) => void = logInfo
): Promise<[boolean, string]> {
  if (!cabextractAvailable()) {
    log('Obteniendo cabextract…')
    const sys = await installSystemDependencies(log)
    if (!sys.success && !cabextractAvailable()) {
      const { ensureCabextract } = await import('./systemInstaller')
      const [cabOk, cabMsg] = await ensureCabextract(log)
      if (!cabOk) return [false, cabMsg]
    }
  }

  if (!cabextractAvailable()) {
    return [false, 'No se pudo instalar cabextract automáticamente']
  }

  if (!gstreamerAvailable()) {
    log('Comprobando GStreamer (audio Wine)…')
    const { ensureGstreamer, isHomebrewInstalled, installHomebrew } = await import(
      './systemInstaller'
    )
    if (!(await isHomebrewInstalled())) {
      log('Instalando Homebrew para GStreamer (macOS puede pedir contraseña una vez)…')
      const [brewOk, brewMsg] = await installHomebrew(log)
      if (!brewOk) {
        log(`Aviso: ${brewMsg} — se continúa solo con cabextract`)
      }
    }
    const [gstOk, gstMsg] = await ensureGstreamer(log)
    if (!gstOk) {
      log(`Aviso GStreamer: ${gstMsg} — las DLL VC++/UCRT pueden instalarse igual`)
    }
  }

  await ensureVcRedistCache(log)
  return [true, 'Herramientas del sistema listas']
}

/** Wine, DXMT, winetricks en ~/.kalimotxo o ~/.macbattlenet. */
export async function ensureRuntimeReady(
  log: (m: string) => void = logInfo
): Promise<[boolean, string]> {
  const [toolsOk, toolsMsg] = await ensureToolsForWinetricks(log)
  if (!toolsOk) return [false, toolsMsg]

  if (isSetupComplete()) return [true, 'Runtime Kalimotxo listo']

  log('Descargando Wine, DXMT y winetricks (primera vez, puede tardar varios minutos)…')
  const rt = await downloadAll()
  if (!rt.success) return [false, rt.message]
  if (!isSetupComplete()) {
    return [false, 'Runtime incompleto tras la descarga — reintenta en unos segundos']
  }
  return [true, rt.message]
}

/** Botella Battle.net + DLLs VC++/UCRT en syswow64. */
export async function ensureBattleNetBottleDeps(
  log: (m: string) => void = logInfo
): Promise<[boolean, string]> {
  const [rtOk, rtMsg] = await ensureRuntimeReady(log)
  if (!rtOk) return [false, rtMsg]

  if (!listBottles().some((b) => b.name === BATTLENET_BOTTLE)) {
    log('Creando botella Battle.net…')
    createBattleNetBottle()
  }

  let mirrored = syncLaunchRuntime()
  if (mirrored.length) log(`DLL syswow64: ${mirrored.join(', ')}`)

  if (bottleLaunchDepsOk()) {
    return [true, 'Dependencias VC++/UCRT listas']
  }

  log('Instalando dependencias Wine (vcrun, UCRT, d3dcompiler)…')
  const allVerbs = [...new Set([...BATTLENET_DEPS, ...BATTLENET_LAUNCH_PREP])]
  const [verbsOk, verbsMsg] = await installBattlenetVerbs(BATTLENET_BOTTLE, allVerbs, log, {
    force: true
  })
  if (!verbsOk) return [false, verbsMsg]

  mirrored = syncLaunchRuntime()
  if (mirrored.length) log(`DLL syswow64: ${mirrored.join(', ')}`)

  if (!bottleLaunchDepsOk()) {
    return [
      false,
      'No se pudieron desplegar las DLL VC++/UCRT. Revisa ~/.kalimotxo/logs/battlenet-install.log'
    ]
  }
  return [true, 'Dependencias VC++/UCRT instaladas']
}

/** Instalación inicial: solo deps mínimas (más rápido; evita quedarse en 45% de Kalimotxo). */
export async function ensureBattleNetBottleDepsForInstall(
  log: (m: string) => void = logInfo,
  onVerb?: (verb: string, index: number, total: number) => void
): Promise<[boolean, string]> {
  const [rtOk, rtMsg] = await ensureRuntimeReady(log)
  if (!rtOk) return [false, rtMsg]

  if (!listBottles().some((b) => b.name === BATTLENET_BOTTLE)) {
    log('Creando botella Battle.net…')
    createBattleNetBottle()
  }

  let mirrored = syncLaunchRuntime()
  if (mirrored.length) log(`DLL syswow64: ${mirrored.join(', ')}`)

  if (bottleLaunchDepsOk()) {
    return [true, 'Dependencias listas']
  }

  const verbs = [...BATTLENET_DEPS_QUICK]
  log(`Instalando ${verbs.length} paquetes Wine (vcrun, UCRT)…`)

  for (let i = 0; i < verbs.length; i++) {
    const verb = verbs[i]!
    onVerb?.(verb, i, verbs.length)
    log(`→ ${verb}…`)
    const [ok, out] = await installBattlenetVerbs(BATTLENET_BOTTLE, [verb], log, {
      force: true
    })
    if (!ok) return [false, `Falló ${verb}: ${out.slice(0, 280)}`]
    log(`✓ ${verb}`)
  }

  mirrored = syncLaunchRuntime()
  if (mirrored.length) log(`DLL syswow64: ${mirrored.join(', ')}`)

  if (!bottleLaunchDepsOk()) {
    return [
      false,
      'Faltan DLL VC++/UCRT. Revisa ~/.kalimotxo/logs/battlenet-install.log o pulsa Reparar.'
    ]
  }
  return [true, 'Dependencias listas']
}
