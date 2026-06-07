import { isWizardSkipped, setWizardSkipped } from '../config/wizardPrefs'
import { checkAll } from '../system/checks'
import { runInstallAndWait } from '../storeManagers/battlenet/service'
import { getDownloadStatus, isSetupComplete } from './runtime'
import { ensureRuntimeReady } from './ensureEnvironment'
import { cabextractAvailable, gstreamerAvailable } from './toolPaths'

function isSystemDepsReady(): boolean {
  return cabextractAvailable() && gstreamerAvailable()
}
import { sendFrontendMessage } from '../ipc'

export interface SetupWizardState {
  system_ready: boolean
  runtime_ready: boolean
  wizard_complete: boolean
  /** Usuario eligió explorar la app sin terminar el asistente. */
  wizard_skipped: boolean
  checks: ReturnType<typeof checkAll>
  download_status: Record<string, boolean>
}

export function getSetupWizardState(): SetupWizardState {
  const system_ready = isSystemDepsReady()
  const runtime_ready = isSetupComplete()
  const wizard_complete = system_ready && runtime_ready
  return {
    system_ready,
    runtime_ready,
    wizard_complete,
    wizard_skipped: isWizardSkipped(),
    checks: checkAll(),
    download_status: getDownloadStatus()
  }
}

/** Permite entrar al launcher sin instalar Wine ni dependencias. */
export function skipSetupWizard(): { success: boolean; message: string } {
  setWizardSkipped(true)
  return { success: true, message: 'wizard_skipped' }
}

export interface RunSetupWizardOptions {
  /** Tras el runtime, lanza la instalación automatizada de Battle.net (asistente Blizzard aparte). */
  installBattleNet?: boolean
}

export async function runSetupWizard(
  onLog?: (message: string) => void,
  options: RunSetupWizardOptions = {}
): Promise<{ success: boolean; message: string }> {
  const log = onLog ?? (() => {})

  sendFrontendMessage('setupProgress', {
    component: 'system',
    percent: 0,
    message: 'Comprobando dependencias del sistema…'
  })

  sendFrontendMessage('setupProgress', {
    component: 'system',
    percent: 10,
    message: 'Preparando herramientas y runtime…'
  })

  const [rtOk, rtMsg] = await ensureRuntimeReady(log)
  if (!rtOk) {
    sendFrontendMessage('setupProgress', {
      component: 'system',
      percent: 0,
      message: rtMsg
    })
    return { success: false, message: rtMsg }
  }

  sendFrontendMessage('setupProgress', {
    component: 'system',
    percent: 100,
    message: 'Sistema y runtime listos'
  })

  sendFrontendMessage('setupProgress', {
    component: 'runtime',
    percent: 100,
    message: 'Runtime Kalimotxo listo'
  })

  const state = getSetupWizardState()
  if (!state.wizard_complete) {
    return {
      success: false,
      message: 'Setup incompleto. Revisa cabextract, GStreamer y las descargas.'
    }
  }

  if (options.installBattleNet !== false) {
    sendFrontendMessage('setupProgress', {
      component: 'battlenet',
      percent: 0,
      message: 'setup.progress.battlenetStarting'
    })
    log('Instalando Battle.net (Wine, dependencias, instalador Blizzard)…')
    const bn = await runInstallAndWait()
    sendFrontendMessage('setupProgress', {
      component: 'battlenet',
      percent: bn.success ? 100 : 0,
      message: bn.message
    })
    if (!bn.success) {
      return {
        success: false,
        message: bn.message
      }
    }
    return {
      success: true,
      message:
        'Kalimotxo instaló Battle.net. Si aparece una ventana Wine, completa el asistente Blizzard para descargar juegos.'
    }
  }

  return { success: true, message: 'Kalimotxo está listo. Ya puedes instalar Battle.net.' }
}
