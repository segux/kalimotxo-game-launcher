import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Download, Home, Settings, Wine, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { KalimotxoLogo } from '../brand/KalimotxoLogo'

export default function LauncherLayout() {
  const { t } = useTranslation('common')
  const { pathname } = useLocation()
  const isStoreDetail = pathname.startsWith('/store/')

  const railItems = [
    { to: '/', label: t('nav.home'), icon: Home, end: true },
    { to: '/downloads', label: t('nav.downloads'), icon: Download },
    { to: '/wine', label: t('nav.wine'), icon: Wine },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
    { to: '/setup', label: t('nav.setup'), icon: Wrench }
  ]

  const topTabs = [
    { to: '/', label: t('nav.platforms'), end: true },
    { to: '/library', label: t('nav.library') }
  ]

  return (
    <div className="launcher-bg flex h-full">
      <aside className="drag-region flex w-[72px] shrink-0 flex-col items-center border-r border-white/[0.06] bg-kal-rail py-3 pt-10">
        <div className="no-drag mb-6">
          <KalimotxoLogo variant="icon" size={36} />
        </div>
        <nav className="no-drag flex flex-1 flex-col items-center gap-1">
          {railItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl transition',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/45 hover:bg-white/5 hover:text-white/80'
                )
              }
            >
              <Icon size={22} strokeWidth={1.75} />
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="no-drag flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-6 border-b border-white/[0.06] bg-kal-bg-elevated/80 px-6 backdrop-blur-md">
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-wide text-white/90">{t('appName')}</span>
            <span className="text-[10px] text-white/35 tracking-wide">{t('appTagline')}</span>
          </div>
          {!isStoreDetail && (
            <nav className="flex gap-1">
              {topTabs.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/45 hover:bg-white/5 hover:text-white/75'
                    )
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          )}
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
