import { useMemo, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { Html, Instance, Instances, RoundedBox } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { JetParams } from '@/data/aircraft'
import { useConfiguratorStore } from '@/store/configurator'

/* Fuselage silhouette — (t along length, radius factor). Tuned for the
   long slender look of a Global 6000. */
const PROFILE: Array<[number, number]> = [
  [0, 0.012],
  [0.02, 0.3],
  [0.05, 0.55],
  [0.09, 0.75],
  [0.14, 0.9],
  [0.21, 0.98],
  [0.3, 1],
  [0.58, 1],
  [0.7, 0.94],
  [0.82, 0.72],
  [0.91, 0.45],
  [0.97, 0.22],
  [1, 0.09],
]

/** Radius factor at normalized position t (linear interp over PROFILE). */
function radiusFactorAt(t: number): number {
  for (let i = 1; i < PROFILE.length; i++) {
    const [t1, k1] = PROFILE[i]
    if (t <= t1) {
      const [t0, k0] = PROFILE[i - 1]
      return k0 + ((t - t0) / (t1 - t0)) * (k1 - k0)
    }
  }
  return PROFILE[PROFILE.length - 1][1]
}

function useJetMaterials(accent: string) {
  return useMemo(() => {
    /* Lacquered white paint — clearcoat catches the studio lightformers. */
    const paint = new THREE.MeshPhysicalMaterial({
      color: '#f8f8f6',
      roughness: 0.32,
      metalness: 0.02,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.25,
      transparent: true,
    })
    const steel = new THREE.MeshStandardMaterial({
      color: '#c6ced6',
      roughness: 0.3,
      metalness: 0.55,
      envMapIntensity: 1.1,
      transparent: true,
    })
    const dark = new THREE.MeshStandardMaterial({
      color: '#181a1e',
      roughness: 0.35,
      metalness: 0.4,
      transparent: true,
    })
    const glass = new THREE.MeshPhysicalMaterial({
      color: '#232830',
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.4,
      transparent: true,
    })
    const gold = new THREE.MeshStandardMaterial({
      color: accent,
      roughness: 0.25,
      metalness: 0.75,
      envMapIntensity: 1.2,
      transparent: true,
    })
    const tire = new THREE.MeshStandardMaterial({
      color: '#26262a',
      roughness: 0.9,
      metalness: 0,
      transparent: true,
    })
    return { paint, steel, dark, glass, gold, tire }
  }, [accent])
}

/* Angular window of the cabin cutaway (radians from +z, positive = up). */
const CUT_THETA_A = -0.12
const CUT_THETA_B = 0.88

/* Tail registration texture — drawn on a canvas, no font fetch. */
function useRegistrationTexture(text: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 512, 128)
    ctx.fillStyle = '#2b2b30'
    ctx.font = '700 84px ui-sans-serif, system-ui, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.setTransform(1, 0, -0.18, 1, 0, 0) // slight italic slant
    ctx.fillText(text, 256 + 12, 64)
    const tex = new THREE.CanvasTexture(canvas)
    tex.anisotropy = 4
    return tex
  }, [text])
}

/* Rectangular finish frame (outer rect minus inner rect), thin extrude. */
function useFrameGeometry(width: number, height: number, thickness: number) {
  return useMemo(() => {
    const w = width / 2
    const h = height / 2
    const t = thickness
    const shape = new THREE.Shape()
    shape.moveTo(-w, -h)
    shape.lineTo(w, -h)
    shape.lineTo(w, h)
    shape.lineTo(-w, h)
    shape.closePath()
    const hole = new THREE.Path()
    hole.moveTo(-w + t, -h + t)
    hole.lineTo(w - t, -h + t)
    hole.lineTo(w - t, h - t)
    hole.lineTo(-w + t, h - t)
    hole.closePath()
    shape.holes.push(hole)
    return new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false })
  }, [width, height, thickness])
}

/**
 * Hull split in three so the cutaway is a REAL hole: fore lathe, a
 * cylindrical band missing the cutaway's angular window, aft lathe.
 */
