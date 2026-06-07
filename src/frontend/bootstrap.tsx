import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import App from './App'
import { initI18n, i18n } from './i18n'
import './styles/globals.css'

async function main() {
  let locale: string | undefined
  try {
    locale = await window.api.getLocale()
  } catch {
    locale = 'es'
  }
  await initI18n(locale)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </StrictMode>
  )
}

main()
