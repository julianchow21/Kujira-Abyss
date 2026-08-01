# CLAUDE.md, Abyss

Abyss is the brand site for Kujira, the parent brand. Static, vanilla JS, no framework and no bundler, matching how the rest of the Kujira apps are built.

## What it is

A descent through ocean depth zones. Four ventures sit at four depths: Collectibles at the sunlight zone, Portfolio at the twilight zone, Trading at the midnight zone, Journal at the abyss. Each venture section carries a working interactive miniature rather than a screenshot.

## Structure

- `index.html`, the whole site, single page with hash anchors
- `404.html`, standalone error page
- `assets/style.css`, design tokens and all sections
- `assets/data.js`, seeded Mulberry32 PRNG plus the synthetic datasets and indicator maths
- `assets/app.js`, boot sequence, nav, scroll depth tracking, hero crossfade, particle field
- `assets/collectibles.js`, `portfolio.js`, `trading.js`, `journal.js`, one file per miniature

## Hard constraints

- must open from `file://` by double-clicking `index.html`, no build step and no server
- therefore no ES modules, no `fetch` of local files, all data inline as JS literals
- all paths relative, never root-absolute
- no package manifests, no bundler, no dependencies

## Data honesty

Every venture fact is real (stacks, versions, what each app does). Every figure inside the miniatures is seeded synthetic data and must stay labelled as such on the page. Never present any of it as Julian's real financial data.

## Invented identity

The name Abyss, the whale-fluke mark, the tagline, the colour and type system and the depth-zone framing were all invented for this site. Kujira has no other brand doc, tagline, logo or single accent colour. Do not treat anything here as pre-existing brand fact, and do not copy it into other projects as though it were.

## Known open items

- the items below were verified on 28/07/2026, 29/07/2026 and 01/08/2026 and are no longer open, kept here as the record

### Verified 28/07/2026

- the ambient particle field animates correctly. It is gated to viewports 900px and wider by `MIN_WIDTH` in `setupParticles`, which is why earlier passes in a narrower preview pane saw a hidden canvas rather than a stalled one. Measured at 1280px: canvas sized 2240x1400 at dpr 1.75, painted pixels 1819 then 1871, and the pixel data changed between samples. At 375px the canvas is correctly `display:none`
- `prefers-reduced-motion` gating works. Verified against a scratchpad copy with `matchMedia` forced to report reduce, the boot overlay dismissed immediately and released the body lock, the hero crossfade lines were set to `display:none` with the final line latched on, the particle canvas stayed hidden with zero painted pixels and no animation loop, and the four stat counters rendered their target values with no count-up. The CSS side (three `@media (prefers-reduced-motion: reduce)` blocks at `assets/style.css:34`, `:197`, `:401`) was read, not exercised, the rig forces the JS media query only

### Verified 29/07/2026

- independent headless pass (playwright-core over `file://`, desktop, reduced-motion and mobile contexts, 38 assertions): boot auto-dismisses, hero crossfade reveals, stat counters land, depth readout tracks scroll, all four miniatures interactive (filters, slab panel, sliders, FIRE maths, indicator toggles, block editing), zero console errors, no horizontal overflow at 1440px or 390px, footer links, boot skip, nav toggle and nav links all at 44px. Confirms the 28/07 particle and reduced-motion findings from real input
- v1.2 fix: the mobile nav drawer covered its own toggle, the fixed-positioned drawer painted above the static button, so an open drawer could not be closed via the hamburger (proven from the true input path). Fixed by stacking the toggle at `position:relative; z-index:1` inside the header's stacking context, re-verified by real click with the drawer open, `aria-expanded` flips correctly

### Verified 01/08/2026

- v1.3 fix: the two in-content venture links ("Open Collectibles", "Open Journal") measured 39px high on desktop, under the 44px bar. Fixed by adding `min-height:44px; box-sizing:border-box` to `.pill-link` in `assets/style.css`. Re-measured via browser preview at 1280px: both pills now 44px. At 375px both remain 47.2px (mobile media query already passed, unaffected). No horizontal overflow at either width, zero console errors

## Conventions

Version badge in the page footer, bumped in the same edit as any change, matching the commit version. British English in all visible copy, no em-dashes and no semicolons. Build history sits in the Depth log section, keep it truthful.
