#!/usr/bin/env node
/**
 * Genera build/icon.icns desde public/brand/kalimotxo-icon.png (macOS).
 */
import { mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'public/brand/kalimotxo-icon.png')
const outDir = join(root, 'build')
const iconset = join(outDir, 'icon.iconset')

const ICONSET_FILES = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024]
]

async function main() {
  mkdirSync(iconset, { recursive: true })
  for (const [name, size] of ICONSET_FILES) {
    await sharp(source).resize(size, size).png().toFile(join(iconset, name))
  }

  const { execSync } = await import('child_process')
  const icns = join(outDir, 'icon.icns')
  if (process.platform === 'darwin') {
    execSync(`iconutil -c icns "${iconset}" -o "${icns}"`, { stdio: 'inherit' })
    console.log('Wrote', icns)
  } else {
    await sharp(source).resize(1024, 1024).png().toFile(join(outDir, 'icon.png'))
    console.log('icon.icns requires macOS iconutil; wrote build/icon.png')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
