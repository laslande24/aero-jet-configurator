export interface CabinZone {
  id: string
  name: string
}

/** Parameters driving the procedural jet geometry (Phase 2 placeholder for real .glb). */
export interface JetParams {
  fuselageLength: number
  fuselageRadius: number
  wingSpan: number
  wingSweep: number
  tailHeight: number
  windows: number
  /** Livery stripe color (token value). */
  accent: string
}

export interface Aircraft {
  id: string
  manufacturer: string
  model: string
  passengers: number
  /** Cabin sections, nose → tail. */
  zones: CabinZone[]
  /** Optional real model — drop a .glb in /public/models and set the path here. */
  modelUrl?: string
  /** Card thumbnail — 3/4 aerial render of the 3D model (public/thumbs). */
  thumbnail: string
  /** Procedural fallback geometry. */
  jet: JetParams
  /** Camera position preset for this aircraft. */
  cameraPos: [number, number, number]
}

export const AIRCRAFT: Aircraft[] = [
  {
    id: 'global-6000',
    manufacturer: 'Bombardier',
    model: 'Global 6000',
    passengers: 13,
    zones: [
      { id: 'entertainment', name: 'Entertainment Suite' },
      { id: 'lounge', name: 'Main Lounge' },
      { id: 'stateroom', name: 'Private Stateroom' },
      { id: 'ensuite', name: 'En-Suite' },
    ],
    jet: {
      fuselageLength: 7.4,
      fuselageRadius: 0.56,
      wingSpan: 7.6,
      wingSweep: 1.6,
      tailHeight: 1.5,
      windows: 11,
      accent: '#c9a44a',
    },
    cameraPos: [0, 0.55, 10.2],
    thumbnail: '/thumbs/global-6000.png',
  },
  {
    id: 'g650',
    manufacturer: 'Gulfstream',
    model: 'G650',
    passengers: 16,
    zones: [
      { id: 'forward', name: 'Forward Club' },
      { id: 'conference', name: 'Conference Suite' },
      { id: 'stateroom', name: 'Aft Stateroom' },
      { id: 'ensuite', name: 'En-Suite' },
    ],
    jet: {
      fuselageLength: 8.5,
      fuselageRadius: 0.6,
      wingSpan: 8.8,
      wingSweep: 2.1,
      tailHeight: 1.7,
      windows: 14,
      accent: '#8fa6ba',
    },
    cameraPos: [0, 0.65, 11.4],
    thumbnail: '/thumbs/g650.png',
  },
]

export const AIRCRAFT_BY_ID: Record<string, Aircraft> = Object.fromEntries(
  AIRCRAFT.map((a) => [a.id, a]),
)
