import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  Circle,
  Download,
  Loader2,
  Monitor,
  Package,
  Sparkles
} from 'lucide-react'
import type { BattleNetStatus } from 'common/types/battlenet'
import type { SetupWizardState } from 'common/types/ipc'
import { Button } from '../components/ui/button'
import { LoadingSplash } from '../components/brand/LoadingSplash'
import { KalimotxoLogo } from '../components/brand/KalimotxoLogo'
import { markSetupAccessGranted } from '../components/setup/SetupGuard'
import { translateProgressMessage } from '../i18n'
import { cn } from '../lib/utils'

type StepId = 'welcome' | 'system' | 'runtime' | 'battlenet' | 'done'

export default function SetupWizardScreen() {
  const { t } = useTranslation(['setup', 'common', 'stores'])
  const navigate = useNavigate()
  const [wizard, setWizard] = useState<SetupWizardState | null>(null)
  const [bnet, setBnet] = useState<BattleNetStatus | null>(null)
  const [step, setStep] = useState<StepId>('welcome')
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState({ percent: 0, message: '' })
  const [bnetProgress, setBnetProgress] = useState('')

  const STEPS: { id: StepId; label: string }[] = [
    { id: 'welcome', label: t('steps.welcome') },
    { id: 'system', label: t('steps.system') },
    { id: 'runtime', label: t('steps.runtime') },
    { id: 'battlenet', label: t('steps.battlenet') },
    { id: 'done', label: t('steps.done') }
  ]

  const refreshBnet = useCallback(async () => {
    try {
      setBnet(await window.api.getBattleNetStatus())
    } catch {
      /* ignore */
    }
  }, [])

  const refresh = useCallback(async () => {
    const s = await window.api.getSetupWizardState()
    setWizard(s)
    await refreshBnet()
    if (step === 'done') return s
    if (s.wizard_complete) {
      const status = await window.api.getBattleNetStatus()
      if (status.client_complete) setStep('done')
      else if (step === 'welcome' || step === 'system' || step === 'runtime') setStep('battlenet')
    } else if (s.system_ready && step !== 'welcome') setStep('runtime')
    else if (!s.system_ready && step !== 'welcome') setStep('system')
    return s
  }, [step, refreshBnet])

  useEffect(() => {
    refresh()
    const offSetup = window.api.on('setupProgress', (p) => {
      const msg = translateProgressMessage(p.message)
      setProgress({ percent: p.percent, message: msg })
      setLog((prev) => [...prev.slice(-80), `[${p.component}] ${msg}`])
      if (p.component === 'battlenet' && p.percent >= 100) void refreshBnet()
    })
    const offBnet = window.api.on('battleNetInstallProgress', (p) => {
      setBnetProgress(`${p.percent}% — ${p.message}`)
      setLog((prev) => [...prev.slice(-80), `[battlenet] ${p.message}`])
    })
    const offDone = window.api.on('battleNetInstallFinished', () => {
      void refreshBnet()
    })
    const offStatus = window.api.on('battleNetStatus', setBnet)
    return () => {
      offSetup()
      offBnet()
      offDone()
      offStatus()
    }
  }, [refresh, refreshBnet])

  const appendLog = (line: string) => setLog((prev) => [...prev.slice(-80), line])

  const installSystem = async () => {
    setBusy(true)
    setError(null)
    setStep('system')
    appendLog(t('system.logInstalling'))
    try {
      const r = await window.api.setupInstallSystemDeps()
      appendLog(r.message)
      if (!r.success) setError(r.message)
      await refresh()
      if (r.success) setStep('runtime')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const installRuntime = async () => {
    setBusy(true)
    setError(null)
    appendLog(t('runtime.logDownloading'))
    try {
      const r = await window.api.setupDownloadAll()
      appendLog(r.message)
      if (!r.success) setError(r.message)
      const s = await refresh()
      if (s.wizard_complete) setStep('battlenet')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const installBattleNet = async () => {
    setBusy(true)
    setError(null)
    setBnetProgress('')
    appendLog(t('battlenet.logInstalling'))
    try {
      const r = await window.api.battleNetInstall()
      appendLog(r.message)
      if (!r.success) {
        setError(r.message)
        setBusy(false)
        return
      }
      await new Promise<void>((resolve) => {
        const off = window.api.on('battleNetInstallFinished', (result) => {
          off()
          appendLog(result.message)
          if (!result.success) setError(result.message)
          void refreshBnet().then(resolve)
        })
        const poll = window.setInterval(async () => {
          const s = await window.api.getBattleNetStatus()
          if (!s.install_running) {
            window.clearInterval(poll)
            off()
            resolve()
          }
        }, 800)
      })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const skipWizard = () => {
    setError(null)
    markSetupAccessGranted()
    navigate('/', { replace: true })
    void window.api.skipSetupWizard().catch((e) => {
      console.error('skipSetupWizard:', e)
    })
  }

  const runAll = async () => {
    setBusy(true)
    setError(null)
    setStep('system')
    setLog([])
    try {
      const r = await window.api.setupRunWizard({ installBattleNet: true })
      appendLog(r.message)
      if (!r.success) setError(r.message)
      const s = await refresh()
      if (s.wizard_complete) {
        const status = await window.api.getBattleNetStatus()
        setStep(status.client_complete ? 'done' : 'battlenet')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const splashMessage = bnetProgress || progress.message

  if (busy && step !== 'welcome') {
    return (
      <LoadingSplash
        statusKey={step === 'battlenet' ? 'statusBattleNet' : 'statusSetup'}
        percent={progress.percent}
        statusText={splashMessage || undefined}
        className="min-h-full"
      />
    )
  }

  return (
    <div className="launcher-bg flex min-h-full flex-col">
      <header className="drag-region border-b border-white/[0.06] px-8 py-5 pt-12">
        <div className="no-drag mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <KalimotxoLogo variant="icon" size={40} />
            <div>
              <h1 className="text-xl font-bold">{t('wizardTitle')}</h1>
              <p className="text-sm text-white/50">{t('wizardSubtitle')}</p>
            </div>
          </div>
          {step !== 'done' && (
            <Button variant="ghost" className="shrink-0 px-3 py-1.5 text-sm text-white/45" onClick={skipWizard}>
              {t('welcome.skip')}
            </Button>
          )}
        </div>
      </header>

      <div className="no-drag mx-auto w-full max-w-3xl flex-1 px-8 py-8">
        <ol className="mb-8 flex justify-between gap-2">
          {STEPS.map((s, i) => {
            const done = i < stepIndex || (step === 'done' && i < STEPS.length)
            const active = s.id === step
            return (
              <li key={s.id} className="flex flex-1 flex-col items-center gap-1">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold',
                    done && 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300',
                    active && !done && 'border-kal-accent bg-kal-accent/20 text-kal-accent-hover',
                    !done && !active && 'border-white/15 text-white/35'
                  )}
                >
                  {done ? <CheckCircle2 size={16} /> : i + 1}
                </span>
                <span className="hidden text-[10px] text-white/45 sm:block">{s.label}</span>
              </li>
            )
          })}
        </ol>

        <div className="rounded-2xl border border-white/[0.08] bg-kal-panel/80 p-6 backdrop-blur">
          {step === 'welcome' && (
            <div className="space-y-4 text-center sm:text-left">
              <KalimotxoLogo variant="full" size={200} className="mx-auto sm:mx-0" />
              <Sparkles className="mx-auto sm:mx-0 text-kal-accent" size={32} />
              <h2 className="text-2xl font-semibold">{t('welcome.title')}</h2>
              <p className="text-sm text-white/65 leading-relaxed">{t('welcome.body')}</p>
              <ul className="space-y-2 text-left text-sm text-white/55">
                <li className="flex gap-2">
                  <Monitor size={18} className="shrink-0 text-white/40" />
                  {t('welcome.itemSystem')}
                </li>
                <li className="flex gap-2">
                  <Package size={18} className="shrink-0 text-white/40" />
                  {t('welcome.itemRuntime')}
                </li>
                <li className="flex gap-2">
                  <Download size={18} className="shrink-0 text-white/40" />
                  {t('welcome.itemBattleNet')}
                </li>
              </ul>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button className="w-full sm:w-auto" onClick={() => setStep('system')}>
                  {t('actions.start', { ns: 'common' })}
                </Button>
                <Button variant="ghost" className="w-full text-white/50 sm:w-auto" onClick={skipWizard}>
                  {t('welcome.skip')}
                </Button>
              </div>
              <p className="text-xs text-white/40">{t('welcome.skipHint')}</p>
            </div>
          )}

          {step === 'system' && wizard && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('system.title')}</h2>
              <CheckRow ok={wizard.checks.homebrew.installed} label={t('system.homebrew')} />
              <CheckRow
                ok={wizard.checks.xcode_clt.installed}
                label={t('system.xcodeClt')}
                hint={wizard.checks.xcode_clt.installed ? undefined : t('system.xcodeCltHint')}
              />
              <CheckRow
                ok={wizard.checks.cabextract.installed}
                label={t('system.cabextract')}
                hint={wizard.checks.cabextract.install_hint}
              />
              <CheckRow
                ok={wizard.checks.gstreamer.installed}
                label={t('system.gstreamer')}
                hint={wizard.checks.gstreamer.install_hint}
              />
              <CheckRow ok={wizard.checks.rosetta.installed} label={t('system.rosetta')} />
              <p className="text-xs text-white/45">{t('system.hint')}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button disabled={busy} onClick={installSystem}>
                  {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                  {t('system.installDeps')}
                </Button>
                {wizard.system_ready && (
                  <Button variant="outline" onClick={() => setStep('runtime')}>
                    {t('actions.next', { ns: 'common' })}
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 'runtime' && wizard && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('runtime.title')}</h2>
              <p className="text-sm text-white/55">{t('runtime.body')}</p>
              <ul className="space-y-1 text-sm">
                {Object.entries(wizard.download_status).map(([k, v]) => (
                  <li key={k} className="flex items-center gap-2">
                    {v ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <Circle size={16} className="text-white/25" />
                    )}
                    <span className={v ? 'text-white/80' : 'text-white/45'}>{k}</span>
                  </li>
                ))}
              </ul>
              {(busy || progress.message) && (
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-kal-accent transition-all"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/50">{progress.message}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={installRuntime}>
                  {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                  {t('runtime.download')}
                </Button>
                {wizard.runtime_ready && (
                  <Button variant="outline" onClick={() => setStep('battlenet')}>
                    {t('actions.next', { ns: 'common' })}
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 'battlenet' && bnet && wizard && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('battlenet.title')}</h2>
              <p className="text-sm text-white/55">{t('battlenet.body')}</p>
              <CheckRow ok={wizard.runtime_ready} label={t('stores:battlenet.badgeRuntime')} />
              <CheckRow ok={bnet.deps_ok} label={t('stores:battlenet.badgeDlls')} />
              <CheckRow
                ok={bnet.client_complete}
                label={t('stores:battlenet.badgeClient')}
              />
              {bnet.awaiting_blizzard_wizard && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                  {t('battlenet.blizzardWizard')}
                </p>
              )}
              {bnetProgress && <p className="text-xs text-white/50">{bnetProgress}</p>}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  disabled={busy || !bnet.can_install || bnet.install_running}
                  onClick={installBattleNet}
                >
                  {busy || bnet.install_running ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : null}
                  {t('battlenet.install')}
                </Button>
                {bnet.awaiting_blizzard_wizard && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={async () => {
                      await window.api.battleNetLaunch()
                      await refreshBnet()
                    }}
                  >
                    {t('stores:battlenet.completeInstall')}
                  </Button>
                )}
                {(bnet.kalimotxo_setup_done || bnet.client_complete) && (
                  <Button variant="outline" onClick={() => setStep('done')}>
                    {t('actions.next', { ns: 'common' })}
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center sm:text-left">
              <CheckCircle2 className="mx-auto sm:mx-0 text-emerald-400" size={48} />
              <h2 className="text-2xl font-semibold">{t('done.title')}</h2>
              <p className="text-sm text-white/60">{t('done.body')}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Button onClick={() => navigate('/store/battlenet')}>{t('done.goBattleNet')}</Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  {t('done.goPlatforms')}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
        </div>

        {(step === 'welcome' || step === 'system' || step === 'runtime' || step === 'battlenet') && (
          <div className="mt-6 rounded-xl border border-kal-accent/30 bg-kal-accent/10 p-4">
            <p className="text-sm font-medium text-white/90">{t('auto.title')}</p>
            <p className="mt-1 text-xs text-white/55">{t('auto.body')}</p>
            <Button className="mt-3 w-full sm:w-auto" disabled={busy} onClick={runAll}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> {t('auto.busy')}
                </>
              ) : (
                t('auto.button')
              )}
            </Button>
          </div>
        )}

        {log.length > 0 && (
          <details className="mt-6 text-xs text-white/40">
            <summary className="cursor-pointer">{t('logTitle')}</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] text-white/60">
              {log.join('\n')}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

function CheckRow({
  ok,
  label,
  hint
}: {
  ok: boolean
  label: string
  hint?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-black/20 px-3 py-2">
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 size={18} className="text-emerald-400" />
        ) : (
          <Circle size={18} className="text-white/30" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      {!ok && hint && <code className="text-[10px] text-amber-200/80">{hint}</code>}
    </div>
  )
}
