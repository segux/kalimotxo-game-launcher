#!/usr/bin/env node
/** Descarga winetricks al bundle de la app (se ejecuta en postinstall). */
import { mkdirSync, writeFileSync, chmodSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

if (process.env.CI) {
  console.log('CI environment detected — skipping winetricks download')
  process.exit(0)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const destDir = join(root, 'resources', 'bundled')
const dest = join(destDir, 'winetricks')

const url =
  'https://raw.githubusercontent.com/Winetricks/winetricks/master/src/winetricks'

mkdirSync(destDir, { recursive: true })
const res = await fetch(url)
if (!res.ok) throw new Error(`winetricks download failed: ${res.status}`)
writeFileSync(dest, await res.text(), 'utf-8')
chmodSync(dest, 0o755)
console.log('Bundled winetricks →', dest)
