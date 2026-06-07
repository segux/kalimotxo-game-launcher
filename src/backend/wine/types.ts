export type WineLayerType = 'wine' | 'crossover' | 'toolkit'

export interface WineInstallation {
  bin: string
  wineserver?: string
  name: string
  type: WineLayerType
}

export type WineLayerPreference = 'runtime' | 'crossover' | 'auto'

export interface KalimotxoWineSettings {
  wineLayer: WineLayerPreference
  crossoverBottle: string
}
