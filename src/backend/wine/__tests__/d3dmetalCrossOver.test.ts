import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

import { installD3dmetalFromCrossOver } from '../d3dmetalSetup'
import { D3DMETAL_DIR } from '../../config/paths'

describe('installD3dmetalFromCrossOver', () => {
  const cxRoot = join(
    homedir(),
    'Downloads',
    'CrossOver.app',
    'Contents',
    'SharedSupport',
    'CrossOver',
    'lib64',
    'apple_gptk',
    'external'
  )

  it('finds D3DMetal in CrossOver lib64/apple_gptk/external when present', () => {
    if (!existsSync(join(cxRoot, 'D3DMetal.framework'))) {
      return
    }
    const [ok, msg] = installD3dmetalFromCrossOver()
    expect(ok).toBe(true)
    expect(msg).toMatch(/D3DMetal/)
    expect(existsSync(join(D3DMETAL_DIR, 'D3DMetal.framework'))).toBe(true)
  })
})
