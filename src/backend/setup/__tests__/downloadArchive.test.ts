import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

import { isDxmtArchiveComplete } from '../downloadArchive'

describe('isDxmtArchiveComplete', () => {
  it('accepts a complete dxmt cache from GitHub', () => {
    const archive = join(homedir(), '.macbattlenet', 'cache', 'dxmt.tar.gz')
    if (!existsSync(archive)) return
    expect(isDxmtArchiveComplete(archive)).toBe(true)
  })
})
