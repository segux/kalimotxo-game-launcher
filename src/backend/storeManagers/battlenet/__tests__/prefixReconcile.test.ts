import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

import { backupBottleRegistry, bottlePrefixInitialized } from '../prefixReconcile'

jest.mock('../../../bottle', () => ({
  getBottlePath: (name: string) => join(global.__TEST_BOTTLE__, name)
}))

// Evita cargar el stack Wine real al importar prefixReconcile.
jest.mock('../../../launcher/wineRunner', () => ({
  buildEnv: () => ({}),
  getWineBinary: () => '/fake/wine',
  stopWineProcesses: () => undefined
}))

declare global {
  // eslint-disable-next-line no-var
  var __TEST_BOTTLE__: string
}

afterEach(() => {
  if (global.__TEST_BOTTLE__) rmSync(global.__TEST_BOTTLE__, { recursive: true, force: true })
})

describe('backupBottleRegistry', () => {
  it('copies present .reg files into a timestamped backup dir', () => {
    const root = mkdtempSync(join(tmpdir(), 'kalimotxo-reconcile-'))
    global.__TEST_BOTTLE__ = root
    const prefix = join(root, 'Battle.net')
    mkdirSync(prefix, { recursive: true })
    writeFileSync(join(prefix, 'system.reg'), 'WINE REGISTRY\n')
    writeFileSync(join(prefix, 'user.reg'), 'WINE REGISTRY\n')

    const backup = backupBottleRegistry('Battle.net')
    expect(backup).not.toBeNull()
    expect(existsSync(join(backup as string, 'system.reg'))).toBe(true)
    expect(existsSync(join(backup as string, 'user.reg'))).toBe(true)
    // No copia userdef.reg si no existe.
    expect(existsSync(join(backup as string, 'userdef.reg'))).toBe(false)
  })

  it('returns null when there are no registry files', () => {
    const root = mkdtempSync(join(tmpdir(), 'kalimotxo-reconcile-'))
    global.__TEST_BOTTLE__ = root
    mkdirSync(join(root, 'Battle.net'), { recursive: true })
    expect(backupBottleRegistry('Battle.net')).toBeNull()
  })
})

describe('bottlePrefixInitialized', () => {
  it('is false for a missing or empty drive_c', () => {
    const root = mkdtempSync(join(tmpdir(), 'kalimotxo-reconcile-'))
    global.__TEST_BOTTLE__ = root
    expect(bottlePrefixInitialized('Battle.net')).toBe(false)
    mkdirSync(join(root, 'Battle.net', 'drive_c'), { recursive: true })
    expect(bottlePrefixInitialized('Battle.net')).toBe(false)
  })

  it('is true when drive_c has contents', () => {
    const root = mkdtempSync(join(tmpdir(), 'kalimotxo-reconcile-'))
    global.__TEST_BOTTLE__ = root
    const driveC = join(root, 'Battle.net', 'drive_c', 'windows')
    mkdirSync(driveC, { recursive: true })
    expect(readdirSync(join(root, 'Battle.net', 'drive_c')).length).toBeGreaterThan(0)
    expect(bottlePrefixInitialized('Battle.net')).toBe(true)
  })
})
