import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import gsap from 'gsap'
import { CABINS, toWorldX, toWorldZ, type Seat } from '@/data/cabin'
import { useConfiguratorStore, selectSelectedSeatId } from '@/store/configurator'
import { prefersReducedMotion } from '@/lib/motion'

/* ---------------------------------------------------------------------------
 * Zone ambiances — floor, mood light, upholstery. Keyed by zoneId across
 * both aircraft. Anything unknown falls back to `default`.
 * ------------------------------------------------------------------------ */
interface ZoneStyle {
  floor: string
  light: string
  lightIntensity: number
  seat: string
}

const ZONE_STYLES: Record<string, ZoneStyle> = {
  entertainment: { floor: '#b9a68c', light: '#ffe6c2', lightIntensity: 1.0, seat: '#8a9b8a' },
  lounge: { floor: '#c4bba9', light: '#fff1dc', lightIntensity: 1.15, seat: '#b0794d' },
  stateroom: { floor: '#a8917a', light: '#ffd9a6', lightIntensity: 0.7, seat: '#e7dfd2' },
  ensuite: { floor: '#d6d2ca', light: '#eef2f5', lightIntensity: 0.95, seat: '#e7dfd2' },
  forward: { floor: '#c4bba9', light: '#fff1dc', lightIntensity: 1.1, seat: '#b0794d' },
  conference: { floor: '#b9a68c', light: '#ffe6c2', lightIntensity: 1.05, seat: '#8a9b8a' },
  default: { floor: '#c4bba9', light: '#fff1dc', lightIntensity: 1.0, seat: '#e7dfd2' },
}

function zoneStyle(zoneId: string): ZoneStyle {
  return ZONE_STYLES[zoneId] ?? ZONE_STYLES.default
}

/* Shared woods & fabrics */
const WALNUT = new THREE.MeshStandardMaterial({ color: '#7a5a42', roughness: 0.55, metalness: 0.08 })
const WALNUT_DARK = new THREE.MeshStandardMaterial({ color: '#463225', roughness: 0.5, metalness: 0.08 })
const BRASS = new THREE.MeshStandardMaterial({ color: '#c9a86a', roughness: 0.3, metalness: 0.8 })
const SCREEN = new THREE.MeshPhysicalMaterial({
  color: '#0e1013',
  roughness: 0.15,
  metalness: 0.3,
  clearcoat: 0.8,
})
const MARBLE = new THREE.MeshPhysicalMaterial({
  color: '#e9e4da',
  roughness: 0.2,
  metalness: 0.02,
  clearcoat: 0.6,
})
const LINEN = new THREE.MeshStandardMaterial({ color: '#f1ece1', roughness: 0.85 })
const DUVET = new THREE.MeshStandardMaterial({ color: '#c8d4de', roughness: 0.8 })

/* Seat state tones */
const TONE_HOVER = new THREE.Color('#c9a44a')
const TONE_SELECTED = new THREE.Color('#1c1c1e')
const TONE_OCCUPIED = new THREE.Color('#8e8e94')

interface Seat3DProps {
  seat: Seat
  worldPos: [number, number, number]
  baseColor: string
}

