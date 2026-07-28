import { useState, type FormEvent, type ReactNode } from 'react'
import { AIRCRAFT_BY_ID } from '@/data/aircraft'
import { CABINS, seatById } from '@/data/cabin'
import { AIRPORTS, computePrice, formatEUR } from '@/data/booking'
import {
  useConfiguratorStore,
  selectSelectedSeatId,
  type BookingDraft,
} from '@/store/configurator'
import { Icon } from '@/components/Icon'
import { cn } from '@/lib/cn'

const SEAT_KIND_LABEL: Record<string, string> = {
  seat: 'Fauteuil',
  divan: 'Divan',
  bed: 'Lit — Private Stateroom',
}

type Errors = Partial<Record<'route' | 'date' | 'fullName' | 'email', string>>

function validate(b: BookingDraft): Errors {
  const errors: Errors = {}
  if (b.departure === b.arrival) {
    errors.route = 'Trajet invalide. Choisissez deux aéroports différents.'
  }
  if (!b.date || b.date < new Date().toISOString().slice(0, 10)) {
    errors.date = "Date passée. Choisissez une date à partir d'aujourd'hui."
  }
  if (b.fullName.trim().split(/\s+/).length < 2) {
    errors.fullName = 'Nom incomplet. Indiquez votre prénom et votre nom.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(b.email)) {
    errors.email = 'Adresse e-mail invalide. Vérifiez le format : nom@domaine.com.'
  }
  return errors
}

const FIELD_CLASSES = cn(
  'w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-ink',
  'transition-colors duration-200 ease-[var(--ease-premium)]',
  'focus:border-line-strong focus:outline-2 focus:outline-offset-1 focus:outline-ink',
)

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  )
}

/** Empty state — Summary opened without a seat. */
function NoSeat() {
  const enterInterior = useConfiguratorStore((s) => s.enterInterior)
  const closeSummary = useConfiguratorStore((s) => s.closeSummary)
  return (
    <div className="flex flex-col items-center gap-4 rounded-card bg-card px-6 py-14 text-center shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
        <Icon name="seat" size={20} />
      </span>
      <div>
        <h2 className="font-display text-xl font-semibold">Aucun siège sélectionné</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
          Choisissez votre place en cabine pour préparer votre réservation.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          closeSummary()
          enterInterior()
        }}
        className="inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-2.5 text-xs
                   font-medium text-card transition-colors duration-200
                   ease-[var(--ease-premium)] hover:bg-ink-soft
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Choisir un siège
        <Icon name="arrow-right" size={14} />
      </button>
    </div>
  )
}

/** Booking summary + fake checkout — Summary tab content. */
export function SummaryPanel() {
  const aircraftId = useConfiguratorStore((s) => s.activeAircraftId)
  const selectedSeatId = useConfiguratorStore(selectSelectedSeatId)
  const booking = useConfiguratorStore((s) => s.booking)
  const updateBooking = useConfiguratorStore((s) => s.updateBooking)
  const confirmBooking = useConfiguratorStore((s) => s.confirmBooking)
  const [errors, setErrors] = useState<Errors>({})

  const aircraft = AIRCRAFT_BY_ID[aircraftId]
  const layout = CABINS[aircraftId]
  const seat = selectedSeatId ? seatById(layout, selectedSeatId) : undefined

  if (!seat) return <NoSeat />

  const zone = aircraft.zones.find((z) => z.id === seat.zoneId)
  const price = computePrice(aircraftId, seat.kind)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next = validate(booking)
    setErrors(next)
    if (Object.keys(next).length === 0) confirmBooking()
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 lg:grid-cols-[1fr_340px]">
      {/* ---- trajet + passager ---------------------------------------- */}
      <div className="min-w-0 space-y-4">
        <section className="rounded-card bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Votre vol</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Départ">
              <select
                value={booking.departure}
                onChange={(e) => updateBooking({ departure: e.target.value })}
                className={FIELD_CLASSES}
              >
                {AIRPORTS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.city} ({a.code})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Arrivée">
              <select
                value={booking.arrival}
                onChange={(e) => updateBooking({ arrival: e.target.value })}
                className={FIELD_CLASSES}
              >
                {AIRPORTS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.city} ({a.code})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date de vol" error={errors.date}>
              <input
                type="date"
                value={booking.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => updateBooking({ date: e.target.value })}
                className={FIELD_CLASSES}
              />
            </Field>
          </div>
          {errors.route && (
            <p role="alert" className="mt-3 text-xs text-danger">
              {errors.route}
            </p>
          )}
        </section>

        <section className="rounded-card bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Passager</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet" error={errors.fullName}>
              <input
                type="text"
                autoComplete="name"
                placeholder="Amélie Fontaine"
                value={booking.fullName}
                onChange={(e) => updateBooking({ fullName: e.target.value })}
                className={FIELD_CLASSES}
              />
            </Field>
            <Field label="E-mail" error={errors.email}>
              <input
                type="email"
                autoComplete="email"
                placeholder="amelie@exemple.com"
                value={booking.email}
                onChange={(e) => updateBooking({ email: e.target.value })}
                className={FIELD_CLASSES}
              />
            </Field>
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Démonstration — aucun paiement réel, aucune donnée transmise.
          </p>
        </section>
      </div>

      {/* ---- récapitulatif -------------------------------------------- */}
      <aside className="flex min-w-0 flex-col rounded-card bg-steel p-5 text-card">
        <h2 className="font-display text-lg font-semibold">Récapitulatif</h2>
        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-white/75">Avion</dt>
            <dd className="text-right font-medium">
              {aircraft.manufacturer} {aircraft.model}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/75">Cabine</dt>
            <dd className="text-right font-medium">{zone?.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/75">Siège</dt>
            <dd className="text-right font-medium">
              {seat.id} · {SEAT_KIND_LABEL[seat.kind]}
            </dd>
          </div>
        </dl>

        <hr className="my-4 border-white/20" />

        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-white/75">Affrètement</dt>
            <dd>{formatEUR(price.charter)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/75">Siège {seat.id}</dt>
            <dd>{price.seatPremium > 0 ? formatEUR(price.seatPremium) : 'Inclus'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/75">Taxes &amp; redevances</dt>
            <dd>{formatEUR(price.taxes)}</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline justify-between border-t border-white/20 pt-4">
          <span className="text-sm text-white/85">Total</span>
          <span className="font-display text-2xl font-semibold">{formatEUR(price.total)}</span>
        </div>

        <button
          type="submit"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-pill
                     bg-ink px-5 py-3 text-sm font-medium text-card
                     transition-colors duration-200 ease-[var(--ease-premium)]
                     hover:bg-ink-soft active:scale-[0.99]
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card"
        >
          Confirmer la réservation
          <Icon name="arrow-right" size={15} />
        </button>
      </aside>
    </form>
  )
}
