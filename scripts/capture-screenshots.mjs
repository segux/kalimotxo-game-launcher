#!/usr/bin/env node
/**
 * Capturas de cada vista del launcher (renderer en localhost:5173).
 * Requiere: pnpm start  o  pnpm run start:ui
 * Uso: node scripts/capture-screenshots.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const PROJECT_ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const OUT_DIR = join(PROJECT_ROOT, 'docs', 'screenshots')
const BASE_URL = process.env.KALIMOTXO_URL ?? 'http://localhost:5173'
const VIEWPORT = { width: 1100, height: 720 }

const VIEWS = [
  { file: '01-platforms', path: '/?preview=1' },
  { file: '02-library', path: '/library?preview=1' },
  { file: '03-downloads', path: '/downloads?preview=1' },
  { file: '04-settings-runtime', path: '/settings?preview=1&tab=runtime' },
  { file: '05-settings-wine', path: '/settings?preview=1&tab=wine' },
  { file: '06-settings-system', path: '/settings?preview=1&tab=system' },
  { file: '07-battlenet', path: '/store/battlenet?preview=1' },
  { file: '08-setup-welcome', path: '/setup?preview=1' }
]

const MOCK_API = `
(() => {
  const checks = {
    rosetta: { installed: true },
    gstreamer: { installed: true, install_hint: undefined },
    cabextract: { installed: true, install_hint: undefined, path: '/opt/homebrew/bin/cabextract' },
    homebrew: { installed: true },
    xcode_clt: { installed: true }
  }
  const downloadStatus = { wine: true, dxmt: true, dxvk: false, d3dmetal: false, winetricks: true }
  const wizardState = {
    system_ready: true,
    runtime_ready: true,
    wizard_complete: false,
    wizard_skipped: true,
    checks,
    download_status: downloadStatus
  }
  const setupState = {
    runtime_ready: true,
    download_status: downloadStatus,
    checks
  }
  const battleNetStatus = {
    bottle_exists: true,
    installed: true,
    client_exe: true,
    client_complete: true,
    exe_found: true,
    awaiting_blizzard_wizard: false,
    kalimotxo_setup_done: true,
    client_watch_running: false,
    launcher_path: '/Applications/Battle.net.app',
    client_path: 'C:\\\\Program Files (x86)\\\\Battle.net\\\\Battle.net.exe',
    installer_cached: true,
    runtime_ready: true,
    install_running: false,
    repair_running: false,
    cabextract_installed: true,
    gstreamer_installed: true,
    deps_ok: true,
    installed_deps: ['vcrun2019', 'ucrt'],
    missing_deps: [],
    graphics_backend: 'dxmt',
    launcher_backend: 'wined3d',
    can_install: true,
    can_launch: true,
    can_uninstall: true
  }
  const noop = () => () => {}
  const ok = (message = 'OK') => Promise.resolve({ success: true, message })
  window.api = {
    getLocale: () => Promise.resolve('es'),
    setLocale: (l) => Promise.resolve(l),
    getSystemStatus: () => Promise.resolve({
      setup: setupState,
      hardware: { chip: 'Apple M1', arch: 'arm64', macos_version: '15.0', ram_gb: 16, has_rosetta2: true }
    }),
    getSetupState: () => Promise.resolve(setupState),
    setupDownloadComponent: ok,
    setupDownloadAll: ok,
    getSetupWizardState: () => Promise.resolve(wizardState),
    skipSetupWizard: ok,
    setupInstallSystemDeps: ok,
    setupRunWizard: ok,
    getBattleNetStatus: () => Promise.resolve(battleNetStatus),
    battleNetInstall: ok,
    battleNetRepair: ok,
    battleNetLaunch: ok,
    battleNetUninstall: ok,
    battleNetCheckClient: ok,
    battleNetCancel: ok,
    getWineVersions: () => Promise.resolve({ versions: [] }),
    getWineInstalled: () => Promise.resolve({
      installed: [{ id: 'wine-staging-11.6', label: 'Wine Staging 11.6' }],
      active: 'wine-staging-11.6'
    }),
    listBottles: () => Promise.resolve({
      bottles: [{ name: 'battlenet', path: '~/.kalimotxo/bottles/battlenet' }]
    }),
    on: noop
  }
  window.platform = 'darwin'
})()
`

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2
  })
  await context.addInitScript(MOCK_API)

  const page = await context.newPage()

  for (const { file, path } of VIEWS) {
    const url = `${BASE_URL}${path}`
    console.log('Capturing', file, '…')
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.waitForTimeout(800)
    await page.screenshot({
      path: join(OUT_DIR, `${file}.png`),
      fullPage: false
    })
  }

  await browser.close()
  console.log('Done →', OUT_DIR)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
