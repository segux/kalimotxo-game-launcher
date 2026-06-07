import { existsSync, mkdirSync, writeFileSync, mkdtempSync, rmSync, statSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  bottleHasVcRuntime,
  bottleHasUcrt,
  deploySyswow64Ucrt,
  syncSyswow64VcDlls
} from '../deps'

jest.mock('../../../bottle', () => ({
  getBottlePath: (name: string) => join(global.__TEST_BOTTLE__, name),
  getBottleConfig: jest.fn(),
  saveBottleConfig: jest.fn()
}))

jest.mock('../prefix', () => ({
  resolveBattleNetPrefix: (name: string) => join(global.__TEST_BOTTLE__, name),
  battleNetDriveC: (name: string) =>
    join(global.__TEST_BOTTLE__, name, 'drive_c')
}))

declare global {
  // eslint-disable-next-line no-var
  var __TEST_BOTTLE__: string
}

const BOTTLE = 'Battle.net'

function syswow64(): string {
  return join(global.__TEST_BOTTLE__, BOTTLE, 'drive_c', 'windows', 'syswow64')
}

beforeEach(() => {
  const root = mkdtempSync(join(tmpdir(), 'kalimotxo-deps-'))
  global.__TEST_BOTTLE__ = root
  mkdirSync(syswow64(), { recursive: true })
})

afterEach(() => {
  rmSync(global.__TEST_BOTTLE__, { recursive: true, force: true })
})

describe('ensureLaunchDeps helpers', () => {
  it('syncSyswow64VcDlls copies from system32', () => {
    const s32 = join(global.__TEST_BOTTLE__, BOTTLE, 'drive_c', 'windows', 'system32')
    mkdirSync(s32, { recursive: true })
    writeFileSync(join(s32, 'vcruntime140.dll'), 'dll')
    const copied = syncSyswow64VcDlls(BOTTLE)
    expect(copied).toContain('vcruntime140.dll')
    expect(bottleHasVcRuntime(BOTTLE)).toBe(false)
  })

  it('removes oversized api-ms placeholders', () => {
    const sw = syswow64()
    const fake = join(sw, 'api-ms-win-crt-runtime-l1-1-0.dll')
    writeFileSync(fake, Buffer.alloc(90_000))
    deploySyswow64Ucrt(BOTTLE)
    const size = existsSync(fake) ? statSync(fake).size : 0
    expect(size).toBeLessThanOrEqual(80_000)
  })

  it('bottleHasUcrt accepts small forwarder', () => {
    writeFileSync(join(syswow64(), 'api-ms-win-crt-runtime-l1-1-0.dll'), Buffer.alloc(40_000))
    expect(bottleHasUcrt(BOTTLE)).toBe(true)
  })

  it('bottleHasUcrt accepts full ucrtbase.dll (CrossOver style)', () => {
    writeFileSync(join(syswow64(), 'ucrtbase.dll'), Buffer.alloc(200_000))
    expect(bottleHasUcrt(BOTTLE)).toBe(true)
  })
})
