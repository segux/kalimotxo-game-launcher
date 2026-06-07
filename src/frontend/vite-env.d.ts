/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UI_PREVIEW: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

import type api from '../preload/api'

declare global {
  interface Window {
    api: typeof api
    platform: string
  }
}

export {}
