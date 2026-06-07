import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import type { AsyncIPCFunctions, FrontendMessages } from '../common/types/ipc'

let mainWindow: BrowserWindow | null = null

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function addHandler<ChannelName extends keyof AsyncIPCFunctions>(
  channel: ChannelName,
  handler: (
    _e: IpcMainInvokeEvent,
    ...args: Parameters<AsyncIPCFunctions[ChannelName]>
  ) =>
    | ReturnType<AsyncIPCFunctions[ChannelName]>
    | Promise<ReturnType<AsyncIPCFunctions[ChannelName]>>
): void {
  ipcMain.removeHandler(channel)
  ipcMain.handle(
    channel,
    (event: IpcMainInvokeEvent, ...args: unknown[]) =>
      handler(event, ...(args as Parameters<AsyncIPCFunctions[ChannelName]>))
  )
}

export function sendFrontendMessage<ChannelName extends keyof FrontendMessages>(
  channel: ChannelName,
  ...args: Parameters<FrontendMessages[ChannelName]>
): boolean {
  const win = getMainWindow()
  if (!win) return false
  win.webContents.send(channel, ...args)
  return true
}
