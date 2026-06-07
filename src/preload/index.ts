import { contextBridge } from 'electron'
import api from './api'

contextBridge.exposeInMainWorld('api', api)
contextBridge.exposeInMainWorld('platform', process.platform)
