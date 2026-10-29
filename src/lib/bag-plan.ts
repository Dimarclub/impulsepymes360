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

// Bolso PubliBags — 2 paneles, 56 espacios de 10×5cm.
// Frente (28) + Posterior (28) = 56 QR codes.
// Precio cliente final: $67 por espacio.
export const BAG_PANELS: readonly BagPanel[] = [
  { key: 'frontal', label: 'Frente', cols: 4, rows: 7, start: 1, end: 28, widthCm: 40, heightCm: 35 },
  { key: 'posterior', label: 'Posterior', cols: 4, rows: 7, start: 29, end: 56, widthCm: 40, heightCm: 35 },
] as const

export const BAG_TOTAL_SPACES = 56
export const BAG_SPACE_PRICE = 67
export const BAG_POTENTIAL_REVENUE = BAG_TOTAL_SPACES * BAG_SPACE_PRICE // $3,752

/**
 * Devuelve el panel al que pertenece una posición (1..56).
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
