export type SeatKind = 'seat' | 'divan' | 'bed'

export interface Seat {
  id: string
  zoneId: string
  /** Normalized cabin coords — x: 0 (nose) → 1 (tail), z: -1 (left) → 1 (right). */
  x: number
  z: number
  kind: SeatKind
  occupied?: boolean
}

export interface CabinLayout {
  /** World dimensions of the interior shell. */
  length: number
  radius: number
  /** Zone x-ranges (normalized), nose → tail — camera targets + floorplan columns. */
  zoneRanges: Record<string, [number, number]>
  seats: Seat[]
}

/** Cabin layouts keyed by aircraft id — same coords drive 3D and the floorplan. */
export const CABINS: Record<string, CabinLayout> = {
  'global-6000': {
    length: 7,
    radius: 1.18,
    zoneRanges: {
      entertainment: [0.02, 0.24],
      lounge: [0.26, 0.55],
      stateroom: [0.57, 0.8],
      ensuite: [0.82, 0.98],
    },
    seats: [
      { id: 'EN1', zoneId: 'entertainment', x: 0.08, z: 0.62, kind: 'seat' },
      { id: 'EN2', zoneId: 'entertainment', x: 0.17, z: 0.62, kind: 'seat' },
      { id: 'END', zoneId: 'entertainment', x: 0.13, z: -0.62, kind: 'divan' },
      { id: 'ML1', zoneId: 'lounge', x: 0.31, z: -0.6, kind: 'seat' },
      { id: 'ML2', zoneId: 'lounge', x: 0.31, z: 0.6, kind: 'seat' },
      { id: 'ML3', zoneId: 'lounge', x: 0.39, z: -0.6, kind: 'seat' },
      { id: 'ML4', zoneId: 'lounge', x: 0.39, z: 0.6, kind: 'seat', occupied: true },
      { id: 'ML5', zoneId: 'lounge', x: 0.46, z: -0.6, kind: 'seat', occupied: true },
      { id: 'ML6', zoneId: 'lounge', x: 0.46, z: 0.6, kind: 'seat' },
      { id: 'ML7', zoneId: 'lounge', x: 0.53, z: -0.6, kind: 'seat' },
      { id: 'ML8', zoneId: 'lounge', x: 0.53, z: 0.6, kind: 'seat' },
      { id: 'ST1', zoneId: 'stateroom', x: 0.6, z: 0.65, kind: 'seat' },
      { id: 'ST2', zoneId: 'stateroom', x: 0.74, z: 0.65, kind: 'seat' },
      { id: 'STB', zoneId: 'stateroom', x: 0.68, z: -0.4, kind: 'bed' },
    ],
  },
  g650: {
    length: 7.6,
    radius: 1.24,
    zoneRanges: {
      forward: [0.03, 0.28],
      conference: [0.3, 0.58],
      stateroom: [0.6, 0.82],
      ensuite: [0.84, 0.98],
    },
    seats: [
      { id: 'FC1', zoneId: 'forward', x: 0.08, z: -0.6, kind: 'seat' },
      { id: 'FC2', zoneId: 'forward', x: 0.08, z: 0.6, kind: 'seat', occupied: true },
      { id: 'FC3', zoneId: 'forward', x: 0.17, z: -0.6, kind: 'seat' },
      { id: 'FC4', zoneId: 'forward', x: 0.17, z: 0.6, kind: 'seat' },
      { id: 'CF1', zoneId: 'conference', x: 0.34, z: -0.6, kind: 'seat' },
      { id: 'CF2', zoneId: 'conference', x: 0.34, z: 0.6, kind: 'seat' },
      { id: 'CF3', zoneId: 'conference', x: 0.42, z: -0.6, kind: 'seat', occupied: true },
      { id: 'CF4', zoneId: 'conference', x: 0.42, z: 0.6, kind: 'seat' },
      { id: 'CF5', zoneId: 'conference', x: 0.5, z: -0.6, kind: 'seat', occupied: true },
      { id: 'CF6', zoneId: 'conference', x: 0.5, z: 0.6, kind: 'seat' },
      { id: 'STD', zoneId: 'stateroom', x: 0.66, z: -0.45, kind: 'divan' },
      { id: 'ST1', zoneId: 'stateroom', x: 0.63, z: 0.65, kind: 'seat' },
      { id: 'STB', zoneId: 'stateroom', x: 0.74, z: 0.1, kind: 'bed' },
    ],
  },
}

/** Zone center on the normalized x axis. */
export function zoneCenter(layout: CabinLayout, zoneId: string): number {
  const [x0, x1] = layout.zoneRanges[zoneId]
  return (x0 + x1) / 2
}

/** Normalized cabin x → world x for a layout. */
export function toWorldX(layout: CabinLayout, x: number): number {
  return (x - 0.5) * layout.length
}

/** Normalized cabin z → world z (keeps seats inside the shell walls). */
export function toWorldZ(layout: CabinLayout, z: number): number {
  return z * layout.radius * 0.62
}

export function seatById(layout: CabinLayout, id: string): Seat | undefined {
  return layout.seats.find((s) => s.id === id)
}
