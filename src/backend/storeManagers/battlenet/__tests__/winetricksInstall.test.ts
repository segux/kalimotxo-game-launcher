import {
  isRecoverableWinetricksFailure,
  shouldSkipWinetricksVerb
} from '../winetricksInstall'

describe('winetricksInstall', () => {
  it('skips vcrun2019 when vcrun2022 is installed', () => {
    expect(shouldSkipWinetricksVerb('vcrun2019', new Set(['vcrun2022']))).toBe(true)
    expect(shouldSkipWinetricksVerb('vcrun2022', new Set())).toBe(false)
  })

  it('treats vcrun2019 status 102 as recoverable', () => {
    expect(
      isRecoverableWinetricksFailure(
        'vcrun2019',
        false,
        'warning: Note: command wine vc_redist.x86.exe /q returned status 102. Aborting.'
      )
    ).toBe(true)
    expect(isRecoverableWinetricksFailure('d3dcompiler_47', false, 'fatal')).toBe(false)
  })
})
