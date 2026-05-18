/**
 * If `src` is passed (typically `company.logoUrl`), render the image. Otherwise
 * draw the CSS text logo so the brand always appears.
 */
export function BedProLogo({ size = 28, src }: { size?: number; src?: string | null }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="Bed Pro" style={{ height: size * 1.1, width: 'auto' }} />
  }
  return (
    <span className="bp-logo" style={{ fontSize: size, lineHeight: 1 }}>
      <span className="bp-logo-bed">Bed</span>
      <span className="bp-logo-pro">Pro</span>
    </span>
  )
}
