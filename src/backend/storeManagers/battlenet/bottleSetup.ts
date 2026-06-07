import { createBottle, getBottleConfig, listBottles, saveBottleConfig } from '../../bottle'
import { BATTLENET_BOTTLE, BATTLENET_LAUNCHER_BACKEND } from './constants'
import { prepareBottleForLauncher } from './launcherPrep'

export function createBattleNetBottle(): void {
  if (!listBottles().some((b) => b.name === BATTLENET_BOTTLE)) {
    createBottle(BATTLENET_BOTTLE, 'win10')
  }
  const cfg = getBottleConfig(BATTLENET_BOTTLE)
  cfg.graphics_backend = BATTLENET_LAUNCHER_BACKEND
  cfg.sync_mode = 'none'
  cfg.env_vars = {
    ...cfg.env_vars,
    WINE_SIMULATE_WRITECOPY: '1',
    WINE_DISABLE_VA_ALLOC: '1',
    WINEDLLOVERRIDES:
      'location=d;locationapi=d;vcruntime140_1=n,b;msvcp140_1=n,b;mf=n,b'
  }
  saveBottleConfig(BATTLENET_BOTTLE, cfg)
  prepareBottleForLauncher()
}
