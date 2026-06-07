import { filterWinetricksLogLine, isWinetricksNoiseLine } from '../winetricksLog'

describe('winetricksLog', () => {
  it('filters mmap and moltenvk noise', () => {
    expect(
      isWinetricksNoiseLine(
        '002c:err:virtual:try_map_free_area mmap() error Cannot allocate memory'
      )
    ).toBe(true)
    expect(isWinetricksNoiseLine('[mvk-info] MoltenVK version 1.4.1')).toBe(true)
    expect(filterWinetricksLogLine('Executing w_do_call vcrun2022')).toBe(
      'Executing w_do_call vcrun2022'
    )
  })
})
