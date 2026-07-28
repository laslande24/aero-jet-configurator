# Aéro — Plan d'implémentation

> **Pour les workers agentiques :** chaque phase se déroule task-par-task. Les étapes utilisent
> la syntaxe checkbox (`- [ ]`). Au démarrage d'une phase, l'éclater en steps bite-sized (test →
> échec → implémentation minimale → passe → commit) avant d'écrire du code. Chaque phase produit
> un logiciel qui tourne et se teste seul.

**Goal :** Construire un site de réservation de jet privé en 3D interactive — switch d'avion,
visite cabine, choix de siège, réservation — premium, minimaliste, fluide, fidèle à la maquette Figma.

**Architecture :** Vite + React 19 + TS + Tailwind v4 en design **token-first** (`src/styles/theme.css`).
La 3D (React Three Fiber) est isolée dans `src/scene/` et pilotée par des stores **Zustand** ;
l'UI 2D consomme le même état. Les animations (Phase 5) passent par **GSAP**. Structure feature-first
sous `src/features/`.

**Tech Stack :** Vite 8 · React 19 · TypeScript 6 · Tailwind v4 · oxlint · (à venir) R3F + drei · Zustand · GSAP · Vitest + Playwright.

---

## État — Phase 0 : Cadrage ✅ (terminé)

- [x] Adopter le scaffold `aero-3d` (Vite + React 19 + TS 6 + oxlint).
- [x] Installer Tailwind v4 (`@tailwindcss/vite`), câbler le plugin + alias `@ → src`, port 5180.
- [x] Extraire la maquette → figer les design tokens dans `src/styles/theme.css` (`@theme`).
- [x] Base CSS (`index.css`) : import tailwind + tokens, body/headings, fond radial subtil.
- [x] Polices Fontshare (General Sans + Satoshi) dans `index.html`, `lang="fr"`.
- [x] `App.tsx` = état vide on-brand (valide polices/couleurs/rayons/ombres).
- [x] Arborescence des dossiers créée (`components`, `features`, `scene`, `store`, `data`, `hooks`, `lib`).
- [x] Documentation projet (vision, stack, tokens, conventions, roadmap) + ce `PLAN.md`.
- [x] `npm run dev` tourne sur :5180, sans erreur.

**Convention transverse (toutes phases) :** aucune valeur brute hex/px dans les composants —
uniquement des utilitaires adossés aux tokens ; token manquant → l'ajouter à `theme.css`.

---

## Phase 1 — UI statique ✅ (terminé)

**But :** reproduire la maquette en React statique (données mockées, aucune 3D). C'est le squelette
visuel dans lequel les phases suivantes viendront brancher la 3D et l'interactivité.

**Dépendances à installer :** aucune (Tailwind suffit). Optionnel : `clsx` pour `cn()`.

**Fichiers :**
- Créer `src/lib/cn.ts` — helper de merge de classNames.
- Créer `src/data/aircraft.ts` — catalogue mocké : `{ id, name, model, passengers, image, sections }[]`.
- Créer `src/components/Pill.tsx`, `PillNav.tsx` — nav en pills (Aircraft / Interior / Exterior / Summary), pill active noire.
- Créer `src/components/FloatingButton.tsx` — bouton circulaire blanc flottant (`shadow-float`).
- Créer `src/components/Card.tsx` — carte blanche `rounded-card`.
- Créer `src/components/AircraftCard.tsx` — carte bleu acier (`bg-steel`) : passagers, modèle, vignette.
- Créer `src/components/Floorplan.tsx` — plan de cabine schématique (blocs gris `card-muted`).
- Créer `src/components/SectionTabs.tsx` — sélecteur de sections 1/2/3/4 + flèches.
- Créer `src/features/configurator/ConfiguratorScreen.tsx` — assemble le cadre app + nav + zone visuelle (placeholder image du jet) + AircraftCard + Floorplan.
- Modifier `src/App.tsx` — rendre `<ConfiguratorScreen />` à la place de l'état vide.

