import { chmodSync, copyFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

import { DATA_DIR, LOGS_DIR } from '../../config/paths'

const SCRIPT_NAME = 'macos-battlenet-oauth-browser.sh'

function bundledScriptSource(): string {
  return join(__dirname, '../../../../scripts', SCRIPT_NAME)
}

export function ensureOAuthBrowserScript(): string {
  const destDir = join(DATA_DIR, 'bin')
  const dest = join(destDir, SCRIPT_NAME)
  mkdirSync(destDir, { recursive: true })
  mkdirSync(LOGS_DIR, { recursive: true })
  const src = bundledScriptSource()
  if (existsSync(src)) {
    copyFileSync(src, dest)
    chmodSync(dest, 0o755)
  } else if (!existsSync(dest)) {
    throw new Error(`OAuth browser script missing: ${src}`)
  }
  return dest
}
