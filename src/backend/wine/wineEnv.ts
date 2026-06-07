import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

import { DATA_DIR, DXMT_DIR, D3DMETAL_DIR, WINE_DIR } from '../config/paths'
import { ensureOAuthBrowserScript } from '../storeManagers/battlenet/oauthBrowserScript'
import type { WineInstallation } from './types'

const GRAPHICS_STRIP = [
  'DXMT_ASYNC',
  'DXMT_LOG_LEVEL',
  'MTL_HUD_ENABLED',
  'D3DMETAL',
  'DYLD_FRAMEWORK_PATH',
  'DYLD_LIBRARY_PATH',
  'DXVK_HUD',
  'DXVK_ASYNC',
  'WINEESYNC',
  'WINEMSYNC'
] as const

const WINEMENU_DISABLE = 'winemenubuilder.exe=d'

/**
 * Wine Staging (Gcenx) NO implementa el parche CodeWeavers `WINE_SIMULATE_WRITECOPY`
 * y entra en deadlock en `loader_section` si se activa (ventana «actualizando Wine»
 * infinita). Builds tipo CrossOver / D4Mac (wine-cx*, Wine 11) sí lo soportan y lo
 * necesitan para que CEF no muera con `nested exception on signal stack`.
 */
function wineSupportsWriteCopy(installation: WineInstallation): boolean {
  return !/staging/i.test(installation.name)
}

/** Subdirectorios de DXMT con DLLs builtin (`i386-windows`, `x86_64-windows`), buscando un nivel anidado (p. ej. `dxmt/v0.74/`). */
function resolveDxmtBuiltinDirs(): string[] {
  if (!existsSync(DXMT_DIR)) return []
  const wanted = ['i386-windows', 'x86_64-windows']
  const roots = [DXMT_DIR]
  try {
    for (const name of readdirSync(DXMT_DIR)) {
      const p = join(DXMT_DIR, name)
      if (statSync(p).isDirectory()) roots.push(p)
    }
  } catch {
    return []
  }
  const dirs: string[] = []
  for (const root of roots) {
    for (const sub of wanted) {
      const candidate = join(root, sub)
      if (existsSync(candidate)) dirs.push(candidate)
    }
  }
  return dirs
}

/** Carpeta `x86_64-unix` de DXMT (contiene `winemetal.so`) para `DYLD_FALLBACK_LIBRARY_PATH`. */
function resolveDxmtUnixDir(): string | null {
  if (!existsSync(DXMT_DIR)) return null
  const roots = [DXMT_DIR]
  try {
    for (const name of readdirSync(DXMT_DIR)) {
      const p = join(DXMT_DIR, name)
      if (statSync(p).isDirectory()) roots.push(p)
    }
  } catch {
    return null
  }
  for (const root of roots) {
    const unix = join(root, 'x86_64-unix')
    if (existsSync(unix)) return unix
  }
  return null
}

/** `libd3dshared.dylib` de D3DMetal (GPTK) si está en el runtime. */
function resolveD3dmetalSharedLib(): string | null {
  const lib = join(D3DMETAL_DIR, 'libd3dshared.dylib')
  return existsSync(lib) ? lib : null
}

/**
 * Directorio con un `libgnutls.30.dylib` **x86_64** (más sus dependencias vía
 * `@loader_path`) para `DYLD_FALLBACK_LIBRARY_PATH`. El Wine de Battle.net corre
 * bajo Rosetta (x86_64) y su `secur32`/`bcrypt` cargan gnutls para TLS; sin él el
 * Agent no puede hacer HTTPS (`CURL error 35`) y el cliente se queda colgado.
 * Los builds de Wine-Crossover / GPTK / Staging que descarga Kalimotxo ya
 * empaquetan estos dylibs en `…/Resources/wine/lib`.
 */
