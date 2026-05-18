/**
 * If `src` is passed (typically `company.logoUrl`), render the image. Otherwise
 * draw the CSS text logo so the brand always appears.
 *
 * `variant` controls the colour of "Pro":
 *   - 'default' → black (#111) for light backgrounds (invoices, set-password, 404)
 *   - 'light'   → white for dark backgrounds (sidebar, login left panel)
 * "Bed" is always Bed Pro red.
 */
export function BedProLogo({
  size = 28,
  src,
  variant = 'default',
}: {
  size?: number
  src?: string | null
  variant?: 'default' | 'light'
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="Bed Pro" style={{ height: size * 1.1, width: 'auto' }} />
  }
  const proColor = variant === 'light' ? '#fff' : '#111'
  return (
    <span className="bp-logo" style={{ fontSize: size, lineHeight: 1 }}>
      <span className="bp-logo-bed">Bed</span>
      <span style={{ color: proColor }}>Pro</span>
    </span>
  )
}
