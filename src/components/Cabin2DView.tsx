import { useState } from 'react'
import { useConfiguratorStore } from '@/store/configurator'
import { cn } from '@/lib/cn'
import planeImg from '@/assets/plane-2d.webp'

type HotspotId = 'door' | 'cabin'

interface Zone {
  id: HotspotId
  label: string
  section: number
  /** Percent-based rect over the aircraft image. */
  left: string
  top: string
  width: string
  height: string
}

/* Clickable regions aligned on the photo — door+airstair, cutaway+windows. */
const ZONES: Zone[] = [
  { id: 'door', label: 'Entrer dans la cabine', section: 0, left: '18.6%', top: '6%', width: '8.4%', height: '88%' },
  { id: 'cabin', label: 'Visiter la cabine', section: 1, left: '28%', top: '8%', width: '42%', height: '42%' },
]

/**
 * Default 2D exterior — the mockup's photoreal side profile (transparent
 * WebP, 91 KB). The open door and the cabin cutaway/window band are
 * HTML hotspots firing the same store actions as the 3D ones.
 * No WebGL: three.js never loads until the user picks 3D.
 */
export function Cabin2DView() {
  const enterInterior = useConfiguratorStore((s) => s.enterInterior)
  const [hover, setHover] = useState<HotspotId | null>(null)

  return (
    /* negative right margins cancel the panel paddings so the clipped tail
       bleeds exactly to the app-panel edge, like the mockup */
    <div className="relative -mr-4 w-full overflow-hidden sm:-mr-12 lg:-mr-16">
      {/* hover caption — same pill language as the 3D hotspots */}
      <div
        className={cn(
          'pointer-events-none absolute left-[30%] top-0 z-10 -translate-x-1/2',
          'rounded-pill bg-ink px-3.5 py-1.5 text-[11px] font-medium text-card shadow-float',
          'transition-opacity duration-200',
          hover ? 'opacity-100' : 'opacity-0',
        )}
      >
        {hover === 'door' ? 'Entrer dans la cabine' : 'Visiter la cabine'}
      </div>

      {/* mockup framing: nose starts ~1/5 in, tail bleeds off the right edge */}
      <div className="relative ml-auto mt-2 w-[80%]">
        <img
          src={planeImg}
          alt="Bombardier Global 6000 de profil, porte ouverte avec escalier et découpe montrant la cabine"
          className="w-full select-none"
          draggable={false}
        />

        {ZONES.map((z) => (
          <button
            key={z.id}
            type="button"
            aria-label={z.label}
            onClick={() => enterInterior(z.section)}
            onPointerEnter={() => setHover(z.id)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(z.id)}
            onBlur={() => setHover(null)}
            className={cn(
              'absolute cursor-pointer rounded-2xl border-2 outline-none',
              'transition-[border-color,background-color] duration-200 ease-[var(--ease-premium)]',
              'focus-visible:border-gold focus-visible:bg-gold/10',
              hover === z.id ? 'border-gold bg-gold/10' : 'border-transparent',
            )}
            style={{ left: z.left, top: z.top, width: z.width, height: z.height }}
          />
        ))}
      </div>

      <p
        className="pointer-events-none absolute bottom-2 left-2 text-[10px] uppercase
                   tracking-[0.22em] text-ink-muted"
      >
        Cliquer la porte ou les hublots pour entrer · cube = 3D
      </p>
    </div>
  )
}
