import { useState } from 'react'
import { useConfiguratorStore } from '@/store/configurator'
import { AIRCRAFT_BY_ID } from '@/data/aircraft'
import { cn } from '@/lib/cn'

type HotspotId = 'door' | 'cabin'

/**
 * Default 2D exterior — flat side profile of the ACTIVE aircraft. Artwork
 * and hotspot geometry both come from the aircraft record, so switching
 * models swaps the picture and re-aligns the clickable zones. The door and
 * the cabin cutaway fire the same store actions as their 3D counterparts.
 * No WebGL: three.js never loads until the user picks 3D.
 */
export function Cabin2DView() {
  const enterInterior = useConfiguratorStore((s) => s.enterInterior)
  const activeId = useConfiguratorStore((s) => s.activeAircraftId)
  const [hover, setHover] = useState<HotspotId | null>(null)

  const aircraft = AIRCRAFT_BY_ID[activeId]
  const { image, door, cabin } = aircraft.view2d
  const zones = [
    { id: 'door' as const, label: 'Entrer dans la cabine', section: 0, rect: door },
    { id: 'cabin' as const, label: 'Visiter la cabine', section: 1, rect: cabin },
  ]

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
          key={aircraft.id}
          src={image}
          alt={`${aircraft.manufacturer} ${aircraft.model} de profil, porte ouverte avec escalier et découpe montrant la cabine`}
          className="w-full select-none"
          draggable={false}
        />

        {zones.map((z) => (
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
            style={z.rect}
          />
        ))}
      </div>

      {/* in the flow under the picture: absolute, it sat on the landing gear,
          and on the jet itself once the picture shrinks on phones */}
      <p className="mt-1 pl-2 text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        Cliquer la porte ou les hublots pour entrer · cube = 3D
      </p>
    </div>
  )
}