function useHullGeometries(length: number, radius: number, cutT0: number, cutT1: number) {
  return useMemo(() => {
    const lathe = (from: number, to: number) => {
      const inner = PROFILE.filter(([t]) => t > from && t < to)
      const pts = [
        [from, radiusFactorAt(from)] as [number, number],
        ...inner,
        [to, radiusFactorAt(to)] as [number, number],
      ].map(([t, k]) => new THREE.Vector2(k * radius, t * length))
      const geo = new THREE.LatheGeometry(pts, 48)
      geo.rotateZ(-Math.PI / 2)
      geo.translate(-length / 2, 0, 0)
      return geo
    }

    const fore = lathe(0, cutT0)
    const aft = lathe(cutT1, 1)

    /* band with the angular hole — cylinder sweep skips [θa, θb] */
    const band = new THREE.CylinderGeometry(
      radiusFactorAt(cutT0) * radius,
      radiusFactorAt(cutT1) * radius,
      (cutT1 - cutT0) * length,
      48,
      1,
      true,
      CUT_THETA_B,
      Math.PI * 2 - (CUT_THETA_B - CUT_THETA_A),
    )
    band.rotateZ(Math.PI / 2)
    band.translate(((cutT0 + cutT1) / 2 - 0.5) * length, 0, 0)

    return { fore, aft, band }
  }, [length, radius, cutT0, cutT1])
}

/* Swept lifting surface with soft bevelled edges. */
function useBladeGeometry(span: number, sweep: number, rootChord: number, tipChord: number, thickness: number) {
  return useMemo(() => {
    const half = span / 2
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(sweep, half)
    shape.lineTo(sweep + tipChord, half)
    shape.lineTo(rootChord, 0)
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.04,
      bevelSegments: 2,
    })
    geo.rotateX(Math.PI / 2)
    return geo
  }, [span, sweep, rootChord, tipChord, thickness])
}

/* Gold cheatline hugging the flank — split in two so it skips the cutaway. */
function useCheatlineGeometries(length: number, radius: number, cutT0: number, cutT1: number) {
  return useMemo(() => {
    const segment = (from: number, to: number) => {
      const pts: THREE.Vector3[] = []
      const n = Math.max(6, Math.round((to - from) * 30))
      for (let i = 0; i <= n; i++) {
        const t = from + (i / n) * (to - from)
        pts.push(
          new THREE.Vector3(
            (t - 0.5) * length,
            -0.03 + t * 0.09,
            radiusFactorAt(t) * radius * 0.998,
          ),
        )
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.015, 8)
    }
    return [segment(0.055, cutT0 - 0.005), segment(cutT1 + 0.005, 0.955)]
  }, [length, radius, cutT0, cutT1])
}

/* Clickable hotspot on the hull — highlights on hover, opens the cabin. */
function Hotspot({
  position,
  size,
  label,
  sectionIndex,
  children,
}: {
  position: [number, number, number]
  size: [number, number, number]
  label: string
  sectionIndex: number
  children?: ReactNode
}) {
  const [hovered, setHovered] = useState(false)

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    setHovered(false)
    document.body.style.cursor = ''
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = ''
    useConfiguratorStore.getState().enterInterior(sectionIndex)
  }

  return (
    <group position={position} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
      {children}
      {/* gold rim when hovered */}
      <RoundedBox args={size} radius={0.03}>
        <meshStandardMaterial
          color="#c9a86a"
          transparent
          opacity={hovered ? 0.45 : 0}
          emissive="#c9a86a"
          emissiveIntensity={hovered ? 0.6 : 0}
          depthWrite={false}
        />
      </RoundedBox>
      {hovered && (
        <Html center position={[0, size[1] / 2 + 0.32, 0]} zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-pill bg-ink px-3.5 py-1.5 text-[11px] font-medium text-card shadow-float">
            {label}
          </div>
        </Html>
      )}
    </group>
  )
}

interface ProceduralJetProps {
  params: JetParams
}

/**
 * The definitive aircraft model — fully procedural, nose toward -x.
 * The airstair door and the open cabin cutaway are clickable hotspots.
 */
