import { execSync } from 'child_process'
import { existsSync } from 'fs'
import type { SystemChecks } from '../../common/types/ipc'
import {
  cabextractAvailable,
  gstreamerAvailable,
  resolveCabextractPath,
  resolveGstLaunchPath
} from '../setup/toolPaths'

function which(cmd: string): string | null {
  try {
    return execSync(`which ${cmd}`, { encoding: 'utf-8' }).trim() || null
  } catch {
    return null
  }
}

export function checkRosetta(): SystemChecks['rosetta'] {
  const installed = existsSync('/Library/Apple/usr/share/rosetta')
  return {
    installed,
    install_hint: installed ? undefined : 'softwareupdate --install-rosetta --agree-to-license'
  }
}

export function checkGstreamer(): SystemChecks['gstreamer'] {
  const path = resolveGstLaunchPath()
  return {
    installed: gstreamerAvailable(),
    install_hint: path ? undefined : 'Kalimotxo puede instalarlo con Homebrew desde el asistente'
  }
}

export function checkCabextract(): SystemChecks['cabextract'] {
  const path = resolveCabextractPath()
  return {
    installed: cabextractAvailable(),
    path,
    install_hint: path ? undefined : 'Kalimotxo puede descargarlo o instalarlo desde el asistente'
  }
}

export function checkHomebrew(): SystemChecks['homebrew'] {
  if (which('brew')) return { installed: true }
  if (existsSync('/opt/homebrew/bin/brew') || existsSync('/usr/local/bin/brew')) {
    return { installed: true }
  }
  return { installed: false }
}

export function checkXcodeClt(): SystemChecks['xcode_clt'] {
  try {
    execSync('xcode-select -p', { stdio: 'pipe' })
    return { installed: true }
  } catch {
    return { installed: false }
  }
}

export function checkAll(): SystemChecks {
  return {
    rosetta: checkRosetta(),
    gstreamer: checkGstreamer(),
    cabextract: checkCabextract(),
    homebrew: checkHomebrew(),
    xcode_clt: checkXcodeClt()
  }
}

export function systemReadyForWinetricks(): [boolean, string] {
  const checks = checkAll()
  if (!checks.cabextract.installed) {
    return [false, 'cabextract is required — brew install cabextract']
  }
  if (!checks.gstreamer.installed) {
    return [false, 'GStreamer is required for Wine audio — brew install gstreamer']
  }
  return [true, 'OK']
}
