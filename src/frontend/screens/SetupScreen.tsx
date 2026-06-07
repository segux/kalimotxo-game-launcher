import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { Card, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { LoadingSplash } from '../components/brand/LoadingSplash'
import type { SetupState } from 'common/types/ipc'
import { translateProgressMessage } from '../i18n'

export default function SetupScreen() {
  const { t } = useTranslation('setup')
  const { t: tc } = useTranslation('common')
  const [state, setState] = useState<SetupState | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setState(await window.api.getSetupState())
  }, [])

  useEffect(() => {
    refresh()
    const off = window.api.on('setupProgress', (p) => {
      setMsg(`${p.component}: ${p.percent}% — ${translateProgressMessage(p.message)}`)
    })
    return off
  }, [refresh])

  const download = async (component: string) => {
    setBusy(true)
    setMsg(null)
    try {
      const r = await window.api.setupDownloadComponent(component)
      setMsg(r.message)
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const downloadAll = async () => {
    setBusy(true)
    try {
      const r = await window.api.setupDownloadAll()
      setMsg(r.message)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  if (!state) {
    return <LoadingSplash statusKey="statusSetup" compact showTips={false} />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardTitle>{t('settings.checksTitle')}</CardTitle>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex justify-between">
            Rosetta 2 <Badge ok={state.checks.rosetta.installed}>{tc('badge.ok')}</Badge>
          </li>
          <li className="flex justify-between">
            cabextract <Badge ok={state.checks.cabextract.installed}>{tc('badge.ok')}</Badge>
          </li>
          <li className="flex justify-between">
            GStreamer <Badge ok={state.checks.gstreamer.installed}>{tc('badge.ok')}</Badge>
          </li>
        </ul>
        {!state.checks.cabextract.installed && (
          <p className="mt-2 text-xs text-amber-200/80">{state.checks.cabextract.install_hint}</p>
        )}
      </Card>

      <Card>
        <CardTitle>{t('settings.runtimeTitle')}</CardTitle>
        <p className="mt-2 text-sm text-white/60">
          {t('settings.runtimeStatus', {
            status: state.runtime_ready
              ? t('settings.runtimeReady')
              : t('settings.runtimePending')
          })}
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {Object.entries(state.download_status).map(([k, v]) => (
            <li key={k} className="flex justify-between">
              {k}{' '}
              <Badge ok={v}>{v ? '✓' : tc('badge.pending')}</Badge>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => download('wine')}>
            Wine
          </Button>
          <Button disabled={busy} variant="outline" onClick={() => download('dxmt')}>
            DXMT
          </Button>
          <Button disabled={busy} variant="outline" onClick={() => download('winetricks')}>
            winetricks
          </Button>
          <Button
            disabled={busy}
            variant="outline"
            onClick={() => download('d3dmetal')}
          >
            {t('settings.installD3dmetal')}
          </Button>
          <Button disabled={busy} onClick={downloadAll}>
            {t('settings.installAll')}
          </Button>
          <Button
            disabled={busy}
            variant="outline"
            onClick={async () => {
              setBusy(true)
              setMsg(null)
              try {
                const r = await window.api.setupRepairRuntime()
                setMsg(r.message)
                await refresh()
              } catch (e) {
                setMsg(e instanceof Error ? e.message : String(e))
              } finally {
                setBusy(false)
              }
            }}
          >
            {t('settings.repairRuntime')}
          </Button>
        </div>
      </Card>
      {msg && <p className="text-sm text-white/70">{msg}</p>}
    </div>
  )
}
