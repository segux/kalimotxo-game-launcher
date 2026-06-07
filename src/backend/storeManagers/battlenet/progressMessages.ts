/** Mensajes para la UI — sin jerga de Wine/DLL. */
const PHASE_LABEL: Record<string, string> = {
  idle: '',
  starting: 'Iniciando…',
  runtime: 'Preparando tu Mac para juegos de Windows…',
  deps: 'Instalando componentes de Windows…',
  bottle: 'Configurando Battle.net…',
  download: 'Descargando Battle.net…',
  installer: 'Abriendo Battle.net…',
  done: 'Listo',
  error: 'Algo falló'
}

export function friendlyProgressMessage(phase: string, percent: number, _technical?: string): string {
  const label = PHASE_LABEL[phase] ?? 'Trabajando…'
  if (phase === 'download' && percent > 0) {
    return `${label} ${percent}%`
  }
  if (percent > 0 && percent < 100 && phase !== 'idle') {
    return `${label} ${percent}%`
  }
  return label
}
