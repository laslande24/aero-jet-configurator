import { AIRCRAFT_BY_ID } from '@/data/aircraft'
import { useConfiguratorStore } from '@/store/configurator'
import { PillNav, type NavItem } from '@/components/PillNav'
import { FloatingButton } from '@/components/FloatingButton'
import { AircraftCard } from '@/components/AircraftCard'
import { Floorplan } from '@/components/Floorplan'
import { SectionTabs } from '@/components/SectionTabs'
import { Icon } from '@/components/Icon'
import { JetSilhouette } from '@/components/JetSilhouette'
import { Cabin2DView } from '@/components/Cabin2DView'
import { SummaryPanel } from '@/features/booking/SummaryPanel'
import { Confirmation } from '@/features/booking/Confirmation'
import { prefersReducedMotion } from '@/lib/motion'
import { Suspense, lazy, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

/* three.js lives in its own chunk — the shell paints before the 3D loads. */
const Stage = lazy(() =>
  import('@/features/stage/Stage').then((m) => ({ default: m.Stage })),
)

/* Shown while the 3D chunk streams in — quiet pulse, no spinner. */
function StageSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-[300px] w-full flex-col items-center justify-center gap-3 sm:h-[360px]"
    >
      <JetSilhouette mini className="w-2/3 max-w-md animate-pulse opacity-50" />
      <p className="text-[10px] uppercase tracking-[0.22em] text-ink-subtle">
        Préparation du hangar…
      </p>
    </div>
  )
}

const NAV_ITEMS: NavItem[] = [
  { id: 'aircraft', label: 'Aircraft', icon: 'aircraft' },
  { id: 'interior', label: 'Interior', icon: 'interior' },
  { id: 'exterior', label: 'Exterior', icon: 'exterior' },
  { id: 'summary', label: 'Summary', icon: 'summary' },
]

/**
 * Configurator screen — Phase 1 layout, Phase 2 interactive 3D stage.
 * Aircraft switch lives in the Zustand store; the ‹ › pager cycles models.
 */