**Tâches :**
- [x] `cn()` (helper minimal, sans dépendance).
- [x] Catalogue `aircraft.ts` (Bombardier Global 6000 + Gulfstream G650, zones de cabine).
- [x] Primitives `PillNav` fidèles (pill active noire, inactives blanches, icône + label).
- [x] `FloatingButton` (tailles sm/md, icônes ligne 1.5 maison dans `Icon.tsx`).
- [x] `AircraftCard` bleu acier (13 passagers, nom, silhouette mini-jet, bouton flèche circulaire).
- [x] `Floorplan` : Entertainment Suite / Main Lounge / Private Stateroom / En-Suite en blocs + hachures aux extrémités, scroll horizontal < 560px.
- [x] `SectionTabs` (1 actif noir, 2-4 gris, glyphe avion, flèche →) + pager ‹ ›.
- [x] `ConfiguratorScreen` : layout complet fidèle — `JetSilhouette` SVG stylisé en placeholder du canvas 3D.
- [x] Vérifié au preview (:5180) : structure, tokens, contraste AA (`ink-muted` assombri), pas d'overflow mobile.
- [x] Bonus tiré de la Phase 6 : **polices self-hostées** (`public/fonts/*.woff2` + `src/styles/fonts.css`), Fontshare retiré de `index.html`.

**Acceptation :** l'écran ressemble à la maquette (au placeholder 3D près), 100 % tokens, aucune interactivité requise. ✅ **Terminé.**

---

## Phase 2 — 3D ✅ (terminé) (switch d'avion)

**But :** remplacer l'image placeholder par une vraie scène 3D et permettre de **switcher** entre modèles.

**Dépendances :** `npm i three @react-three/fiber @react-three/drei zustand` (+ `@types/three`).

**Fichiers :**
- Créer `src/store/useConfiguratorStore.ts` — Zustand : `selectedAircraftId`, `setAircraft`, `view` (exterior/interior).
- Créer `src/scene/Stage.tsx` — `<Canvas>` unique, éclairage studio doux, ombre de contact, environnement.
- Créer `src/scene/AircraftModel.tsx` — charge le `.glb` de l'avion sélectionné (lazy + Suspense).
- Créer `src/scene/CameraRig.tsx` — position/target de caméra doux (lerp) selon l'état.
- Créer `src/data/aircraft.ts` (maj) — ajouter `modelUrl` par avion.
- Ajouter `public/models/*.glb` — placeholders (primitives ou modèles libres) si pas d'asset final.
- Modifier `ConfiguratorScreen` — brancher `AircraftCard`/nav sur le store, monter `<Stage />`.

