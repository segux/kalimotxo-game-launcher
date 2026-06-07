import { ipcRenderer } from 'electron'
import { IPC_INVOKE_CHANNELS } from '../../common/types/ipcChannels'
import type { AsyncIPCFunctions, FrontendMessages } from '../../common/types/ipc'

type Api = {
  [K in keyof AsyncIPCFunctions]: (
    ...args: Parameters<AsyncIPCFunctions[K]>
  ) => Promise<Awaited<ReturnType<AsyncIPCFunctions[K]>>>
} & {
  on: <K extends keyof FrontendMessages>(
    channel: K,
    listener: (...args: Parameters<FrontendMessages[K]>) => void
  ) => () => void
}

const api = {} as Api

for (const ch of IPC_INVOKE_CHANNELS) {
  ;(api as Record<string, unknown>)[ch] = (...args: unknown[]) =>
    ipcRenderer.invoke(ch, ...args)
}

api.on = (channel, listener) => {
  const wrapper = (_: unknown, ...args: unknown[]) =>
    (listener as (...a: unknown[]) => void)(...args)
  ipcRenderer.on(channel, wrapper)
  return () => ipcRenderer.removeListener(channel, wrapper)
}

export default api