export function resolveBundledGnutlsDir(): string | null {
  if (!existsSync(WINE_DIR)) return null
  const stack: string[] = [WINE_DIR]
  let guard = 0
  while (stack.length && guard++ < 5000) {
    const dir = stack.pop() as string
    if (existsSync(join(dir, 'libgnutls.30.dylib'))) return dir
    try {
      for (const name of readdirSync(dir)) {
        if (name === '.DS_Store') continue
        const child = join(dir, name)
        try {
          if (statSync(child).isDirectory()) stack.push(child)
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

/**
 * Directorio `lib/external` que algunos builds de Wine «Battle.net ready»
 * (D4Mac / Wine 11 + GPTK) llevan junto al binario, con DXMT, D3DMetal,
 * `libd3dshared.dylib` y `libMoltenVK.dylib` **emparejados** a esa versión de
 * Wine. Se prefiere a los componentes sueltos de `runtime/` cuando existe.
 * `installation.bin` es `<root>/bin/wine`.
 */
export function resolveWineExternalDir(installation: WineInstallation): string | null {
  const binDir = installation.bin.replace(/\/[^/]+$/, '') // <root>/bin
  const root = binDir.replace(/\/[^/]+$/, '') // <root>
  const ext = join(root, 'lib', 'external')
  return existsSync(ext) ? ext : null
}

function prependPath(existing: string | undefined, parts: string[]): string {
  const all = [...parts, ...(existing ? existing.split(':') : [])].filter(Boolean)
  return [...new Set(all)].join(':')
}

/** Última aparición gana (evita locationapi=n,b y locationapi=d a la vez). */
function mergeDllOverrides(existing: string | undefined, extra: string[]): string {
  const map = new Map<string, string>()
  const ingest = (chunk: string): void => {
    const t = chunk.trim()
    if (!t) return
    const eq = t.indexOf('=')
    if (eq === -1) return
    const dll = t.slice(0, eq).trim()
    const mode = t.slice(eq + 1).trim()
    if (dll) map.set(dll.toLowerCase(), `${dll}=${mode}`)
  }
  for (const part of (existing ?? '').split(';')) ingest(part)
  for (const part of extra) ingest(part)
  return [...map.values()].join(';')
}

/**
 * Variables Wine al estilo Heroic `setupWineEnvVars` (macOS / Battle.net).
 */
export function setupWineEnvVars(
  base: NodeJS.ProcessEnv,
  installation: WineInstallation,
  options: {
    winePrefix?: string
    crossoverBottle?: string
    bottleEnvVars?: Record<string, string>
    battleNetLaunch?: boolean
    gameLaunch?: boolean
  }
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...base }

  for (const key of GRAPHICS_STRIP) {
    delete env[key]
  }

  delete env.WINEESYNC
  delete env.WINEMSYNC

  if (options.bottleEnvVars) {
    for (const [k, v] of Object.entries(options.bottleEnvVars)) {
      if (
        options.battleNetLaunch &&
        (k === 'WINEESYNC' || k === 'WINEMSYNC' || GRAPHICS_STRIP.includes(k as (typeof GRAPHICS_STRIP)[number]))
      ) {
        continue
      }
      env[k] = v
    }
  }

  if (options.battleNetLaunch) {
    delete env.WINEESYNC
    delete env.WINEMSYNC
  }

  switch (installation.type) {
    case 'crossover':
      if (options.crossoverBottle) {
        env.CX_BOTTLE = options.crossoverBottle
      }
      delete env.WINEPREFIX
      break
    case 'toolkit':
    case 'wine':
    default:
      if (options.winePrefix) {
        env.WINEPREFIX = options.winePrefix
      }
      env.WINEARCH = env.WINEARCH ?? 'win64'
      break
  }

  env.WINEDLLOVERRIDES = mergeDllOverrides(env.WINEDLLOVERRIDES, [WINEMENU_DISABLE])

  if (options.battleNetLaunch && !options.gameLaunch) {
    // Stack «Battle.net ready» alineado con D4Mac (Wine 11 + GPTK 3 + DXMT).
    // Ver docs/battlenet-wine-problemas-y-roadmap.md §3e.
    env.WINE_LARGE_ADDRESS_AWARE = env.WINE_LARGE_ADDRESS_AWARE ?? '1'
    env.WINE_HEAP_ZERO_MEMORY = env.WINE_HEAP_ZERO_MEMORY ?? '1'
    if (process.arch === 'arm64') {
      env.ROSETTA_ADVERTISE_AVX = '1'
    }
    // Parche CEF/excepciones (copy-on-write) — solo en Wines que lo soportan;
    // en Staging provoca deadlock, así que se omite.
    if (wineSupportsWriteCopy(installation)) {
      env.WINE_SIMULATE_WRITECOPY = env.WINE_SIMULATE_WRITECOPY ?? '1'
    }
    env.WINEDEBUG = '-all'
    env.WINEDLLOVERRIDES = mergeDllOverrides(env.WINEDLLOVERRIDES, [
      'location=d',
      'locationapi=d',
      'mscoree=d',
      'mshtml=d',
      'vcruntime140_1=n,b',
      'msvcp140_1=n,b',
      'mf=n,b',
      // CRÍTICO: forzar el `vulkan-1` builtin de Wine (winevulkan → MoltenVK,
      // que SÍ expone VK_KHR_win32_surface). Si no, ANGLE carga el
      // `vulkan-1.dll` (SwiftShader headless) que Battle.net trae en su carpeta
      // y que no tiene WSI de superficie → la ventana CEF nunca se pinta.
      'vulkan-1=b'
    ])

    // Libs `lib/external` empaquetadas junto al Wine activo (D4Mac / Wine 11),
    // emparejadas a esa versión. Se prefieren a los componentes de `runtime/`.
    const wineExt = resolveWineExternalDir(installation)

    // CRÍTICO: DXMT como DLL builtin de Wine vía WINEDLLPATH (no copias sueltas
    // en syswow64). Sin esto el renderer CEF muere con error GPU fatal.
    const dxmtDirs: string[] = []
    if (wineExt) {
      for (const sub of ['i386-windows', 'x86_64-windows']) {
        const d = join(wineExt, 'dxmt', sub)
        if (existsSync(d)) dxmtDirs.push(d)
      }
    }
    dxmtDirs.push(...resolveDxmtBuiltinDirs())
    if (dxmtDirs.length) {
      env.WINEDLLPATH = prependPath(env.WINEDLLPATH, dxmtDirs)
    }

    // D3DMetal (GPTK 3) como backend gráfico, estilo CrossOver.
    const extSharedLib = wineExt ? join(wineExt, 'libd3dshared.dylib') : ''
    const sharedLib =
      extSharedLib && existsSync(extSharedLib) ? extSharedLib : resolveD3dmetalSharedLib()
    if (sharedLib) {
      env.CX_ACTIVE_GRAPHICS_BACKEND = 'd3dmetal'
      env.CX_APPLEGPTK_LIBD3DSHARED_PATH = sharedLib
    }

    // MoltenVK / D3DMetal / winemetal.so para el cargador dinámico de macOS.
    const fallbackLibDirs: string[] = []
    if (wineExt) {
      // libMoltenVK.dylib + libd3dshared.dylib viven aquí.
      fallbackLibDirs.push(wineExt)
      const extD3dmetalFw = join(wineExt, 'D3DMetal.framework', 'Versions', 'A')
      if (existsSync(extD3dmetalFw)) fallbackLibDirs.push(extD3dmetalFw)
      const extDxmtUnix = join(wineExt, 'dxmt', 'x86_64-unix')
      if (existsSync(extDxmtUnix)) fallbackLibDirs.push(extDxmtUnix)
    }
    const d3dmetalFw = join(D3DMETAL_DIR, 'D3DMetal.framework', 'Versions', 'A')
    if (existsSync(d3dmetalFw)) fallbackLibDirs.push(d3dmetalFw)
    if (existsSync(D3DMETAL_DIR)) fallbackLibDirs.push(D3DMETAL_DIR)
    const dxmtUnix = resolveDxmtUnixDir()
    if (dxmtUnix) fallbackLibDirs.push(dxmtUnix)
    // libgnutls x86_64 para que el TLS de schannel/bcrypt funcione (Agent HTTPS).
    const gnutlsDir = resolveBundledGnutlsDir()
    if (gnutlsDir) fallbackLibDirs.push(gnutlsDir)
    if (fallbackLibDirs.length) {
      env.DYLD_FALLBACK_LIBRARY_PATH = prependPath(
        env.DYLD_FALLBACK_LIBRARY_PATH,
        fallbackLibDirs
      )
    }
  }

  if (options.gameLaunch && options.winePrefix) {
    env.WINE_DISABLE_VA_ALLOC = env.WINE_DISABLE_VA_ALLOC ?? '1'
    env.WINEDEBUG = 'err+module'
  }

  if (installation.type === 'toolkit' && process.arch === 'arm64') {
    env.ROSETTA_ADVERTISE_AVX = '1'
  }

  if (process.platform === 'darwin' && options.battleNetLaunch) {
    try {
      env.BROWSER = ensureOAuthBrowserScript()
      env.KALIMOTXO_DATA = process.env.KALIMOTXO_DATA ?? DATA_DIR
    } catch {
      /* script opcional en dev sin scripts/ */
    }
  }

  const binDir = installation.bin.includes('/')
    ? installation.bin.replace(/\/[^/]+$/, '')
    : ''
  if (binDir) {
    env.PATH = `${binDir}:${process.env.PATH || ''}`
  }

  env.WINE = installation.bin
  const ws =
    installation.wineserver ??
    installation.bin.replace(/wine64?$/, 'wineserver')
  if (ws && existsSync(ws)) {
    env.WINESERVER = ws
  }

  return env
}
