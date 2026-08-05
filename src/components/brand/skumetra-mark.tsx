import type { CSSProperties } from 'react'

export type MarkTheme = 'light' | 'dark' | 'monochrome'

/**
 * The Skumetra Data Grid Mark: a 3×3 grid with the top-left cell omitted.
 *
 * Palettes read in cell order: r1c2, r1c3, r2c1, r2c2, r2c3, r3c1, r3c2, r3c3.
 * - `light`   — for placement on light surfaces (deeper teals)
 * - `dark`    — for placement on dark surfaces (brighter teals)
 * - `monochrome` — single ink color via `currentColor`
 */
const PALETTE: Record<MarkTheme, string[]> = {
  light: ['#14868a', '#3fa7a5', '#0b6e6e', '#0a5757', '#14868a', '#0b6e6e', '#3fa7a5', '#14868a'],
  dark: ['#5cc0be', '#8ad6d3', '#3fa7a5', '#2c8f8e', '#5cc0be', '#3fa7a5', '#8ad6d3', '#5cc0be'],
  monochrome: Array(8).fill('currentColor'),
}

/** Cell geometry. `tight` closes the gutters so the mark survives 16–20px. */
const GEOMETRY = {
  normal: { size: 9, step: 10.5, radius: 1 },
  tight: { size: 9.5, step: 10.25, radius: 0 },
} as const

type Props = {
  /** Rendered pixel size (width & height). */
  size?: number
  theme?: MarkTheme
  /** Force gutter geometry; defaults to `tight` at 20px and below. */
  gap?: keyof typeof GEOMETRY
  className?: string
  /** Provide when the mark stands alone as the only brand signal. */
  title?: string
  style?: CSSProperties
}

export function SkumetraMark({ size = 24, theme = 'light', gap, className, title, style }: Props) {
  const g = GEOMETRY[gap ?? (size <= 20 ? 'tight' : 'normal')]
  const fills = PALETTE[theme]
  const cells: Array<[number, number]> = [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ display: 'block', flex: 'none', ...style }}
    >
      {title ? <title>{title}</title> : null}
      {cells.map(([col, row], i) => (
        <rect
          key={`${col}-${row}`}
          x={col * g.step}
          y={row * g.step}
          width={g.size}
          height={g.size}
          rx={g.radius}
          fill={fills[i]}
        />
      ))}
    </svg>
  )
}
