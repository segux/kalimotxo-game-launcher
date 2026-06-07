#!/usr/bin/env node
/** Reparación rápida del runtime sin abrir Electron. */
import { copyFileSync, existsSync, readdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { execSync } from 'child_process'

const DATA = join(homedir(), '.macbattlenet')
const CACHE = join(DATA, 'cache')
const RUNTIME = join(DATA, 'runtime')
const DXMT = join(RUNTIME, 'dxmt')
const D3D = join(RUNTIME, 'd3dmetal')
const EXPECTED = 18_990_005

function isDxmtArchive(path) {
  if (!existsSync(path)) return false
  try {
    const size = Number(execSync(`stat -f%z "${path}"`, { encoding: 'utf-8' }).trim())
    if (size < EXPECTED - 50_000) return false
    execSync(`gzip -t "${path}"`, { stdio: 'pipe' })
    const list = execSync(`tar -tzf "${path}"`, { encoding: 'utf-8', maxBuffer: 4 * 1024 * 1024 })
    return list.includes('winemetal.so') && list.includes('winemetal.dll')
  } catch {
    return false
  }
}

function linkDxmtCache() {
  const canonical = join(CACHE, 'dxmt.tar.gz')
  if (isDxmtArchive(canonical)) return canonical
  for (const name of readdirSync(CACHE)) {
    if (!name.includes('dxmt') || !name.endsWith('.tar.gz')) continue
    const p = join(CACHE, name)
    if (isDxmtArchive(p)) {
      copyFileSync(p, canonical)
      console.log('DXMT caché:', name, '→ dxmt.tar.gz')
      return canonical
    }
  }
  return null
}

function dxmtInstalled() {
  const dll = join(DXMT, 'v0.74', 'i386-windows', 'winemetal.dll')
  return existsSync(dll)
}

function d3dInstalled() {
  return existsSync(join(D3D, 'D3DMetal.framework'))
}

console.log('=== Kalimotxo repair-runtime ===\n')

try {
  execSync('pkill -f "wineserver.*Battle.net" 2>/dev/null || true', { shell: true, stdio: 'ignore' })
  const bottle = join(DATA, 'bottles', 'Battle.net')
  if (existsSync(bottle)) {
    execSync(`wineserver -k 2>/dev/null || true`, {
      env: { ...process.env, WINEPREFIX: bottle },
      stdio: 'ignore'
    })
  }
  console.log('Wine: procesos detenidos')
} catch {
  /* ignore */
}

linkDxmtCache()

if (dxmtInstalled()) {
  console.log('DXMT: ✓ instalado en runtime')
} else {
  const arch = linkDxmtCache()
  if (arch) {
    execSync(`mkdir -p "${DXMT}" && tar -xzf "${arch}" -C "${DXMT}"`, { stdio: 'inherit' })
    console.log('DXMT: extraído')
  } else {
    console.log('DXMT: falta — en la app pulsa DXMT o Reparar runtime')
  }
}

if (d3dInstalled()) {
  console.log('D3DMetal: ✓')
} else {
  const cx = join(homedir(), 'Downloads', 'CrossOver.app', 'Contents', 'SharedSupport', 'CrossOver')
  const ext = join(cx, 'lib64', 'apple_gptk', 'external')
  if (existsSync(join(ext, 'D3DMetal.framework'))) {
    execSync(`mkdir -p "${D3D}" && cp -R "${ext}/"* "${D3D}/"`, { shell: true })
    console.log('D3DMetal: copiado desde CrossOver')
  } else {
    console.log('D3DMetal: falta — importa desde CrossOver en la app')
  }
}

const wine = join(RUNTIME, 'wine', 'Wine-Crossover-latest')
console.log('Wine Crossover:', existsSync(wine) ? '✓' : '✗')
console.log('\nListo. Arranca: pnpm start')
