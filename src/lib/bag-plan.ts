// Plano de corte del bolso PubliBags — constantes y helpers compartidos
// Usado por la API (server) y el módulo UI (client).

export interface BagPanel {
  key: string
  label: string
  cols: number
  rows: number
  start: number
  end: number
  widthCm: number
  heightCm: number
}

// 7 paneles del bolso PubliBags — total 297 espacios de 5×5cm.
// La base comercial es cuadrada 9×9 = 81 espacios (27 más que la versión de 54).
export const BAG_PANELS: readonly BagPanel[] = [
  { key: 'frontal', label: 'Frontal', cols: 12, rows: 5, start: 1, end: 60, widthCm: 60, heightCm: 25 },
  { key: 'posterior', label: 'Posterior', cols: 12, rows: 5, start: 61, end: 120, widthCm: 60, heightCm: 25 },
  { key: 'base', label: 'Base Comercial', cols: 9, rows: 9, start: 121, end: 201, widthCm: 45, heightCm: 45 },
  { key: 'lateral-izq', label: 'Lateral Izquierdo', cols: 6, rows: 5, start: 202, end: 231, widthCm: 30, heightCm: 25 },
  { key: 'lateral-der', label: 'Lateral Derecho', cols: 6, rows: 5, start: 232, end: 261, widthCm: 30, heightCm: 25 },
  { key: 'tapa-sup', label: 'Tapa Superior', cols: 6, rows: 3, start: 262, end: 279, widthCm: 30, heightCm: 15 },
  { key: 'tapa-inf', label: 'Tapa Inferior', cols: 6, rows: 3, start: 280, end: 297, widthCm: 30, heightCm: 15 },
] as const

export const BAG_TOTAL_SPACES = 297
export const BAG_SPACE_PRICE = 20
export const BAG_POTENTIAL_REVENUE = BAG_TOTAL_SPACES * BAG_SPACE_PRICE // $5,940

/**
 * Devuelve el panel al que pertenece una posición (1..297).
 * Lanza error si la posición está fuera de rango.
 */
export function panelForPosition(position: number): BagPanel {
  const panel = BAG_PANELS.find((p) => position >= p.start && position <= p.end)
  if (!panel) throw new Error(`Posición fuera de rango: ${position}`)
  return panel
}

/**
 * Devuelve { panel, row, col } para una posición dada.
 * row/col son 0-indexed dentro del panel.
 */
export function rowColForPosition(position: number): {
  panel: BagPanel
  row: number
  col: number
} {
  const panel = panelForPosition(position)
  const idx = position - panel.start
  return {
    panel,
    row: Math.floor(idx / panel.cols),
    col: idx % panel.cols,
  }
}

/**
 * Color HSL determinista a partir del nombre del patrocinador.
 * Evita índigo/azul (240) para respetar la paleta del proyecto.
 */
export function sponsorColor(name: string): string {
  if (!name) return 'hsl(150, 45%, 55%)'
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  // Mapeamos a un hue en rangos "cálidos" y verdes (0-200), evitando 210-260 (azul/índigo).
  const hue = Math.abs(hash) % 200
  const sat = 55 + (Math.abs(hash >> 8) % 25) // 55-80%
  const light = 48 + (Math.abs(hash >> 16) % 12) // 48-60%
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

/**
 * Convierte un HSL string ("hsl(h, s%, l%)") en componentes numéricos.
 */
export function parseHsl(hsl: string): { h: number; s: number; l: number } {
  const m = hsl.match(/hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)/)
  if (!m) return { h: 150, s: 45, l: 55 }
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) }
}

/**
 * Variante más clara de un color HSL (para fondos).
 */
export function sponsorColorLight(name: string): string {
  const { h, s, l } = parseHsl(sponsorColor(name))
  return `hsl(${h}, ${s}%, ${Math.min(l + 25, 88)}%)`
}
