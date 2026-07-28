import global6000Img from '@/assets/plane-2d.webp'
import g650Img from '@/assets/plane-g650.webp'

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

/** Percent-based rect over the 2D profile image. */
export interface Hotspot2D {
  left: string
  top: string
  width: string
  height: string
}

/** Flat side-profile artwork + the clickable regions drawn on it. */
export interface View2D {
  image: string
  door: Hotspot2D
  cabin: Hotspot2D
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
  /** 2D exterior view — artwork and hotspot geometry differ per aircraft. */
  view2d: View2D
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
    view2d: {
      image: global6000Img,
      door: { left: '18.6%', top: '6%', width: '8.4%', height: '88%' },
      cabin: { left: '28%', top: '8%', width: '42%', height: '42%' },
    },
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
    view2d: {
      image: g650Img,
      door: { left: '13.5%', top: '26%', width: '8%', height: '74%' },
      cabin: { left: '44.5%', top: '18%', width: '18%', height: '40%' },
    },
  },
]

export const AIRCRAFT_BY_ID: Record<string, Aircraft> = Object.fromEntries(
  AIRCRAFT.map((a) => [a.id, a]),
)