/** Clickable seat / divan / bed — hover gold, selected ink, occupied dim. */
function Seat3D({ seat, worldPos, baseColor }: Seat3DProps) {
  const hoveredSeatId = useConfiguratorStore((s) => s.hoveredSeatId)
  const selectedSeatId = useConfiguratorStore(selectSelectedSeatId)
  const selectSeat = useConfiguratorStore((s) => s.selectSeat)
  const setHoveredSeat = useConfiguratorStore((s) => s.setHoveredSeat)

  const hovered = hoveredSeatId === seat.id
  const selected = selectedSeatId === seat.id

  const groupRef = useRef<THREE.Group>(null)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const g = groupRef.current
    if (!g || seat.occupied) return
    const target = hovered && !selected ? 1.05 : 1
    if (prefersReducedMotion()) {
      g.scale.setScalar(target)
      invalidate()
      return
    }
    const tween = gsap.to(g.scale, {
      x: target,
      y: target,
      z: target,
      duration: 0.25,
      ease: 'power2.out',
      onUpdate: () => invalidate(),
    })
    return () => {
      tween.kill()
    }
  }, [hovered, selected, seat.occupied, invalidate])

  const color = seat.occupied
    ? TONE_OCCUPIED
    : selected
      ? TONE_SELECTED
      : hovered
        ? TONE_HOVER
        : new THREE.Color(baseColor)

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredSeat(seat.id)
    document.body.style.cursor = seat.occupied ? 'not-allowed' : 'pointer'
  }
  const onOut = () => {
    setHoveredSeat(null)
    document.body.style.cursor = ''
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (seat.occupied) return
    selectSeat(selected ? null : seat.id)
  }

  const upholstery = (
    <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} />
  )

  /* Backrest faces the aisle for side seats. */
  const backZ = seat.z > 0 ? 1 : -1

  return (
    <group
      ref={groupRef}
      position={worldPos}
      onPointerOver={onOver}
      onPointerOut={onOut}
      onClick={onClick}
    >
      {seat.kind === 'seat' && (
        <>
          {/* pedestal + cushion + backrest + armrests */}
          <mesh material={WALNUT_DARK} position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 0.18, 14]} />
          </mesh>
          <RoundedBox args={[0.5, 0.14, 0.5]} radius={0.05} position={[0, 0.27, 0]}>
            {upholstery}
          </RoundedBox>
          <RoundedBox
            args={[0.48, 0.48, 0.13]}
            radius={0.06}
            position={[0, 0.56, backZ * 0.21]}
            rotation={[backZ * -0.12, 0, 0]}
          >
            {upholstery}
          </RoundedBox>
          {[-1, 1].map((side) => (
            <RoundedBox
              key={side}
              args={[0.1, 0.16, 0.4]}
              radius={0.04}
              position={[side * 0.25, 0.4, 0]}
            >
              {upholstery}
            </RoundedBox>
          ))}
        </>
      )}

      {seat.kind === 'divan' && (
        <>
          <RoundedBox args={[1.45, 0.18, 0.6]} radius={0.07} position={[0, 0.22, 0]}>
            {upholstery}
          </RoundedBox>
          <RoundedBox args={[1.45, 0.5, 0.16]} radius={0.07} position={[0, 0.5, backZ * 0.24]}>
            {upholstery}
          </RoundedBox>
          {/* back cushions */}
          {[-0.42, 0.06, 0.54].map((x) => (
            <RoundedBox key={x} args={[0.4, 0.3, 0.12]} radius={0.06} position={[x - 0.06, 0.42, backZ * 0.18]}>
              {upholstery}
            </RoundedBox>
          ))}
          <mesh material={WALNUT_DARK} position={[0, 0.08, 0]}>
            <boxGeometry args={[1.3, 0.1, 0.5]} />
          </mesh>
        </>
      )}

      {seat.kind === 'bed' && (
        <>
          {/* frame, mattress, duvet, pillows, headboard */}
          <mesh material={WALNUT} position={[0, 0.14, 0]}>
            <boxGeometry args={[1.7, 0.16, 1.25]} />
          </mesh>
          <RoundedBox args={[1.62, 0.16, 1.16]} radius={0.05} position={[0, 0.3, 0]}>
            <meshStandardMaterial color={color} roughness={0.8} />
          </RoundedBox>
          <RoundedBox args={[1.15, 0.1, 1.18]} radius={0.05} position={[0.24, 0.4, 0]}>
            <primitive object={DUVET} attach="material" />
          </RoundedBox>
          {[-0.28, 0.28].map((z) => (
            <RoundedBox key={z} args={[0.34, 0.11, 0.5]} radius={0.05} position={[-0.58, 0.42, z]}>
              <primitive object={LINEN} attach="material" />
            </RoundedBox>
          ))}
          <RoundedBox args={[0.1, 0.6, 1.25]} radius={0.04} position={[-0.85, 0.5, 0]}>
            {upholstery}
          </RoundedBox>
        </>
      )}

      {/* selection / hover halo */}
      {(selected || hovered) && !seat.occupied && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry
            args={[seat.kind === 'seat' ? 0.42 : 0.95, seat.kind === 'seat' ? 0.5 : 1.05, 44]}
          />
          <meshBasicMaterial color={selected ? '#1c1c1e' : '#c9a44a'} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  )
}

