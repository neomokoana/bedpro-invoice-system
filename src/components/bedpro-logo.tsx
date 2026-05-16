export function BedProLogo({ size = 28 }: { size?: number }) {
  return (
    <span className="bp-logo" style={{ fontSize: size, lineHeight: 1 }}>
      <span className="bp-logo-bed">Bed</span>
      <span className="bp-logo-pro">Pro</span>
    </span>
  )
}
