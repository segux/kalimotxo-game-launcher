import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

jest.mock('../../../bottle', () => ({
  getBottlePath: (name: string) => join(global.__TEST_BOTTLE__, name)
}))

import { isClientComplete } from '../client'

declare global {
  // eslint-disable-next-line no-var
  var __TEST_BOTTLE__: string
}

const BOTTLE = 'Battle.net'

function setupBottle(): string {
  const root = mkdtempSync(join(tmpdir(), 'kalimotxo-test-'))
  global.__TEST_BOTTLE__ = root
  const drive = join(root, BOTTLE, 'drive_c', 'Program Files (x86)', 'Battle.net')
  mkdirSync(drive, { recursive: true })
  writeFileSync(
    join(root, BOTTLE, 'drive_c', 'Program Files (x86)', 'Battle.net', 'Battle.net.exe'),
    ''
  )
  return drive
}

afterEach(() => {
  if (global.__TEST_BOTTLE__) {
    rmSync(global.__TEST_BOTTLE__, { recursive: true, force: true })
  }
})

describe('isClientComplete', () => {
  it('returns false without exe', () => {
    const root = mkdtempSync(join(tmpdir(), 'kalimotxo-test-'))
    global.__TEST_BOTTLE__ = root
    expect(isClientComplete(BOTTLE)).toBe(false)
    rmSync(root, { recursive: true, force: true })
  })

  it('returns true when patch.result is 1', () => {
    const bnet = setupBottle()
    writeFileSync(join(bnet, '.patch.result'), '1')
    expect(isClientComplete(BOTTLE)).toBe(true)
  })

  it('returns true when libcef.dll exists in version dir', () => {
    const bnet = setupBottle()
    const ver = join(bnet, 'Battle.net.12345')
    mkdirSync(ver, { recursive: true })
    writeFileSync(join(ver, 'libcef.dll'), 'x')
    expect(isClientComplete(BOTTLE)).toBe(true)
  })
})