/**
 * Cabin interior — vaulted shell + four themed zones (media wall, lounge
 * tables, stateroom, en-suite vanity). Seats stay clickable.
 */
export function CabinInterior({ aircraftId }: { aircraftId: string }) {
  const layout = CABINS[aircraftId]
  const zones = useMemo(() => Object.entries(layout.zoneRanges), [layout])
  const { length: L, radius: R } = layout

  const windowXs = useMemo(() => {
    const n = Math.round(L * 1.6)
    return Array.from({ length: n }, (_, i) => (i / (n - 1) - 0.5) * L * 0.92)
  }, [L])

  const stateroomRange = layout.zoneRanges.stateroom
  const ensuiteRange = layout.zoneRanges.ensuite

  return (
    <group>
      {/* per-zone carpet */}
      {zones.map(([zoneId, [x0, x1]]) => (
        <mesh
          key={zoneId}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[toWorldX(layout, (x0 + x1) / 2), 0.004, 0]}
        >
          <planeGeometry args={[(x1 - x0) * L + 0.12, R * 1.66]} />
          <meshStandardMaterial color={zoneStyle(zoneId).floor} roughness={0.95} />
        </mesh>
      ))}
      {/* aisle runner */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <planeGeometry args={[L + 0.4, 0.56]} />
        <meshStandardMaterial color="#8c8274" roughness={0.95} />
      </mesh>

      {/* vaulted wall */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[R, R, L + 0.6, 32, 1, true, Math.PI * -0.05, Math.PI * 1.1]} />
        <meshStandardMaterial color="#f1ede5" roughness={0.85} side={THREE.BackSide} />
      </mesh>
      {/* end caps — close the tube so light doesn't leak through */}
      {([1, -1] as const).map((end) => (
        <mesh key={end} position={[end * (L / 2 + 0.3), 0.02, 0]} rotation={[0, (-end * Math.PI) / 2, 0]}>
          <circleGeometry args={[R * 1.08, 24]} />
          <meshStandardMaterial color="#ece7de" roughness={0.9} />
        </mesh>
      ))}

      {/* walnut wainscot along both flanks */}
      {([1, -1] as const).map((side) => (
        <mesh key={side} position={[0, 0.3, side * R * 0.88]}>
          <boxGeometry args={[L + 0.4, 0.6, 0.05]} />
          <primitive object={WALNUT} attach="material" />
        </mesh>
      ))}

      {/* windows */}
      {windowXs.flatMap((x) =>
        ([1, -1] as const).map((side) => (
          <mesh
            key={`${x}-${side}`}
            position={[x, R * 0.62, side * R * 0.86]}
            rotation={[0, (side * Math.PI) / 2, 0]}
          >
            <planeGeometry args={[0.34, 0.24]} />
            <meshStandardMaterial
              color="#dfe9f2"
              emissive="#cfdfef"
              emissiveIntensity={1.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        )),
      )}

      {/* ceiling light strip — just under the vault apex */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, R * 0.97, 0]}>
        <planeGeometry args={[L * 0.86, 0.22]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff6e8" emissiveIntensity={1.2} />
      </mesh>

      {/* zone bulkheads with brass trim */}
      {zones.slice(1).map(([zoneId, [x0]]) =>
        ([1, -1] as const).map((side) => (
          <group key={`${zoneId}-${side}`} position={[toWorldX(layout, x0 - 0.01), 0, side * R * 0.74]}>
            <mesh position={[0, R * 0.4, 0]}>
              <boxGeometry args={[0.05, R * 0.8, R * 0.3]} />
              <primitive object={WALNUT} attach="material" />
            </mesh>
            <mesh material={BRASS} position={[0.035, R * 0.4, 0]}>
              <boxGeometry args={[0.008, R * 0.8, R * 0.3]} />
            </mesh>
          </group>
        )),
      )}

      {/* ---- Entertainment / media wall — flush against the forward wall - */}
      <group position={[-L / 2 + 0.22, 0, 0]}>
        <RoundedBox args={[0.05, 0.58, 1.0]} radius={0.02} position={[0.12, 1.02, 0]} material={SCREEN} />
        <mesh material={WALNUT} position={[0.06, 0.3, 0]}>
          <boxGeometry args={[0.24, 0.6, 1.35]} />
        </mesh>
        <mesh material={BRASS} position={[0.19, 0.61, 0]}>
          <boxGeometry args={[0.015, 0.012, 1.3]} />
        </mesh>
      </group>
      {/* ---- Stateroom dressing ------------------------------------------ */}
      {stateroomRange && (
        <group position={[toWorldX(layout, (stateroomRange[0] + stateroomRange[1]) / 2), 0, 0]}>
          {/* rug */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[0.95, 36]} />
            <meshStandardMaterial color="#93826f" roughness={1} />
          </mesh>
          {/* bedside lamp glow */}
          <mesh position={[0.75, 0.55, -R * 0.55]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#ffe1b0" emissive="#ffcf8f" emissiveIntensity={2.2} />
          </mesh>
        </group>
      )}

      {/* ---- En-suite vanity ---------------------------------------------- */}
      {ensuiteRange && (
        <group position={[toWorldX(layout, (ensuiteRange[0] + ensuiteRange[1]) / 2), 0, -R * 0.52]}>
          <mesh material={WALNUT_DARK} position={[0, 0.35, 0]}>
            <boxGeometry args={[1.1, 0.7, 0.5]} />
          </mesh>
          <RoundedBox args={[1.16, 0.05, 0.56]} radius={0.02} position={[0, 0.72, 0]} material={MARBLE} />
          <mesh material={MARBLE} position={[0.2, 0.78, 0]}>
            <cylinderGeometry args={[0.16, 0.13, 0.1, 24]} />
          </mesh>
          <mesh material={BRASS} position={[-0.08, 0.84, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
          </mesh>
          {/* mirror — flush on the wall behind the vanity */}
          <RoundedBox args={[0.66, 0.42, 0.02]} radius={0.02} position={[0, 1.14, -0.34]} rotation={[0.12, 0, 0]}>
            <meshStandardMaterial
              color="#dfe6ec"
              roughness={0.05}
              metalness={0.9}
              emissive="#aebcc8"
              emissiveIntensity={0.25}
            />
          </RoundedBox>
        </group>
      )}

      {/* seats */}
      {layout.seats.map((seat) => (
        <Seat3D
          key={seat.id}
          seat={seat}
          worldPos={[toWorldX(layout, seat.x), 0.02, toWorldZ(layout, seat.z)]}
          baseColor={zoneStyle(seat.zoneId).seat}
        />
      ))}

      {/* mood lighting — two lights max (fragment cost), zones tinted via
          floors/materials; warm center + dim aft for the stateroom */}
      <hemisphereLight args={['#fff4e4', '#6b5c4a', 0.55]} />
      <pointLight position={[-L * 0.15, R * 0.9, 0]} intensity={1.15} color="#fff1dc" distance={L * 1.4} decay={1.5} />
      <pointLight position={[L * 0.3, R * 0.85, 0]} intensity={0.65} color="#ffd9a6" distance={L * 0.9} decay={1.6} />
    </group>
  )
}
