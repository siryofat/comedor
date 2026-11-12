/**
 * Colores de las semanas de rotación tal como aparecen en el menú impreso.
 * `base` es el color de la semana, `tint` su versión suave para fondos y
 * `deep` una variante oscura con contraste suficiente para texto.
 */
export interface WeekColor {
  base: string
  tint: string
  deep: string
}

export const WEEK_COLORS: readonly WeekColor[] = [
  { base: '#92d050', tint: '#e6f3d3', deep: '#3f6b12' },
  { base: '#f793af', tint: '#fce4ec', deep: '#a21f4c' },
  { base: '#eadc00', tint: '#f8f2b8', deep: '#6b5f00' },
  { base: '#50ccef', tint: '#d9f0f8', deep: '#0d5f7c' },
  { base: '#fac090', tint: '#fde8d6', deep: '#9a4a10' },
  { base: '#d886e0', tint: '#f3dff7', deep: '#7a2a8e' },
]

/** Color de la semana de rotación `week` (empieza en 1). */
export function weekColor(week: number): WeekColor {
  return WEEK_COLORS[(week - 1) % WEEK_COLORS.length]
}

/** Variables CSS para colorear un bloque con su semana. */
export function weekStyle(week: number): string {
  const c = weekColor(week)
  return `--wk:${c.base};--wk-tint:${c.tint};--wk-deep:${c.deep}`
}
