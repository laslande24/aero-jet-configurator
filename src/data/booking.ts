import type { SeatKind } from '@/data/cabin'

export interface Airport {
  code: string
  city: string
  name: string
}

export const AIRPORTS: Airport[] = [
  { code: 'LBG', city: 'Paris', name: 'Paris Le Bourget' },
  { code: 'GVA', city: 'Genève', name: 'Genève Cointrin' },
  { code: 'NCE', city: 'Nice', name: "Nice Côte d'Azur" },
  { code: 'LTN', city: 'Londres', name: 'London Luton' },
  { code: 'IBZ', city: 'Ibiza', name: 'Ibiza' },
]

/** Base charter price per aircraft (fictional). */
export const CHARTER_PRICE: Record<string, number> = {
  'global-6000': 18400,
  g650: 22900,
}

/** Seat premium by kind (fictional). */
export const SEAT_PREMIUM: Record<SeatKind, number> = {
  seat: 0,
  divan: 1200,
  bed: 2400,
}

export const TAX_RATE = 0.12

export interface PriceBreakdown {
  charter: number
  seatPremium: number
  taxes: number
  total: number
}

export function computePrice(aircraftId: string, seatKind: SeatKind): PriceBreakdown {
  const charter = CHARTER_PRICE[aircraftId] ?? 20000
  const seatPremium = SEAT_PREMIUM[seatKind]
  const taxes = Math.round((charter + seatPremium) * TAX_RATE)
  return { charter, seatPremium, taxes, total: charter + seatPremium + taxes }
}

const EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function formatEUR(value: number): string {
  return EUR.format(value)
}

/** ISO date string N days from now — default flight date. */
export function isoDateInDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Fictional booking reference, e.g. AER-58G2K. */
export function makeBookingRef(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let ref = ''
  for (let i = 0; i < 5; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return `AER-${ref}`
}
