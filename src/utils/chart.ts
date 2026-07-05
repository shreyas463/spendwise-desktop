import type { CSSProperties } from 'react'

/** Themed Recharts tooltip container — resolves against CSS vars, so it adapts
 *  to light/dark automatically. */
export const TOOLTIP_STYLE: CSSProperties = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  boxShadow: '0 12px 32px -12px rgb(2 6 23 / 0.45)',
  fontSize: 12,
  padding: '8px 12px',
  color: 'hsl(var(--popover-foreground))',
}

export const TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: 'hsl(var(--muted-foreground))',
  fontWeight: 600,
  marginBottom: 2,
}