export default function ConfiguratorScreen() {
  const activeId = useConfiguratorStore((s) => s.activeAircraftId)
  const nextAircraft = useConfiguratorStore((s) => s.nextAircraft)
  const prevAircraft = useConfiguratorStore((s) => s.prevAircraft)
  const viewMode = useConfiguratorStore((s) => s.viewMode)
  const sectionIndex = useConfiguratorStore((s) => s.sectionIndex)
  const setSection = useConfiguratorStore((s) => s.setSection)
  const nextSection = useConfiguratorStore((s) => s.nextSection)
  const enterInterior = useConfiguratorStore((s) => s.enterInterior)
  const exitInterior = useConfiguratorStore((s) => s.exitInterior)
  const viewDimension = useConfiguratorStore((s) => s.viewDimension)
  const toggleDimension = useConfiguratorStore((s) => s.toggleDimension)
  const screen = useConfiguratorStore((s) => s.screen)
  const openSummary = useConfiguratorStore((s) => s.openSummary)
  const closeSummary = useConfiguratorStore((s) => s.closeSummary)
  const aircraft = AIRCRAFT_BY_ID[activeId]

  const interior = viewMode === 'interior'
  const configure = screen === 'configure'
  /* 2D toggle only governs the exterior; the cabin visit is always 3D. */
  const flat2d = !interior && viewDimension === '2d'

  /* Staggered reveal of the visible screen's blocks — on load and screen change.
     gsap.from + clearProps: content is visible by default, never gated. */
  const mainRef = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const root = mainRef.current
    if (!root || prefersReducedMotion()) return
    const els = [...root.querySelectorAll<HTMLElement>('[data-reveal]')].filter(
      (el) => el.offsetParent !== null,
    )
    if (els.length === 0) return
    /* context + revert: never strand a from() in its hidden start state */
    const ctx = gsap.context(() => {
      gsap.from(els, {
        y: 16,
        autoAlpha: 0,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.07,
        clearProps: 'all',
        overwrite: 'auto',
      })
    }, root)
    return () => ctx.revert()
  }, [screen])
  const navActiveId = !configure ? 'summary' : interior ? 'interior' : 'exterior'
  const onNavSelect = (id: string) => {
    if (id === 'summary') {
      openSummary()
      return
    }
    closeSummary()
    if (id === 'interior') enterInterior()
    else exitInterior()
  }

  return (
    <div className="flex min-h-[100dvh] w-full p-2 sm:p-3">
      <main
        ref={mainRef}
        className="relative flex w-full flex-col rounded-app bg-surface px-4 py-5 shadow-card sm:px-8 sm:py-6 lg:px-12"
      >
        {/* ---- Header : logo + pill nav -------------------------------- */}
        <header className="relative flex items-center justify-between">
          <a
            href="/"
            aria-label="Aéro — accueil"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                       bg-ink font-display text-sm font-semibold tracking-tight text-card"
          >
            BO
          </a>
          <PillNav
            items={NAV_ITEMS}
            activeId={navActiveId}
            onSelect={onNavSelect}
            className="absolute left-1/2 hidden -translate-x-1/2 md:flex"
          />
          {/* right spacer keeps the nav optically centered */}
          <span className="h-11 w-11 shrink-0" aria-hidden="true" />
        </header>

        {/* mobile nav — scrollable row under the header */}
        <div className="-mx-4 mt-3 overflow-x-auto px-4 md:hidden">
          <PillNav items={NAV_ITEMS} activeId={navActiveId} onSelect={onNavSelect} className="w-max" />
        </div>

        {/* ---- Summary / Confirmation screens --------------------------- */}
        {screen === 'summary' && (
          <section aria-label="Récapitulatif de réservation" className="mt-2">
            <div data-reveal className="flex items-center gap-3 py-5 sm:py-6">
              <FloatingButton
                size="sm"
                icon="chevron-left"
                label="Revenir au configurateur"
                onClick={closeSummary}
              />
              <h1 className="font-display text-4xl font-semibold sm:text-5xl">Summary</h1>
            </div>
            <div data-reveal>
              <SummaryPanel />
            </div>
          </section>
        )}
        {screen === 'confirmed' && (
          <section aria-label="Confirmation de réservation" className="mt-2">
            <Confirmation />
          </section>
        )}

        {/* ---- Stage : title, floating tools, 3D (kept mounted) --------- */}
        <section
          aria-label="Visualisation de l'appareil"
          className="relative flex flex-1 flex-col"
          hidden={!configure}
        >
          <div data-reveal className="flex items-center gap-3 pt-5 sm:pt-7">
            <FloatingButton
              size="sm"
              icon="chevron-left"
              label={interior ? "Revenir à l'extérieur" : 'Étape précédente'}
              onClick={interior ? exitInterior : undefined}
            />
            <h1 className="font-display text-4xl font-semibold sm:text-5xl">
              {interior ? 'Interior' : 'Exterior'}
            </h1>
          </div>

          <div data-reveal className="relative mt-1 flex flex-1 flex-col justify-center">
            {/* left tool column */}
            <div className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 sm:flex">
              <FloatingButton icon="video" label="Vue caméra" />
              {!interior && (
                <FloatingButton
                  icon="cube"
                  label={viewDimension === '2d' ? 'Passer en 3D' : 'Revenir en 2D'}
                  active={viewDimension === '3d'}
                  onClick={toggleDimension}
                />
              )}
            </div>

            {/* circular toolbar */}
            <div className="absolute left-1/2 top-1 z-10 flex -translate-x-1/2 items-center gap-2.5">
              <FloatingButton size="sm" icon="zoom-in" label="Zoom" />
              <FloatingButton size="sm" icon="expand" label="Plein cadre" />
              <FloatingButton size="sm" icon="seat" label="Voir les sièges" />
              <FloatingButton size="sm" icon="palette" label="Matériaux et couleurs" />
              <FloatingButton size="sm" icon="sliders" label="Réglages de la vue" />
            </div>

            {/* stage: flat 2D by default (no WebGL), 3D on demand + interior */}
            <div className="mx-auto w-full pb-1 pt-8 sm:px-4">
              {flat2d ? (
                <Cabin2DView />
              ) : (
                <Suspense fallback={<StageSkeleton />}>
                  <Stage />
                </Suspense>
              )}
            </div>
            {!flat2d && (
              <p
                className="pointer-events-none absolute bottom-1 right-1 text-[10px] uppercase
                           tracking-[0.22em] text-ink-muted"
              >
                {interior
                  ? 'Cliquer un siège pour le sélectionner'
                  : 'Glisser pour orbiter · molette pour zoomer'}
              </p>
            )}
          </div>

          {/* sections row */}
          <div data-reveal className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-ink-soft">Sections</span>
              <SectionTabs
                count={aircraft.zones.length}
                activeIndex={sectionIndex}
                onSelect={setSection}
              />
              <FloatingButton
                size="sm"
                icon="arrow-right"
                label="Section suivante"
                onClick={nextSection}
              />
            </div>

            {/* aircraft pager */}
            <div className="flex items-center gap-1 rounded-pill bg-card px-1.5 py-1 shadow-sm">
              <button
                type="button"
                aria-label="Avion précédent"
                onClick={prevAircraft}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full
                           text-ink-muted transition-colors duration-200 hover:text-ink
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <Icon name="chevron-left" size={14} />
              </button>
              <button
                type="button"
                aria-label="Avion suivant"
                onClick={nextAircraft}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full
                           text-ink-muted transition-colors duration-200 hover:text-ink
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <Icon name="chevron-right" size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ---- Bottom cards : aircraft + floorplan ---------------------- */}
        <section
          data-reveal
          className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"
          hidden={!configure}
        >
          <AircraftCard aircraft={aircraft} />
          <Floorplan aircraft={aircraft} />
        </section>
      </main>
    </div>
  )
}
