import { homedir } from 'os'
import { join } from 'path'
import { existsSync } from 'fs'
import {
  componentHasDllFolders,
  findWine64InTree,
  isDxmtInstalled,
  isWineInstalled
} from '../runtimePaths'

const legacyWine = join(homedir(), '.macbattlenet', 'runtime', 'wine')

describe('runtimePaths', () => {
  it('detects Wine Staging.app layout when present on disk', () => {
    if (!existsSync(legacyWine)) return
    const wine = findWine64InTree(legacyWine)
    expect(wine).not.toBeNull()
    expect(wine!.endsWith('/wine') || wine!.endsWith('/wine64')).toBe(true)
  })

  it('detects nested DXMT DLL folders', () => {
    const legacyDxmt = join(homedir(), '.macbattlenet', 'runtime', 'dxmt')
    if (!existsSync(legacyDxmt)) return
    expect(componentHasDllFolders(legacyDxmt, 'x86_64-windows', 'i386-windows')).toBe(true)
  })

  it('isWineInstalled reflects findWine64InTree', () => {
    if (!existsSync(legacyWine)) return
    expect(isWineInstalled()).toBe(true)
  })

  it('isDxmtInstalled with legacy data dir', () => {
    const legacyDxmt = join(homedir(), '.macbattlenet', 'runtime', 'dxmt')
    if (!existsSync(legacyDxmt)) return
    expect(isDxmtInstalled()).toBe(true)
  })
})
