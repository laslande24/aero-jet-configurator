import { Suspense, useEffect, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  useProgress,
} from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/lib/motion'
import { AIRCRAFT_BY_ID } from '@/data/aircraft'
import { CABINS, toWorldX, zoneCenter } from '@/data/cabin'
import { useConfiguratorStore, type ViewMode } from '@/store/configurator'
import { ProceduralJet } from '@/features/stage/ProceduralJet'
import { GltfJet } from '@/features/stage/GltfJet'
import { ModelBoundary } from '@/features/stage/ModelBoundary'
import { CabinInterior } from '@/features/stage/CabinInterior'

const EXTERIOR_TARGET: [number, number, number] = [0, 0.15, 0]
const BASE_FOV = 32

/**
 * Interior camera preset — clamped inside the cabin shell.
 * The first zone sits against the nose: it is viewed looking FORWARD
 * (toward the media wall); every other zone is viewed looking aft.
 */
function interiorCam(aircraftId: string, sectionIndex: number) {
  const aircraft = AIRCRAFT_BY_ID[aircraftId]
  const layout = CABINS[aircraftId]
  const zoneId = aircraft.zones[sectionIndex].id
  const cx = toWorldX(layout, zoneCenter(layout, zoneId))
  const half = layout.length / 2
  const lookForward = sectionIndex === 0

  const px = lookForward
    ? Math.min(cx + 2.2, half - 0.5)
    : Math.max(cx - 2.2, -half + 0.8)
  const tx = lookForward
    ? Math.max(cx - 0.5, -half + 0.35)
    : Math.min(cx + 0.7, half - 0.4)

  return {
    lookForward,
    pos: [px, 1.25, 0.05] as [number, number, number],
    target: [tx, 0.7, 0] as [number, number, number],
  }
}

function setGroupOpacity(group: THREE.Group, value: number) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const m of mats) m.opacity = value
    }
  })
}

function LoaderPill() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex w-48 flex-col items-center gap-2 rounded-card bg-card px-5 py-3 shadow-float">
        <span className="whitespace-nowrap text-xs font-medium text-ink-soft">
          Chargement du modèle… {Math.round(progress)}%
        </span>
        <span className="h-1 w-full overflow-hidden rounded-pill bg-surface-sunken">
          <span
            className="block h-full origin-left rounded-pill bg-ink transition-transform duration-300 ease-[var(--ease-out-soft)]"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </span>
      </div>
    </Html>
  )
}

function JetForAircraft({ id }: { id: string }) {
  const aircraft = AIRCRAFT_BY_ID[id]
  const procedural = <ProceduralJet params={aircraft.jet} />
  if (!aircraft.modelUrl) return procedural
  return (
    <ModelBoundary resetKey={aircraft.modelUrl} fallback={procedural}>
      <GltfJet url={aircraft.modelUrl} />
    </ModelBoundary>
  )
}

interface DirectorProps {
  overlayRef: RefObject<HTMLDivElement | null>
}

/**
 * Scene router + camera choreographer. Owns what is actually displayed
 * (aircraft, view mode) and animates every transition with GSAP timelines:
 * exterior model switch, cabin entry/exit, section-to-section dolly.
 */
