import net from 'net'

import { startAgentPortBridge, stopAgentPortBridge } from '../agentPortBridge'

/** Starts an echo TCP server and returns its port. */
function startEchoServer(): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve) => {
    const srv = net.createServer((sock) => sock.pipe(sock))
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address() as net.AddressInfo
      resolve({ port: addr.port, close: () => srv.close() })
    })
  })
}

function findFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as net.AddressInfo).port
      srv.close(() => resolve(port))
    })
  })
}

describe('agentPortBridge', () => {
  const cleanups: Array<() => void> = []
  afterEach(() => {
    stopAgentPortBridge()
    while (cleanups.length) cleanups.pop()?.()
  })

  it('forwards the fixed-port connection to the Agent real port', async () => {
    const agent = await startEchoServer()
    cleanups.push(agent.close)
    const listenPort = await findFreePort()

    startAgentPortBridge('Battle.net', {
      listenPort,
      resolvePort: () => agent.port
    })
    // Small wait for the listener to come up.
    await new Promise((r) => setTimeout(r, 50))

    const reply = await new Promise<string>((resolve, reject) => {
      const c = net.connect({ host: '127.0.0.1', port: listenPort }, () => {
        c.write('ping-1120')
      })
      let buf = ''
      c.on('data', (d) => {
        buf += d.toString()
        c.end()
      })
      c.on('end', () => resolve(buf))
      c.on('error', reject)
      setTimeout(() => reject(new Error('timeout')), 2000).unref()
    })

    expect(reply).toBe('ping-1120')
  })

  it('closes the connection when no Agent port is available', async () => {
    const listenPort = await findFreePort()
    startAgentPortBridge('Battle.net', {
      listenPort,
      resolvePort: () => null
    })
    await new Promise((r) => setTimeout(r, 50))

    const closed = await new Promise<boolean>((resolve, reject) => {
      const c = net.connect({ host: '127.0.0.1', port: listenPort })
      c.on('close', () => resolve(true))
      c.on('error', reject)
      setTimeout(() => reject(new Error('timeout')), 2000).unref()
    })

    expect(closed).toBe(true)
  })
})
