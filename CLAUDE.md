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

- four interactive elements sit under the 44px mobile touch target bar, three footer links and the boot skip button
- `prefers-reduced-motion` gating is written but has never been observed running, the browser tooling could not emulate it
- the ambient particle animation has never been seen animating, the preview pane's animation frames were stalled

## Conventions

Version badge in the page footer, bumped in the same edit as any change, matching the commit version. British English in all visible copy, no em-dashes and no semicolons. Build history sits in the Depth log section, keep it truthful.
