interface JetSilhouetteProps {
  className?: string
  /** Hide windows/pinstripe detail — for the small card variant. */
  mini?: boolean
}

/**
 * Stylised side-view business jet — geometric placeholder for the Phase 2
 * 3D canvas. Deliberately schematic (design mark, not failed realism).
 */
export function JetSilhouette({ className, mini = false }: JetSilhouetteProps) {
  const windows = Array.from({ length: 11 }, (_, i) => 210 + i * 36)

  return (
    <svg viewBox="0 0 960 300" fill="none" className={className} aria-hidden="true">
      {/* ground shadow */}
      <ellipse cx="450" cy="272" rx="330" ry="13" fill="var(--color-ink)" opacity="0.07" />

      {/* tail fin */}
      <path
        d="M700 176 776 62c3-5 8-8 14-8h16L756 176Z"
        fill="var(--color-card)"
        stroke="var(--color-line-strong)"
        strokeWidth="2"
      />
      {/* T-tail plane */}
      <rect x="756" y="52" width="96" height="11" rx="5.5" fill="var(--color-card)" stroke="var(--color-line-strong)" strokeWidth="2" />

      {/* rear engine nacelle */}
      <rect x="648" y="120" width="92" height="27" rx="13.5" fill="var(--color-card)" stroke="var(--color-line-strong)" strokeWidth="2" />

      {/* fuselage */}
      <path
        d="M96 148c26-14 74-22 128-22h422c56 0 100 10 118 26-18 16-62 26-118 26H224c-54 0-102-8-128-22-6-3-6-5 0-8Z"
        fill="var(--color-card)"
        stroke="var(--color-line-strong)"
        strokeWidth="2"
      />
      {/* nose cap */}
      <path
        d="M96 148c-14 4-22 6-26 8 4 2 12 4 26 8"
        stroke="var(--color-line-strong)"
        strokeWidth="2"
      />

      {!mini && (
        <>
          {/* gold pinstripe */}
          <rect x="118" y="164" width="592" height="3" rx="1.5" fill="var(--color-gold)" opacity="0.75" />
          {/* cockpit */}
          <path d="M136 138c10-5 24-8 40-9l-8 12h-36Z" fill="var(--color-ink-subtle)" />
          {/* windows */}
          {windows.map((x) => (
            <rect key={x} x={x} y="140" width="11" height="9" rx="3.5" fill="var(--color-ink-subtle)" />
          ))}
          {/* door line */}
          <path d="M186 132v30" stroke="var(--color-line-strong)" strokeWidth="2" />
        </>
      )}

      {/* wing — sweeps toward viewer */}
      <path
        d="M356 178h176l96 54-88 6Z"
        fill="var(--color-card)"
        stroke="var(--color-line-strong)"
        strokeWidth="2"
      />
    </svg>
  )
}
