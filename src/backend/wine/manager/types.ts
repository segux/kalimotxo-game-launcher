export interface WineRelease {
  version: string
  type: string
  repository_id: string
  date: string
  download: string
  downsize: number
  disksize: number
  checksum: string
  release_notes_link: string
  is_installed: boolean
  has_update: boolean
  install_dir: string
}

export interface WineInstallStatus {
  running: boolean
  version: string
  status: string
  percent: number
  message: string
}
