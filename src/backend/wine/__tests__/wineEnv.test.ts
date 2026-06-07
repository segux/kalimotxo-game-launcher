import { setupWineEnvVars } from '../wineEnv'
import type { WineInstallation } from '../types'

const wineInstall: WineInstallation = {
  bin: '/fake/wine',
  name: 'Test Wine',
  type: 'wine'
}

const crossoverInstall: WineInstallation = {
  bin: '/fake/crossover/wine',
  name: 'CrossOver',
  type: 'crossover'
}

describe('setupWineEnvVars (Heroic-style)', () => {
  it('sets WINEPREFIX and disables winemenubuilder for wine', () => {
    const env = setupWineEnvVars({}, wineInstall, {
      winePrefix: '/tmp/prefix',
      battleNetLaunch: true
    })
    expect(env.WINE).toBe('/fake/wine')
    expect(env.WINEPREFIX).toBe('/tmp/prefix')
    expect(env.CX_BOTTLE).toBeUndefined()
    expect(String(env.WINEDLLOVERRIDES)).toContain('winemenubuilder.exe=d')
    // VA_ALLOC es solo para juegos; en el cliente Battle.net no se pone.
    expect(env.WINE_DISABLE_VA_ALLOC).toBeUndefined()
    expect(env.WINEESYNC).toBeUndefined()
  })

  it('forces builtin vulkan-1 on Battle.net client launch', () => {
    const env = setupWineEnvVars({}, wineInstall, {
      winePrefix: '/tmp/prefix',
      battleNetLaunch: true
    })
    // ANGLE debe usar el winevulkan de Wine (con VK_KHR_win32_surface), no el
    // SwiftShader que Battle.net empaqueta como vulkan-1.dll.
    expect(String(env.WINEDLLOVERRIDES)).toContain('vulkan-1=b')
  })

  it('does not force vulkan-1 builtin for game launches', () => {
    const env = setupWineEnvVars({}, wineInstall, {
      winePrefix: '/tmp/prefix',
      battleNetLaunch: true,
      gameLaunch: true
    })
    expect(String(env.WINEDLLOVERRIDES)).not.toContain('vulkan-1=b')
  })

  it('uses CX_BOTTLE for crossover', () => {
    const env = setupWineEnvVars({}, crossoverInstall, {
      winePrefix: '/tmp/prefix',
      crossoverBottle: 'Battle.net'
    })
    expect(env.CX_BOTTLE).toBe('Battle.net')
    expect(env.WINEPREFIX).toBeUndefined()
  })
})
