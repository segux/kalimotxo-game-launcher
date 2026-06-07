import { appendFileSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { LOGS_DIR } from './config/paths'

const LOG_FILE = join(LOGS_DIR, 'kalimotxo.log')

export function logInfo(message: string): void {
  log('INFO', message)
}

export function logError(message: string): void {
  log('ERROR', message)
}

export function logWarn(message: string): void {
  log('WARN', message)
}

function log(level: string, message: string): void {
  mkdirSync(LOGS_DIR, { recursive: true })
  const line = `${new Date().toISOString()} [${level}] ${message}\n`
  appendFileSync(LOG_FILE, line, 'utf-8')
  if (process.env.NODE_ENV === 'development') {
    console.log(line.trim())
  }
}

export function writeLogFile(name: string, content: string): void {
  mkdirSync(LOGS_DIR, { recursive: true })
  writeFileSync(join(LOGS_DIR, name), content, 'utf-8')
}

export function appendLogFile(name: string, content: string): void {
  mkdirSync(LOGS_DIR, { recursive: true })
  appendFileSync(join(LOGS_DIR, name), content, 'utf-8')
}