function Director({ overlayRef }: DirectorProps) {
  const activeId = useConfiguratorStore((s) => s.activeAircraftId)
  const viewMode = useConfiguratorStore((s) => s.viewMode)
  const sectionIndex = useConfiguratorStore((s) => s.sectionIndex)

  const [shown, setShown] = useState<{ aircraftId: string; mode: ViewMode }>({
    aircraftId: activeId,
    mode: viewMode,
  })

  const exteriorGroup = useRef<THREE.Group>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)

  /* dev aid: expose camera + controls for runtime inspection */
  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__stage = { camera, controls: controlsRef, tl: tlRef }
  }

  /* Place camera + controls for a state, instantly. */
  const jumpTo = (aircraftId: string, mode: ViewMode, section: number) => {
    const controls = controlsRef.current
    const persp = camera as THREE.PerspectiveCamera
    persp.fov = BASE_FOV
    persp.updateProjectionMatrix()
    if (mode === 'interior') {
      const cam = interiorCam(aircraftId, section)
      camera.position.set(...cam.pos)
      controls?.target.set(...cam.target)
    } else {
      camera.position.set(...AIRCRAFT_BY_ID[aircraftId].cameraPos)
      controls?.target.set(...EXTERIOR_TARGET)
    }
    controls?.update()
    invalidate()
  }

  /* ---- transition: view mode and/or aircraft change ------------------- */
  useEffect(() => {
    const modeChanged = viewMode !== shown.mode
    const aircraftChanged = activeId !== shown.aircraftId
    if (!modeChanged && !aircraftChanged) return

    const overlay = overlayRef.current
    const nextState = { aircraftId: activeId, mode: viewMode }

    if (prefersReducedMotion() || !overlay) {
      setShown(nextState)
      jumpTo(activeId, viewMode, sectionIndex)
      return
    }

    tlRef.current?.kill()
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: () => invalidate() })
    tlRef.current = tl

    /* Freeze orbit controls for the whole transition — their damping loop
       rewrites camera.position every frame and would fight the tweens. */
    if (controlsRef.current) controlsRef.current.enabled = false

    tl.addLabel('approach')

    const persp = camera as THREE.PerspectiveCamera

    if (modeChanged && viewMode === 'interior') {
      /* cinematic entry — dolly toward the fuselage door, slight focal squeeze */
      tl.to(camera.position, { x: -1.4, y: 1.15, z: 3.2, duration: 0.7, ease: 'power2.in' }, 'approach')
        .to(
          persp,
          {
            fov: 27,
            duration: 0.7,
            ease: 'power2.in',
            onUpdate: () => persp.updateProjectionMatrix(),
          },
          'approach',
        )
    } else if (modeChanged) {
      /* pull back out of the cabin */
      tl.to(camera.position, { x: '-=0.9', duration: 0.5, ease: 'power2.in' }, 'approach')
    } else if (shown.mode === 'exterior' && exteriorGroup.current) {
      /* exterior aircraft switch — drift + fade the model */
      const g = exteriorGroup.current
      const fade = { o: 1 }
      tl.to(
        fade,
        { o: 0, duration: 0.38, ease: 'power2.in', onUpdate: () => setGroupOpacity(g, fade.o) },
        'approach',
      ).to(g.position, { x: -1.6, duration: 0.38, ease: 'power2.in' }, 'approach')
    }

    tl.to(
      overlay,
      { autoAlpha: 1, duration: 0.3, ease: 'power1.in' },
      modeChanged ? 'approach+=0.35' : 'approach+=0.15',
    )
      .addLabel('swap')
      .call(
        () => {
          /* swap the scene only — the camera is placed in the next call,
             after React has remounted the mode-specific OrbitControls */
          setShown(nextState)
          if (exteriorGroup.current) {
            exteriorGroup.current.position.x = 0
            setGroupOpacity(exteriorGroup.current, 1)
          }
        },
        undefined,
        'swap',
      )
      .call(
        () => {
          if (import.meta.env.DEV) console.log('[tl] place-camera call fired')
          jumpTo(activeId, viewMode, useConfiguratorStore.getState().sectionIndex)
          if (viewMode === 'interior' && modeChanged) {
            camera.position.x -= 0.7
            persp.fov = 46
            persp.updateProjectionMatrix()
          }
        },
        undefined,
        'swap+=0.12',
      )
      .to(overlay, { autoAlpha: 0, duration: 0.55, ease: 'power2.out' }, 'swap+=0.2')

    if (viewMode === 'interior') {
      /* step inside: wide-eyed focal settle + glide forward down the aisle */
      if (modeChanged) {
        tl.to(
          persp,
          {
            fov: BASE_FOV,
            duration: 1.35,
            ease: 'power3.out',
            onUpdate: () => persp.updateProjectionMatrix(),
          },
          'swap+=0.2',
        )
      }
      tl.to(
        camera.position,
        {
          x: `+=0.7`,
          duration: modeChanged ? 1.35 : 1.0,
          ease: 'power3.out',
        },
        'swap+=0.2',
      )
    }

    const release = () => {
      const controls = controlsRef.current
      if (controls) {
        controls.enabled = true
        controls.update()
      }
      invalidate()
    }
    tl.eventCallback('onComplete', release)

    return () => {
      /* interrupted mid-flight: land on the destination state, then release */
      if (tl.isActive()) {
        if (import.meta.env.DEV) console.log('[tl] CLEANUP killed active timeline')
        tl.kill()
        jumpTo(activeId, viewMode, useConfiguratorStore.getState().sectionIndex)
      } else {
        tl.kill()
      }
      release()
      if (overlay) gsap.set(overlay, { autoAlpha: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, viewMode])

  /* ---- transition: section navigation (interior dolly) ---------------- */
  useEffect(() => {
    if (shown.mode !== 'interior') return
    /* the mode/aircraft timeline already places the camera for this section */
    if (tlRef.current?.isActive()) return
    const controls = controlsRef.current
    if (!controls) return
    const cam = interiorCam(shown.aircraftId, sectionIndex)

    if (prefersReducedMotion()) {
      jumpTo(shown.aircraftId, 'interior', sectionIndex)
      return
    }

    controls.enabled = false
    const tween = gsap.timeline({
      onUpdate: () => invalidate(),
      onComplete: () => {
        controls.enabled = true
        controls.update()
        invalidate()
      },
    })
    tween
      .to(
        camera.position,
        { x: cam.pos[0], y: cam.pos[1], z: cam.pos[2], duration: 0.95, ease: 'power3.inOut' },
        0,
      )
      .to(
        controls.target,
        {
          x: cam.target[0],
          y: cam.target[1],
          z: cam.target[2],
          duration: 0.95,
          ease: 'power3.inOut',
        },
        0,
      )
    return () => {
      tween.kill()
      controls.enabled = true
      controls.update()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIndex, shown.mode, shown.aircraftId])

  const interior = shown.mode === 'interior'
  const cam = interior ? interiorCam(shown.aircraftId, sectionIndex) : null

  return (
    <>
      {interior ? (
        <CabinInterior aircraftId={shown.aircraftId} />
      ) : (
        <>
          <group ref={exteriorGroup}>
            <JetForAircraft id={shown.aircraftId} />
          </group>
          <ContactShadows position={[0, -1.12, 0]} scale={16} blur={2.4} opacity={0.35} far={4} />
        </>
      )}

      <OrbitControls
        key={interior ? `interior-${cam!.lookForward ? 'fwd' : 'aft'}` : 'exterior'}
        ref={controlsRef}
        makeDefault
        target={interior ? cam!.target : EXTERIOR_TARGET}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={interior ? 0.35 : 0.55}
        minDistance={interior ? 0.4 : 7}
        maxDistance={interior ? 3.4 : 16}
        minPolarAngle={interior ? Math.PI * 0.32 : Math.PI * 0.22}
        maxPolarAngle={interior ? Math.PI * 0.58 : Math.PI * 0.52}
        minAzimuthAngle={
          interior ? (cam!.lookForward ? Math.PI * 0.25 : -Math.PI * 0.75) : -Math.PI * 0.42
        }
        maxAzimuthAngle={
          interior ? (cam!.lookForward ? Math.PI * 0.75 : -Math.PI * 0.25) : Math.PI * 0.42
        }
      />
    </>
  )
}

function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer intensity={1.1} rotation-x={Math.PI / 2} position={[0, 5, 0]} scale={[10, 10, 1]} />
      <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, 1.5, -1]} scale={[7, 3, 1]} />
      <Lightformer intensity={0.65} rotation-y={-Math.PI / 2} position={[5, 1.5, 0]} scale={[7, 3, 1]} color="#dde6ee" />
    </Environment>
  )
}

/** Interactive 3D stage — exterior showcase + cabin interior with seat picking. */
export function Stage() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const initialCam = AIRCRAFT_BY_ID[useConfiguratorStore.getState().activeAircraftId].cameraPos

  return (
    <div
      className="relative h-[min(52vh,620px)] min-h-[300px] w-full touch-pan-y"
      role="img"
      aria-label="Vue 3D interactive de l'appareil. Équivalent clavier : utilisez le plan de cabine ci-dessous pour choisir un siège et les boutons Sections pour naviguer."
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ fov: 32, position: initialCam, near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          /* dev-only: lets tooling read the canvas (thumbnail captures) */
          preserveDrawingBuffer:
            import.meta.env.DEV && window.location.search.includes('snap'),
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 7, 3]} intensity={0.9} />
        <Suspense fallback={<LoaderPill />}>
          <StudioEnvironment />
          <Director overlayRef={overlayRef} />
        </Suspense>
      </Canvas>
      {/* transition veil — GSAP fades it during scene cuts */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-card bg-surface"
        style={{ opacity: 0, visibility: 'hidden' }}
      />
    </div>
  )
}
