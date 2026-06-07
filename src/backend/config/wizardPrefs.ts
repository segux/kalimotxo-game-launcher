import { ensureDirectories, loadGlobalConfig, saveGlobalConfig } from './paths'

export function isWizardSkipped(): boolean {
  return loadGlobalConfig().wizard_skipped === true
}

export function setWizardSkipped(skipped: boolean): void {
  ensureDirectories()
  const cfg = loadGlobalConfig()
  cfg.wizard_skipped = skipped
  saveGlobalConfig(cfg)
}
