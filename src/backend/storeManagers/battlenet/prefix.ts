import { join } from 'path'

import { getBottlePath } from '../../bottle'
import { BATTLENET_BOTTLE } from './constants'

/** Prefijo Wine de Kalimotxo (~/.kalimotxo/bottles/…). */
export function resolveBattleNetPrefix(bottleName = BATTLENET_BOTTLE): string {
  return getBottlePath(bottleName)
}

export function battleNetDriveC(bottleName = BATTLENET_BOTTLE): string {
  return join(resolveBattleNetPrefix(bottleName), 'drive_c')
}
