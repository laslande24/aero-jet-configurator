import type { Aircraft } from '@/data/aircraft'
import { Icon } from '@/components/Icon'

interface AircraftCardProps {
  aircraft: Aircraft
}

/** Steel-blue aircraft summary card — bottom-left of the mockup. */
export function AircraftCard({ aircraft }: AircraftCardProps) {
  return (
    <article className="relative flex flex-col justify-between overflow-hidden rounded-card bg-steel p-5 text-card">
      <div>
        <p className="font-display text-4xl font-semibold leading-none">
          {aircraft.passengers}
        </p>
        <p className="mt-1 text-xs text-white/85">Passengers</p>
      </div>

      <button
        type="button"
        aria-label={`Voir la fiche ${aircraft.manufacturer} ${aircraft.model}`}
        className="group absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center
                   rounded-full bg-card text-ink shadow-float
                   transition-[background-color,transform,box-shadow] duration-200 ease-[var(--ease-premium)]
                   hover:-translate-y-0.5 hover:bg-surface hover:shadow-card active:translate-y-0 active:scale-[0.96]
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card"
      >
        <Icon
          name="arrow-up-right"
          size={16}
          className="transition-transform duration-200 ease-[var(--ease-premium)]
                     group-hover:translate-x-px group-hover:-translate-y-px"
        />
      </button>

      <img
        src={aircraft.thumbnail}
        alt={`${aircraft.manufacturer} ${aircraft.model} — vue aérienne`}
        className="pointer-events-none my-2 w-full scale-125 select-none object-contain
                   drop-shadow-[0_18px_16px_rgba(20,30,50,0.28)]"
        draggable={false}
      />

      <div>
        <h2 className="font-display text-2xl font-semibold text-card">
          {aircraft.manufacturer}
        </h2>
        <p className="mt-0.5 text-xs text-white/75">{aircraft.model}</p>
      </div>
    </article>
  )
}
