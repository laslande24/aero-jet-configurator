import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { AIRCRAFT_BY_ID } from '@/data/aircraft'
import { CABINS, seatById } from '@/data/cabin'
import { AIRPORTS, computePrice, formatEUR } from '@/data/booking'
import { useConfiguratorStore, selectSelectedSeatId } from '@/store/configurator'
import { Icon } from '@/components/Icon'

function airportLabel(code: string): string {
  const a = AIRPORTS.find((x) => x.code === code)
  return a ? `${a.city} (${a.code})` : code
}

/** Confirmation screen — animated check, booking recap, reference. */
export function Confirmation() {
  const aircraftId = useConfiguratorStore((s) => s.activeAircraftId)
  const selectedSeatId = useConfiguratorStore(selectSelectedSeatId)
  const booking = useConfiguratorStore((s) => s.booking)
  const confirmationRef = useConfiguratorStore((s) => s.confirmationRef)
  const newBooking = useConfiguratorStore((s) => s.newBooking)

  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    /* gsap.context + revert: killing a from() mid-flight would leave the
       content hidden (StrictMode double-mount); revert restores the DOM. */
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-anim="check"]', {
          scale: 0,
          duration: 0.55,
          ease: 'back.out(1.7)',
        })
        .from(
          '[data-anim="line"]',
          { y: 18, autoAlpha: 0, duration: 0.5, stagger: 0.08, clearProps: 'all' },
          '-=0.15',
        )
    }, el)
    return () => ctx.revert()
  }, [])

  const aircraft = AIRCRAFT_BY_ID[aircraftId]
  const seat = selectedSeatId ? seatById(CABINS[aircraftId], selectedSeatId) : undefined
  const price = seat ? computePrice(aircraftId, seat.kind) : null
  const date = booking.date
    ? new Date(`${booking.date}T12:00:00`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  return (
    <div
      ref={root}
      role="status"
      className="mx-auto flex max-w-xl flex-col items-center py-6 text-center"
    >
      <span
        data-anim="check"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-card"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m5 13 4 4L19 7" />
        </svg>
      </span>

      <h1 data-anim="line" className="mt-5 font-display text-3xl font-semibold sm:text-4xl">
        Réservation confirmée
      </h1>
      <p data-anim="line" className="mt-2 text-sm text-ink-soft">
        Votre billet a été envoyé à <span className="font-medium text-ink">{booking.email}</span>.
      </p>
      <p data-anim="line" className="mt-1 text-xs text-ink-muted">
        Référence {confirmationRef}
      </p>

      <dl
        data-anim="line"
        className="mt-6 w-full space-y-2.5 rounded-card bg-card p-5 text-left text-sm shadow-sm"
      >
        <div className="flex justify-between gap-3">
          <dt className="text-ink-muted">Trajet</dt>
          <dd className="font-medium">
            {airportLabel(booking.departure)} → {airportLabel(booking.arrival)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-muted">Date</dt>
          <dd className="font-medium">{date}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-muted">Avion</dt>
          <dd className="font-medium">
            {aircraft.manufacturer} {aircraft.model}
          </dd>
        </div>
        {seat && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Siège</dt>
            <dd className="font-medium">{seat.id}</dd>
          </div>
        )}
        {price && (
          <div className="flex justify-between gap-3 border-t border-line pt-2.5">
            <dt className="text-ink-muted">Total réglé</dt>
            <dd className="font-display text-base font-semibold">{formatEUR(price.total)}</dd>
          </div>
        )}
      </dl>

      <button
        data-anim="line"
        type="button"
        onClick={newBooking}
        className="mt-6 inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-2.5
                   text-xs font-medium text-card transition-colors duration-200
                   ease-[var(--ease-premium)] hover:bg-ink-soft
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Nouvelle réservation
        <Icon name="arrow-right" size={14} />
      </button>
    </div>
  )
}
