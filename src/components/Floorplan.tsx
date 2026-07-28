import type { Aircraft } from '@/data/aircraft'
import { CABINS, type CabinLayout, type Seat } from '@/data/cabin'
import { useConfiguratorStore, selectSelectedSeatId } from '@/store/configurator'
import { FloatingButton } from '@/components/FloatingButton'
import { cn } from '@/lib/cn'

/* Diagonal hatching — cockpit / tail cone ends of the floorplan. */
function Hatch() {
  return (
    <div
      aria-hidden="true"
      className="w-8 shrink-0 self-stretch rounded-md"
      style={{
        background:
          'repeating-linear-gradient(45deg, transparent 0 5px, var(--color-line) 5px 6px)',
      }}
    />
  )
}

/* Mockup-style furniture footprints — large rounded grey blocks. */
const KIND_SIZE: Record<Seat['kind'], string> = {
  seat: 'h-10 w-10 rounded-lg',
  divan: 'h-9 w-24 rounded-lg',
  bed: 'h-16 w-20 rounded-xl',
}

function SeatButton({ seat, layout }: { seat: Seat; layout: CabinLayout }) {
  const [x0, x1] = layout.zoneRanges[seat.zoneId]
  const hoveredSeatId = useConfiguratorStore((s) => s.hoveredSeatId)
  const selectedSeatId = useConfiguratorStore(selectSelectedSeatId)
  const selectSeat = useConfiguratorStore((s) => s.selectSeat)
  const setHoveredSeat = useConfiguratorStore((s) => s.setHoveredSeat)

  const selected = selectedSeatId === seat.id
  const hovered = hoveredSeatId === seat.id

  const state = seat.occupied ? 'occupé' : selected ? 'sélectionné' : 'libre'
  /* backrest sits against the cabin wall: top row (z<0) → top edge */
  const backEdge = seat.z < 0 ? 'top-1' : 'bottom-1'
  /* furniture detail tint — readable on grey, selected-ink and hover-gold */
  const detail = selected ? 'bg-white/25' : 'bg-ink/10'

  return (
    <button
      type="button"
      disabled={seat.occupied}
      aria-pressed={selected}
      aria-label={`Siège ${seat.id} — ${state}`}
      title={`Siège ${seat.id} — ${state}`}
      onClick={() => selectSeat(selected ? null : seat.id)}
      onMouseEnter={() => setHoveredSeat(seat.id)}
      onMouseLeave={() => setHoveredSeat(null)}
      onFocus={() => setHoveredSeat(seat.id)}
      onBlur={() => setHoveredSeat(null)}
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2',
        'transition-[transform,background-color,box-shadow] duration-200 ease-[var(--ease-premium)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        'enabled:hover:scale-105 enabled:active:scale-95',
        KIND_SIZE[seat.kind],
        seat.occupied
          ? 'cursor-not-allowed'
          : selected
            ? 'bg-ink'
            : hovered
              ? 'bg-gold-soft'
              : 'bg-surface-sunken hover:bg-line',
        hovered && !selected && !seat.occupied && 'ring-2 ring-gold',
      )}
      style={{
        left: `${8 + ((seat.x - x0) / (x1 - x0)) * 84}%`,
        top: `${50 + seat.z * 26}%`,
        ...(seat.occupied
          ? {
              background:
                'repeating-linear-gradient(45deg, var(--color-surface-sunken) 0 4px, var(--color-line) 4px 5px)',
            }
          : undefined),
      }}
    >
      {/* furniture silhouettes */}
      {seat.kind === 'seat' && (
        <>
          <span aria-hidden="true" className={cn('absolute inset-x-1 h-1.5 rounded-full', backEdge, detail)} />
          <span aria-hidden="true" className={cn('absolute left-0.5 top-2.5 bottom-2.5 w-1 rounded-full', detail)} />
          <span aria-hidden="true" className={cn('absolute right-0.5 top-2.5 bottom-2.5 w-1 rounded-full', detail)} />
        </>
      )}
      {seat.kind === 'divan' && (
        <>
          <span aria-hidden="true" className={cn('absolute inset-x-1 h-1.5 rounded-full', backEdge, detail)} />
          <span aria-hidden="true" className={cn('absolute left-1/3 top-2.5 bottom-1.5 w-px', detail)} />
          <span aria-hidden="true" className={cn('absolute left-2/3 top-2.5 bottom-1.5 w-px', detail)} />
        </>
      )}
      {seat.kind === 'bed' && (
        <>
          <span aria-hidden="true" className={cn('absolute bottom-1.5 left-1.5 top-1.5 w-3.5 rounded-md', detail)} />
          <span aria-hidden="true" className={cn('absolute bottom-1.5 right-1.5 top-1.5 w-9 rounded-md', detail)} />
        </>
      )}
    </button>
  )
}

