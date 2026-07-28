import { create } from 'zustand'
import { AIRCRAFT, AIRCRAFT_BY_ID } from '@/data/aircraft'
import { isoDateInDays, makeBookingRef } from '@/data/booking'

export type ViewMode = 'exterior' | 'interior'
export type Screen = 'configure' | 'summary' | 'confirmed'
/** Exterior render mode — flat 2D profile (default) or free 3D. */
export type ViewDimension = '2d' | '3d'
/** Cheatline livery — 'default' keeps each aircraft's own accent. */
export type LiveryId = 'default' | 'gold' | 'steel' | 'graphite'

export const LIVERY_COLORS: Record<Exclude<LiveryId, 'default'>, string> = {
  gold: '#c9a44a',
  steel: '#8fa6ba',
  graphite: '#4a4d52',
}

export interface BookingDraft {
  departure: string
  arrival: string
  date: string
  fullName: string
  email: string
}

interface ConfiguratorState {
  activeAircraftId: string
  viewMode: ViewMode
  /** Exterior 2D/3D toggle — 3D never mounts until the user asks for it. */
  viewDimension: ViewDimension
  /** Cheatline livery applied to the 3D model. */
  livery: LiveryId
  /** Slow orbit of the exterior 3D view. */
  autoRotate: boolean
  /** Bumped to ask the 3D stage to dolly in; wraps around at max zoom. */
  zoomTick: number
  /** Bumped to ask the 3D stage to restore its default framing. */
  resetTick: number
  /** Index into the active aircraft's zones (0..3). */
  sectionIndex: number
  /** Seat hovered in 3D or on the floorplan — synced highlight. */
  hoveredSeatId: string | null
  /** Selected seat per aircraft — survives switching models. */
  seatSelections: Record<string, string | null>
  /** Top-level routing: configurator, booking summary, confirmation. */
  screen: Screen
  booking: BookingDraft
  confirmationRef: string | null

  setAircraft: (id: string) => void
  nextAircraft: () => void
  prevAircraft: () => void
  toggleDimension: () => void
  setLivery: (id: LiveryId) => void
  toggleAutoRotate: () => void
  requestZoom: () => void
  requestReset: () => void
  enterInterior: (sectionIndex?: number) => void
  exitInterior: () => void
  setSection: (i: number) => void
  nextSection: () => void
  selectSeat: (seatId: string | null) => void
  setHoveredSeat: (id: string | null) => void
  openSummary: () => void
  closeSummary: () => void
  updateBooking: (patch: Partial<BookingDraft>) => void
  confirmBooking: () => void
  /** After confirmation: clear the booked seat, back to the cabin. */
  newBooking: () => void
}

function shift(currentId: string, delta: number): string {
  const i = AIRCRAFT.findIndex((a) => a.id === currentId)
  const next = (i + delta + AIRCRAFT.length) % AIRCRAFT.length
  return AIRCRAFT[next].id
}

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  activeAircraftId: AIRCRAFT[0].id,
  viewMode: 'exterior',
  viewDimension: '2d',
  livery: 'default',
  autoRotate: false,
  zoomTick: 0,
  resetTick: 0,
  sectionIndex: 0,
  hoveredSeatId: null,
  seatSelections: {},
  screen: 'configure',
  booking: {
    departure: 'LBG',
    arrival: 'GVA',
    date: isoDateInDays(14),
    fullName: '',
    email: '',
  },
  confirmationRef: null,

  setAircraft: (id) => set({ activeAircraftId: id, hoveredSeatId: null }),
  nextAircraft: () =>
    set((s) => ({ activeAircraftId: shift(s.activeAircraftId, 1), hoveredSeatId: null })),
  prevAircraft: () =>
    set((s) => ({ activeAircraftId: shift(s.activeAircraftId, -1), hoveredSeatId: null })),

  toggleDimension: () =>
    set((s) => ({
      viewDimension: s.viewDimension === '2d' ? '3d' : '2d',
      /* auto-orbit is a 3D-only affordance */
      autoRotate: s.viewDimension === '2d' ? s.autoRotate : false,
    })),
  setLivery: (id) => set({ livery: id }),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  requestZoom: () => set((s) => ({ zoomTick: s.zoomTick + 1 })),
  requestReset: () => set((s) => ({ resetTick: s.resetTick + 1, autoRotate: false })),

  enterInterior: (sectionIndex) =>
    set((s) => ({
      viewMode: 'interior',
      sectionIndex: sectionIndex ?? s.sectionIndex,
    })),
  exitInterior: () => set({ viewMode: 'exterior', hoveredSeatId: null }),

  /** Selecting a section always navigates the cabin — enters interior if needed. */
  setSection: (i) =>
    set((s) => ({
      sectionIndex: Math.max(0, Math.min(i, AIRCRAFT_BY_ID[s.activeAircraftId].zones.length - 1)),
      viewMode: 'interior',
    })),
  nextSection: () =>
    set((s) => ({
      sectionIndex: (s.sectionIndex + 1) % AIRCRAFT_BY_ID[s.activeAircraftId].zones.length,
      viewMode: 'interior',
    })),

  selectSeat: (seatId) =>
    set((s) => ({
      seatSelections: { ...s.seatSelections, [s.activeAircraftId]: seatId },
    })),
  setHoveredSeat: (id) => set({ hoveredSeatId: id }),

  openSummary: () => set({ screen: 'summary', hoveredSeatId: null }),
  closeSummary: () => set({ screen: 'configure' }),
  updateBooking: (patch) => set((s) => ({ booking: { ...s.booking, ...patch } })),
  confirmBooking: () => set({ screen: 'confirmed', confirmationRef: makeBookingRef() }),
  newBooking: () =>
    set((s) => ({
      screen: 'configure',
      viewMode: 'interior',
      confirmationRef: null,
      seatSelections: { ...s.seatSelections, [s.activeAircraftId]: null },
    })),
}))

/** Selected seat for the active aircraft. */
export function selectSelectedSeatId(s: ConfiguratorState): string | null {
  return s.seatSelections[s.activeAircraftId] ?? null
}
