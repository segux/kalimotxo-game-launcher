import { mkdirSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { fixBrokenUpdateFolders } from '../client'

jest.mock('../../../bottle', () => ({
  getBottlePath: (name: string) => join(global.__TEST_BOTTLE__, name)
}))

declare global {
  // eslint-disable-next-line no-var
  var __TEST_BOTTLE__: string
}

afterEach(() => {
  if (global.__TEST_BOTTLE__) rmSync(global.__TEST_BOTTLE__, { recursive: true, force: true })
})

describe('fixBrokenUpdateFolders', () => {
  it('removes empty broken version folders', () => {
    const root = mkdtempSync(join(tmpdir(), 'kalimotxo-fix-'))
    global.__TEST_BOTTLE__ = root
    const bnet = join(root, 'Battle.net', 'drive_c', 'Program Files (x86)', 'Battle.net')
    const broken = join(bnet, 'Battle.net.99999')
    mkdirSync(broken, { recursive: true })
    writeFileSync(join(broken, 'readme.txt'), 'stub')
    const n = fixBrokenUpdateFolders('Battle.net')
    expect(n).toBeGreaterThanOrEqual(0)
    expect(existsSync(broken)).toBe(false)
  })
})