export function ProceduralJet({ params }: ProceduralJetProps) {
  const { fuselageLength: L, fuselageRadius: R, wingSpan, wingSweep, tailHeight, windows, accent } = params
  const mats = useJetMaterials(accent)

  /* cutaway span — clamped to the cylindrical part of the hull */
  const cutawayX = L * 0.02
  const cutT0 = (cutawayX - 0.62) / L + 0.5
  const cutT1 = Math.min((cutawayX + 0.62) / L + 0.5, 0.58)
  const cutX0 = (cutT0 - 0.5) * L
  const cutX1 = (cutT1 - 0.5) * L
  const cutCx = (cutX0 + cutX1) / 2
  const cutW = cutX1 - cutX0

  const hull = useHullGeometries(L, R, cutT0, cutT1)
  const wing = useBladeGeometry(wingSpan, wingSweep, 1.7, 0.4, 0.05)
  const fin = useBladeGeometry(tailHeight * 2, 0.95, 1.3, 0.55, 0.06)
  const stab = useBladeGeometry(2.9, 0.8, 0.72, 0.34, 0.05)
  const winglet = useBladeGeometry(0.55, 0.22, 0.3, 0.12, 0.03)
  const cheatlines = useCheatlineGeometries(L, R, cutT0, cutT1)
  const regTex = useRegistrationTexture('N3810')
  const cutFrame = useFrameGeometry(cutW + 0.08, 0.62, 0.05)

  /* hull band needs DoubleSide so the hole shows the shell's inner face */
  const bandMat = useMemo(() => {
    const m = mats.paint.clone()
    m.side = THREE.DoubleSide
    return m
  }, [mats.paint])

  const windowXs = useMemo(() => {
    const start = -L * 0.3
    const end = L * 0.24
    return Array.from({ length: windows + 4 }, (_, i) => start + (i / (windows + 3)) * (end - start)).filter(
      (x) => Math.abs(x - cutawayX) > 1.0,
    )
  }, [L, windows, cutawayX])

  const tailX = L / 2 - 1.4
  const doorX = -L * 0.3
  const doorZ = radiusFactorAt(doorX / L + 0.5) * R * 0.985

  return (
    <group>
      {/* hull (fore + holed band + aft) and split gold cheatlines */}
      <mesh geometry={hull.fore} material={mats.paint} />
      <mesh geometry={hull.band} material={bandMat} />
      <mesh geometry={hull.aft} material={mats.paint} />
      {cheatlines.map((geo, i) => (
        <group key={i}>
          <mesh geometry={geo} material={mats.gold} />
          <mesh geometry={geo} material={mats.gold} scale={[1, 1, -1]} />
        </group>
      ))}

      {/* aft registration — hugged to the upper flank, both sides */}
      {([1, -1] as const).map((side) => {
        const rx = L * 0.1
        const rz = radiusFactorAt(rx / L + 0.5) * R * 0.99
        return (
          <mesh
            key={side}
            position={[rx, R * 0.44, side * rz]}
            rotation={[-0.4 * side, side === 1 ? 0 : Math.PI, 0]}
          >
            <planeGeometry args={[0.74, 0.185]} />
            <meshBasicMaterial map={regTex} transparent depthWrite={false} />
          </mesh>
        )
      })}

      {/* cabin cutaway finish frame — polished steel surround */}
      <mesh
        geometry={cutFrame}
        material={mats.steel}
        position={[cutCx, R * 0.32, R * 0.87]}
        rotation={[-0.32, 0, 0]}
      />

      {/* cockpit visor */}
      <RoundedBox
        args={[0.6, 0.22, R * 1.42]}
        radius={0.09}
        position={[-L * 0.405, R * 0.34, 0]}
        rotation={[0, 0, -0.22]}
        material={mats.glass}
      />

      {/* cabin windows — oval, skips the cutaway span */}
      <Instances material={mats.dark} limit={windowXs.length * 2}>
        <sphereGeometry args={[0.055, 12, 12]} />
        {windowXs.flatMap((x) =>
          ([1, -1] as const).map((side) => (
            <Instance
              key={`${x}-${side}`}
              position={[x, R * 0.34, side * R * 0.9]}
              scale={[1, 1.3, 0.35]}
            />
          )),
        )}
      </Instances>

      {/* ---- open airstair door (forward, right flank) ------------------- */}
      <Hotspot
        position={[doorX, 0.04, doorZ]}
        size={[0.4, 0.7, 0.08]}
        label="Entrer dans la cabine"
        sectionIndex={0}
      >
        {/* doorway — dark opening with a warm cabin glow */}
        <RoundedBox args={[0.38, 0.68, 0.015]} radius={0.05} position={[0, 0, -0.005]} material={mats.steel} />
        <RoundedBox args={[0.34, 0.64, 0.05]} radius={0.05} position={[0, 0, -0.03]}>
          <meshStandardMaterial color="#2a2118" emissive="#ffbe78" emissiveIntensity={0.35} />
        </RoundedBox>

        {/* lowered door = boarding ramp (hinged at the sill) */}
        <RoundedBox
          args={[0.36, 0.035, 1.28]}
          radius={0.02}
          position={[0, -0.63, 0.44]}
          rotation={[0.78, 0, 0]}
          material={mats.paint}
        />

        {/* steps — horizontal treads over the ramp */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} material={mats.dark} position={[0, -0.32 - i * 0.19, 0.16 + i * 0.19]}>
            <boxGeometry args={[0.3, 0.03, 0.17]} />
          </mesh>
        ))}

        {/* handrails + stanchions */}
        {([1, -1] as const).map((side) => (
          <group key={side}>
            <mesh material={mats.steel} position={[side * 0.185, -0.32, 0.44]} rotation={[0.68, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 1.36, 8]} />
            </mesh>
            {[0, 1, 2].map((i) => (
              <mesh
                key={i}
                material={mats.steel}
                position={[side * 0.185, -0.5 - i * 0.27, 0.16 + i * 0.32]}
              >
                <cylinderGeometry args={[0.009, 0.009, 0.42, 6]} />
              </mesh>
            ))}
          </group>
        ))}
      </Hotspot>

      {/* ---- open cabin cutaway — real hole with a lit diorama inside ---- */}
      <Hotspot
        position={[cutCx, R * 0.3, R * 0.86]}
        size={[cutW, 0.52, 0.05]}
        label="Visiter la cabine"
        sectionIndex={1}
      >
        {/* diorama sits back inside the hull (hotspot local coords) */}
        <group position={[0, -R * 0.3, -R * 0.86]}>
          {/* back wall with glowing windows */}
          <mesh position={[0, R * 0.3, -R * 0.35]}>
            <boxGeometry args={[cutW + 0.1, 0.72, 0.02]} />
            <meshStandardMaterial color="#efe9dd" emissive="#ffe9c8" emissiveIntensity={0.18} />
          </mesh>
          {[-0.38, 0, 0.38].map((x) => (
            <mesh key={x} position={[x, R * 0.42, -R * 0.33]}>
              <planeGeometry args={[0.16, 0.12]} />
              <meshStandardMaterial color="#dfe9f2" emissive="#cfdfef" emissiveIntensity={1.5} />
            </mesh>
          ))}
          {/* floor + ceiling */}
          <mesh position={[0, -0.06, 0]}>
            <boxGeometry args={[cutW + 0.1, 0.025, R * 0.85]} />
            <meshStandardMaterial color="#c9bfae" roughness={0.9} />
          </mesh>
          <mesh position={[0, R * 0.72, 0]}>
            <boxGeometry args={[cutW + 0.1, 0.02, R * 0.85]} />
            <meshStandardMaterial color="#fdf7ec" emissive="#ffe9c8" emissiveIntensity={0.45} />
          </mesh>
          {/* sage sofa (left) + cream armchair (right) */}
          <group position={[-0.28, 0, -R * 0.14]}>
            <RoundedBox args={[0.52, 0.12, 0.16]} radius={0.04} position={[0, 0.02, 0]}>
              <meshStandardMaterial color="#8a9b8a" roughness={0.6} />
            </RoundedBox>
            <RoundedBox args={[0.52, 0.18, 0.05]} radius={0.03} position={[0, 0.12, -0.08]}>
              <meshStandardMaterial color="#8a9b8a" roughness={0.6} />
            </RoundedBox>
          </group>
          <group position={[0.34, 0, -R * 0.12]}>
            <RoundedBox args={[0.22, 0.12, 0.16]} radius={0.04} position={[0, 0.02, 0]}>
              <meshStandardMaterial color="#efe6d8" roughness={0.6} />
            </RoundedBox>
            <RoundedBox args={[0.22, 0.2, 0.05]} radius={0.03} position={[0, 0.13, -0.08]}>
              <meshStandardMaterial color="#efe6d8" roughness={0.6} />
            </RoundedBox>
          </group>
          {/* walnut side partitions closing the diorama */}
          {([1, -1] as const).map((side) => (
            <mesh key={side} position={[side * (cutW / 2 + 0.04), R * 0.3, -R * 0.18]}>
              <boxGeometry args={[0.03, 0.74, R * 0.7]} />
              <meshStandardMaterial color="#7a5a42" roughness={0.55} />
            </mesh>
          ))}
        </group>
      </Hotspot>

      {/* wings — dihedral + winglets + wingtip nav lights */}
      {([1, -1] as const).map((side) => (
        <group key={side} scale={[1, 1, side]}>
          <mesh
            geometry={wing}
            material={mats.paint}
            position={[0.15, -R * 0.45, 0]}
            rotation={[-0.07, 0, 0]}
          />
          <mesh
            geometry={winglet}
            material={mats.paint}
            position={[0.15 + wingSweep + 0.1, -R * 0.45 + wingSpan * 0.035, wingSpan / 2 - 0.02]}
            rotation={[-1.25, 0, 0]}
          />
          {/* nav light: +z (starboard) green, -z (port) red */}
          <mesh position={[0.15 + wingSweep + 0.16, -R * 0.45 + wingSpan * 0.05, wingSpan / 2 - 0.01]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial
              color={side === 1 ? '#2ec46b' : '#e5484d'}
              emissive={side === 1 ? '#2ec46b' : '#e5484d'}
              emissiveIntensity={1.4}
            />
          </mesh>
        </group>
      ))}

      {/* rear engines */}
      {([1, -1] as const).map((side) => (
        <group key={side} position={[tailX - 0.5, R * 0.6, side * (R + 0.32)]}>
          <mesh material={mats.steel} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.23, 0.75, 8, 20]} />
          </mesh>
          {/* intake lip + dark core */}
          <mesh material={mats.dark} position={[-0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.19, 0.19, 0.06, 24]} />
          </mesh>
          {/* exhaust cone */}
          <mesh material={mats.dark} position={[0.62, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.13, 0.28, 20]} />
          </mesh>
          {/* pylon */}
          <mesh material={mats.paint} position={[0, -0.05, side * -0.3]}>
            <boxGeometry args={[0.62, 0.14, 0.32]} />
          </mesh>
        </group>
      ))}

      {/* T-tail + red anti-collision beacon on the fin apex */}
      <group position={[tailX, R * 0.4, 0]}>
        <mesh geometry={fin} material={mats.paint} rotation={[-Math.PI / 2, 0, 0]} />
        {([1, -1] as const).map((side) => (
          <mesh
            key={side}
            geometry={stab}
            material={mats.paint}
            position={[0.62, tailHeight + 0.03, 0]}
            scale={[1, 1, side]}
          />
        ))}
        <mesh position={[0.5, tailHeight + 0.14, 0]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#e5484d" emissive="#e5484d" emissiveIntensity={1.5} />
        </mesh>
      </group>

      {/* ---- landing gear ------------------------------------------------ */}
      {/* nose gear */}
      <group position={[-L * 0.355, -R * 0.8, 0]}>
        <mesh material={mats.steel} position={[0, -0.26, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.52, 10]} />
        </mesh>
        <mesh material={mats.tire} position={[0, -0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.08, 18]} />
        </mesh>
      </group>
      {/* main gear */}
      {([1, -1] as const).map((side) => (
        <group key={side} position={[L * 0.06, -R * 0.8, side * 0.55]}>
          <mesh material={mats.steel} position={[0, -0.24, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.48, 10]} />
          </mesh>
          {[-0.06, 0.06].map((dz) => (
            <mesh key={dz} material={mats.tire} position={[0, -0.5, dz]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.11, 0.11, 0.09, 18]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
