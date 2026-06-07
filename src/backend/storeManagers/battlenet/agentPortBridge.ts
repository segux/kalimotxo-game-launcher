import net from 'net'
import { readFileSync } from 'fs'
import { join } from 'path'

import { battleNetDriveC } from './prefix'
import { BATTLENET_BOTTLE } from './constants'
import { logInfo } from '../../logger'

/**
 * The Battle.net client ALWAYS connects to the fixed port 127.0.0.1:1120 to talk
 * to the Update Agent (its local REST API). But under Wine the Agent does NOT
 * listen on 1120: it binds an ephemeral port and writes it to
 * `C:\ProgramData\Battle.net\Agent.dat`. The client never reads that file, so its
 * `AgentClient` gets `CURL error=7` (connection refused) in a loop, the Agent
 * shuts down with "No Connected Clients" and `BLZBNTBNA00000005` appears.
 *
 * On real Windows the Agent is a persistent process/service that is already
 * listening when the client starts, so the mechanism works. Under Wine we bridge
 * it: we listen on the host's 127.0.0.1:1120 (the same loopback Wine sees) and
 * forward every connection to the Agent's real port read from `Agent.dat`.
 *
 * See docs/battlenet-wine-problemas-y-roadmap.md (2026-06-04 session, Agent IPC).
 */

const AGENT_FIXED_PORT = 1120

let server: net.Server | null = null

function agentDatPath(bottleName: string): string {
  return join(battleNetDriveC(bottleName), 'ProgramData', 'Battle.net', 'Agent.dat')
}

export function readAgentPort(bottleName = BATTLENET_BOTTLE): number | null {
  try {
    const raw = readFileSync(agentDatPath(bottleName), 'utf-8').trim()
    const port = Number.parseInt(raw, 10)
    return Number.isInteger(port) && port > 0 && port < 65536 ? port : null
  } catch {
    return null
  }
}

function pipeConnection(client: net.Socket, resolvePort: () => number | null): void {
  const port = resolvePort()
  if (!port) {
    client.destroy()
    return
  }
  const upstream = net.connect({ host: '127.0.0.1', port })
  const cleanup = (): void => {
    client.destroy()
    upstream.destroy()
  }
  client.on('error', cleanup)
  upstream.on('error', cleanup)
  client.pipe(upstream)
  upstream.pipe(client)
}

export type AgentPortBridgeOptions = {
  /** Bridge listen port; defaults to the fixed 1120 the client uses. */
  listenPort?: number
  /** Target (Agent) port resolver; defaults to reading the bottle's Agent.dat. */
  resolvePort?: () => number | null
}

/**
 * Starts (idempotent) the 1120 -> Agent port bridge. It stays alive for the
 * lifetime of the app; relaunching Battle.net does not require restarting it.
 */
export function startAgentPortBridge(
  bottleName = BATTLENET_BOTTLE,
  options: AgentPortBridgeOptions = {}
): net.Server | null {
  if (server) return server
  const listenPort = options.listenPort ?? AGENT_FIXED_PORT
  const resolvePort = options.resolvePort ?? ((): number | null => readAgentPort(bottleName))
  const srv = net.createServer((client) => pipeConnection(client, resolvePort))
  srv.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      // Something already listens on 1120 (another instance, a previous bridge,
      // or an Agent variant that does bind 1120). Not fatal.
      logInfo('[agentPortBridge] 1120 already in use - assuming bridge is active')
    } else {
      logInfo(`[agentPortBridge] error: ${err.message}`)
    }
    if (server === srv) server = null
  })
  srv.listen(listenPort, '127.0.0.1', () => {
    logInfo(`[agentPortBridge] bridge ${listenPort} -> Agent.dat active (bottle ${bottleName})`)
  })
  server = srv
  return srv
}

export function stopAgentPortBridge(): void {
  if (!server) return
  try {
    server.close()
  } catch {
    /* ignore */
  }
  server = null
}

export function isAgentPortBridgeRunning(): boolean {
  return server !== null && server.listening
}