interface FloorplanProps {
  aircraft: Aircraft
}

/** Cabin floorplan — interactive seat map synced with the 3D stage. */
export function Floorplan({ aircraft }: FloorplanProps) {
  const layout = CABINS[aircraft.id]
  const setSection = useConfiguratorStore((s) => s.setSection)
  const sectionIndex = useConfiguratorStore((s) => s.sectionIndex)
  const viewMode = useConfiguratorStore((s) => s.viewMode)
  const selectedSeatId = useConfiguratorStore(selectSelectedSeatId)
  const openSummary = useConfiguratorStore((s) => s.openSummary)

  return (
    <section className="min-w-0 rounded-card bg-card p-5 shadow-sm">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-semibold">Floorplan</h2>
          {selectedSeatId && (
            <button
              type="button"
              onClick={openSummary}
              className="inline-flex items-center gap-1.5 rounded-pill bg-ink px-3.5 py-1.5
                         text-[11px] font-medium text-card transition-colors duration-200
                         ease-[var(--ease-premium)] hover:bg-ink-soft
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Réserver le siège {selectedSeatId}
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FloatingButton size="sm" icon="expand" label="Agrandir le plan" className="shadow-sm" />
          <FloatingButton size="sm" icon="grid" label="Vue grille" className="shadow-sm" />
          <FloatingButton size="sm" icon="sliders" label="Options du plan" className="shadow-sm" />
        </div>
      </header>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="flex min-w-[680px] items-stretch gap-3">
          <Hatch />
          {aircraft.zones.map((zone, i) => {
            const seats = layout.seats.filter((s) => s.zoneId === zone.id)
            const activeZone = viewMode === 'interior' && i === sectionIndex
            return (
              <div key={zone.id} className="flex min-w-0 flex-1 flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setSection(i)}
                  className={cn(
                    'truncate text-left text-[11px] font-medium',
                    'transition-colors duration-200 ease-[var(--ease-premium)]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                    activeZone ? 'text-ink' : 'text-ink-muted hover:text-ink-soft',
                  )}
                >
                  {zone.name}
                </button>
                <div
                  className={cn(
                    'relative h-36 rounded-lg bg-card-muted',
                    activeZone && 'ring-1 ring-line-strong',
                  )}
                >
                  {seats.length > 0 ? (
                    seats.map((seat) => <SeatButton key={seat.id} seat={seat} layout={layout} />)
                  ) : (
                    /* washroom fixtures — vanity, basin, shower */
                    <div
                      className="flex h-full items-center justify-evenly px-3"
                      aria-hidden="true"
                    >
                      <div className="relative h-9 w-14 rounded-lg bg-surface-sunken">
                        {/* basin on the vanity */}
                        <span className="absolute right-1.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-ink/10" />
                      </div>
                      <div className="relative h-16 w-12 rounded-lg bg-surface-sunken">
                        {/* shower head dot */}
                        <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-ink/10" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <Hatch />
        </div>
      </div>
    </section>
  )
}
