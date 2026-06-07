export interface BattleNetStatus {
  bottle_exists: boolean
  installed: boolean
  client_exe: boolean
  client_complete: boolean
  exe_found: boolean
  awaiting_blizzard_wizard: boolean
  kalimotxo_setup_done: boolean
  client_watch_running: boolean
  launcher_path: string | null
  client_path: string | null
  installer_cached: boolean
  runtime_ready: boolean
  install_running: boolean
  repair_running: boolean
  cabextract_installed: boolean
  gstreamer_installed: boolean
  deps_ok: boolean
  installed_deps: string[]
  missing_deps: string[]
  graphics_backend: string | null
  launcher_backend: string
  can_install: boolean
  can_launch: boolean
  can_repair: boolean
  can_check_client: boolean
  can_uninstall: boolean
  installed_games: {
    id: string
    name: string
    exePath: string
    backend: string
    rating: number
  }[]
  d3dmetal_ready: boolean
}

export interface InstallProgress {
  phase: string
  percent: number
  message: string
}

export interface OpResult {
  success: boolean
  message: string
}