**Tâches :**
- [ ] Store Zustand + sélection d'avion (test du reducer/actions).
- [ ] `<Stage>` monté une seule fois, fond transparent, ombre de contact.
- [ ] `AircraftModel` réagit à `selectedAircraftId` (crossfade/scale à l'échange).
- [ ] Switch depuis l'UI met à jour la scène ; caméra se recale en douceur.
- [ ] Perf : lazy-load des `.glb`, `useGLTF.preload` du prochain modèle probable.
- [ ] Commit `feat(3d): interactive aircraft stage + model switch`.

**Acceptation :** on change d'avion depuis l'UI et le modèle 3D se met à jour, caméra fluide, 60 fps desktop.

---

## Phase 3 — Intérieur & sièges ✅ (terminé)

**But :** visite 3D de l'intérieur + plan de sièges interactif, sélection d'une place.

**Fichiers :**
- Créer `src/data/cabin.ts` — plan de cabine par avion : sections, sièges `{ id, section, x, y, status }`.
- Créer `src/scene/CabinInterior.tsx` — vue 3D intérieure (caméra dans la cabine, transition depuis l'extérieur).
- Créer `src/features/seatmap/SeatMap.tsx` — plan 2D interactif (grille de sièges).
- Créer `src/features/seatmap/Seat.tsx` — états `free`/`hover`/`active`/`taken` via tokens `seat-*`.
- Modifier `src/store/useConfiguratorStore.ts` — `selectedSeatId`, `selectSeat`, `view = 'interior'`.

**Tâches :**
- [ ] Données `cabin.ts` (sièges + statuts) pour ≥ 1 avion.
- [ ] `Seat` : rendu par état (tokens), a11y (bouton, aria-pressed, focus visible).
- [ ] `SeatMap` : sélection d'un siège libre → `active` ; occupé non cliquable.
- [ ] Transition extérieur → intérieur (bascule `view`, caméra 3D vers la cabine).
- [ ] Synchro plan 2D ↔ surbrillance 3D du siège (nice-to-have).
- [ ] Commit `feat(cabin): 3D interior + interactive seat selection`.

**Acceptation :** on entre dans la cabine, on choisit un siège libre, l'état reflète la sélection.

---

## Phase 4 — Réservation ✅ (terminé)

**But :** transformer la sélection (avion + siège) en un flux de réservation complet.

**Fichiers :**
- Créer `src/store/useBookingStore.ts` — machine à états : `passengers → seat → summary → confirmed`.
- Créer `src/features/booking/BookingFlow.tsx` — orchestre les étapes.
- Créer `src/features/booking/steps/PassengersStep.tsx`, `SummaryStep.tsx`, `ConfirmationStep.tsx`.
- Créer `src/data/flights.ts` — vols/tarifs mockés.
- Créer `src/components/Button.tsx` — CTA pill avec icône imbriquée (button-in-button), variants primary/secondary.

**Tâches :**
- [ ] Store de réservation + transitions (tests des gardes d'étapes).
- [ ] Étape passagers (nb + infos minimales), validation.
- [ ] Récapitulatif : avion, siège, vol, prix ; édition possible (retour aux étapes).
- [ ] Confirmation (billet mocké, référence générée).
- [ ] Empêcher de confirmer sans siège/passager.
- [ ] Commit `feat(booking): passenger → seat → summary → confirmation flow`.

**Acceptation :** un parcours complet de bout en bout produit une confirmation cohérente.

---

## Phase 5 — Animations ✅ (terminé)

**But :** couche de mouvement premium (GSAP), sans casser la perf.

**Dépendances :** `npm i gsap @gsap/react`.

**Fichiers :**
- Créer `src/lib/gsap.ts` — enregistrement des plugins (useGSAP, ScrollTrigger).
- Créer `src/hooks/useSceneTransition.ts` — orchestration caméra/opacité entre vues.
- Modifier composants clés — reveals à l'entrée, transitions d'étapes, arrivée cinématique de l'avion.

**Tâches :**
- [ ] Setup GSAP + `useGSAP` (contexte propre, cleanup).
- [ ] Arrivée cinématique de l'avion + transitions extérieur↔intérieur.
- [ ] Transitions entre étapes de réservation (mask/slide/fade, `--ease-premium`).
- [ ] Micro-interactions : magnetic buttons, hamburger morph, hover pills.
- [ ] Reveals au scroll via ScrollTrigger / IntersectionObserver (jamais de listener scroll brut).
- [ ] Garde-fous perf : animer `transform`/`opacity` seulement ; `backdrop-blur` réservé au fixe/sticky.
- [ ] Commit `feat(motion): gsap scene + step transitions and micro-interactions`.

**Acceptation :** transitions fluides 60 fps, aucun jank au switch d'avion ou changement d'étape.

---

## Phase 6 — Responsive / perf / tests ✅ (terminé)

**But :** production-ready — mobile, budget perf, couverture de tests.

**Dépendances :** `npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test`.
Self-host des polices (retirer le lien Fontshare, ajouter woff2 locaux + `@font-face`).

**Fichiers :**
- Créer `vitest.config.ts`, `src/test/setup.ts`.
- Créer `tests/e2e/*.spec.ts` (Playwright) — parcours réservation.
- Créer `src/**/**.test.tsx` — stores, primitives, seatmap, booking guards.
- Modifier layouts — repli mobile (`w-full`, `px-4`, `min-h-[100dvh]`), 3D allégée sur mobile.
- Modifier `index.html` — polices self-host ; `vite.config.ts` — build/analyse.

**Tâches :**
- [ ] Repli responsive de tous les écrans (< 768px) sans casser la maquette desktop.
- [ ] Perf : lazy 3D, compression Draco/meshopt des `.glb`, préchargement ciblé, budget < X ms LCP.
- [ ] Self-host polices + `font-display: swap`.
- [ ] Vitest : unités (stores, cn, seat states, booking guards).
- [ ] Playwright : e2e du parcours réservation complet.
- [ ] Ajouter scripts `test`, `test:e2e` au `package.json` ; documenter dans le README.
- [ ] Commit `chore: responsive, perf budget, self-hosted fonts, vitest + playwright`.

**Acceptation :** mobile propre, budget perf tenu, suites de tests vertes.

---

## Self-review (checklist du plan)

- **Couverture :** chaque partie du concept (switch avion, visite cabine, choix siège, réservation)
  est portée par une phase → Phases 2, 3, 3, 4. ✅
- **Tokens-first** rappelé en tête et dans chaque phase UI. ✅
- **Dépendances** installées phase par phase (R3F/Zustand P2, GSAP P5, tests P6) — cohérent avec
  « installer seulement le nécessaire ». ✅
- **Cohérence des noms :** `useConfiguratorStore` (avion/siège/vue) et `useBookingStore` (étapes)
  réutilisés tels quels entre P2–P4. ✅

> À l'exécution d'une phase : reprendre ses tâches, les éclater en steps TDD bite-sized, committer souvent.
