/**
 * Verificación real del onboarding (sistema + runtime + Battle.net automatizado).
 * Ejecutar: RUN_ONBOARDING=1 pnpm test -- src/backend/__tests__/onboarding.integration.test.ts
 */
import { existsSync } from 'fs'
import { DATA_DIR } from '../config/paths'
import { getSetupWizardState, runSetupWizard } from '../setup/wizard'
import { getBattleNetStatus } from '../storeManagers/battlenet/service'
import { findWine64, isSetupComplete } from '../setup/runtime'
import { installSystemDependencies } from '../setup/systemInstaller'

const RUN = process.env.RUN_ONBOARDING === '1'
const SKIP_BATTLENET = process.env.SKIP_BATTLENET_INSTALL === '1'

const describeIf = RUN ? describe : describe.skip

describeIf('onboarding integration (live machine)', () => {
  jest.setTimeout(45 * 60 * 1000)

  it('system dependencies are installable', async () => {
    const before = getSetupWizardState()
    if (!before.system_ready) {
      const r = await installSystemDependencies((m) => process.stdout.write(m + '\n'))
      expect(r.success).toBe(true)
    }
    const after = getSetupWizardState()
    expect(after.system_ready).toBe(true)
    expect(after.checks.cabextract.installed).toBe(true)
    expect(after.checks.gstreamer.installed).toBe(true)
  })

  it('runtime downloads and isSetupComplete', async () => {
    const before = getSetupWizardState()
    if (!before.runtime_ready) {
      const { downloadAll } = await import('../setup/runtime')
      const r = await downloadAll()
      expect(r.success).toBe(true)
    }
    expect(isSetupComplete()).toBe(true)
    expect(findWine64()).not.toBeNull()
  })

  it('runSetupWizard chains Battle.net when enabled', async () => {
    if (SKIP_BATTLENET) return
    const state = getSetupWizardState()
    expect(state.wizard_complete).toBe(true)

    const bnBefore = getBattleNetStatus()
    if (bnBefore.client_complete) {
      expect(bnBefore.can_launch).toBe(true)
      return
    }

    const r = await runSetupWizard(
      (m) => process.stdout.write(`[wizard] ${m}\n`),
      { installBattleNet: true }
    )
    expect(r.success).toBe(true)

    const bn = getBattleNetStatus()
    expect(bn.runtime_ready).toBe(true)
    expect(bn.kalimotxo_setup_done || bn.bottle_exists).toBe(true)
    expect(existsSync(DATA_DIR)).toBe(true)
  })
})
