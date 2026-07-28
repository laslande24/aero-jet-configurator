"""E2E booking-flow test for aero-3d (server must run on :5180)."""
import re
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5180"
failures = []


def check(name, cond):
    print(("PASS  " if cond else "FAIL  ") + name)
    if not cond:
        failures.append(name)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # reduced_motion: headless software-GL slows GSAP timelines ~15x
    # (lagSmoothing) and hides mid-animation text from inner_text.
    # The flow under test is state, not choreography.
    page = browser.new_page(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
    page.goto(BASE)
    page.wait_for_load_state("networkidle")

    # -- shell ------------------------------------------------------------
    check("title set", "Aéro" in page.title())
    nav = page.locator('nav[aria-label="Étapes du configurateur"]').first
    check("nav pills x4", nav.locator("button").count() == 4)
    # exterior loads as flat 2D by default — no WebGL canvas yet
    check("2D default (no canvas)", page.locator("canvas").count() == 0)

    # -- edge case: summary without seat ----------------------------------
    nav.locator("button", has_text="Summary").click()
    page.wait_for_timeout(600)
    check("empty state shown", page.get_by_text("Aucun siège sélectionné").is_visible())
    page.get_by_role("button", name="Choisir un siège").click()
    page.wait_for_timeout(2500)  # cabin entry timeline
    check("interior entered", page.locator("h1", has_text="Interior").is_visible())
    # entering the cabin mounts the 3D stage
    page.wait_for_selector("canvas", timeout=15000)
    check("3D canvas mounted on cabin entry", page.locator("canvas").count() == 1)

    # -- seat selection ----------------------------------------------------
    ml3 = page.locator('button[aria-label^="Siège ML3"]')
    ml3.click()
    page.wait_for_timeout(300)
    check("ML3 selected", ml3.get_attribute("aria-pressed") == "true")
    ml4 = page.locator('button[aria-label^="Siège ML4"]')
    check("ML4 occupied disabled", ml4.is_disabled())
    check("ML4 labelled occupé", "occupé" in ml4.get_attribute("aria-label"))

    # -- per-aircraft persistence -------------------------------------------
    page.get_by_role("button", name="Avion suivant").click()
    page.wait_for_timeout(1800)
    check("G650 shown", page.get_by_text("Gulfstream").is_visible())
    check("G650 has no CTA", page.get_by_text("Réserver le siège").count() == 0)
    page.get_by_role("button", name="Avion précédent").click()
    page.wait_for_timeout(1800)
    check("ML3 kept after switch", page.get_by_text("Réserver le siège ML3").is_visible())

    # -- booking summary -----------------------------------------------------
    page.get_by_text("Réserver le siège ML3").click()
    page.wait_for_timeout(700)
    check("summary screen", page.locator("h1", has_text="Summary").is_visible())
    check("price total 20 608", "20 608" in page.locator("aside").inner_text().replace(" ", " ").replace(" ", " "))

    # -- validation ----------------------------------------------------------
    page.get_by_role("button", name="Confirmer la réservation").click()
    page.wait_for_timeout(300)
    check("error nom", page.get_by_text("Nom incomplet").is_visible())
    check("error email", page.get_by_text("Adresse e-mail invalide").is_visible())

    # -- happy path ------------------------------------------------------------
    page.get_by_label("Nom complet").fill("Amélie Fontaine")
    page.get_by_label("E-mail").fill("amelie@exemple.com")
    page.get_by_role("button", name="Confirmer la réservation").click()
    page.wait_for_selector('text=Réservation confirmée', timeout=8000)
    check("confirmation shown", page.get_by_text("Réservation confirmée").count() == 1)
    body = page.locator("body").inner_text()
    check("booking ref format", re.search(r"AER-[A-Z2-9]{5}", body) is not None)
    check("email echoed", "amelie@exemple.com" in body)

    # -- reset -------------------------------------------------------------------
    page.get_by_role("button", name="Nouvelle réservation").click()
    page.wait_for_timeout(800)
    check("back to cabin", page.locator("h1", has_text="Interior").is_visible())
    check("ML3 freed", "libre" in page.locator('button[aria-label^="Siège ML3"]').get_attribute("aria-label"))

    browser.close()

print(f"\n{len(failures)} failure(s)")
sys.exit(1 if failures else 0)
