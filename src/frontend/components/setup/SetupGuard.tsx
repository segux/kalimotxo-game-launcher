import { useCallback, useLayoutEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { LoadingSplash } from '../brand/LoadingSplash'

const SKIP_SESSION_KEY = 'kalimotxo_wizard_skipped'

export const SETUP_ACCESS_EVENT = 'kalimotxo-setup-access'

export function markSetupAccessGranted(): void {
  try {
    sessionStorage.setItem(SKIP_SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(SETUP_ACCESS_EVENT))
}

function readSessionSkip(): boolean {
  try {
    return sessionStorage.getItem(SKIP_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

/** El launcher siempre es accesible; el asistente en /setup es opcional. */
export default function SetupGuard() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const previewMode =
    import.meta.env.VITE_UI_PREVIEW === '1' || searchParams.get('preview') === '1'

  const [ready, setReady] = useState(previewMode || readSessionSkip())

  const boot = useCallback(async () => {
    if (previewMode || readSessionSkip()) {
      setReady(true)
      return
    }
    try {
      await window.api.getSetupWizardState()
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [previewMode])

  useLayoutEffect(() => {
    void boot()
  }, [boot, pathname])

  if (!ready) {
    return <LoadingSplash statusKey="statusDefault" className="h-full" />
  }

  if (pathname.startsWith('/setup')) {
    return <Outlet />
  }

  return <Outlet />
}
