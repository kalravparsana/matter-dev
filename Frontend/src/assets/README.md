# Mattar — Design Contract

**Design genome (divergence ledger):** type personality neutral sans (Inter) · brand-hue family emerald mint + signal amber · neutral temp cool charcoal-blue · layout archetype command-center top-nav + rail · density/shape compact + soft rounded corners + bordered dividers · signature category domain-shaped data viz (radar). Diverged from defaults/last build on axes: brand-hue, layout, density/shape, signature, neutral temp.

**Positioning:** The daily signal layer for operators who drown in Slack threads and inbox noise — Mattar surfaces what matters today and routes it through one agent to the right action.

**Personality:** precise / modern / expert / cool — technical confidence without enterprise bloat.

**Persona:** Priya, ops lead at a 40-person startup — success is opening Mattar at 8am and knowing exactly which 7 signals need action before standup.

**IA map:** derived from 5 domain workflows; account model team/workspace with roles (owner, operator, viewer); modern patterns chosen: ⌘K command palette, connection health status pills, inline agent prompt editor.

| Nav | Route | Surface |
|-----|-------|---------|
| Auth | `/login` | Standalone Google sign-in — outside app shell |
| Today | `/today` | Radar command center — signature moment |
| Integrations | `/integrations` | Platform connections (Slack, Gmail, Granola) |
| Inputs | `/inputs` | Input triggers per platform (new email, mention, meeting) |
| Matter | `/matter` | Agent prompt editor + behavior config |
| Outputs | `/outputs` | Output agents per platform (email sent, Slack message) |

Settings layered: profile, workspace members, billing, notification rules (modal drawer from account menu).

**Surface coverage:**
- Primary work surface: Today radar with live signal flow
- Detail view: integration detail drawer, output run detail
- Create/edit: connect integration wizard, add output agent
- Search + filter: inputs/outputs lists with status filter
- Empty states: no integrations connected, no outputs configured
- Reporting: insight numbers on Today (processed, routed, pending)
- Onboarding: seeded sample workspace with 3 inputs, 2 outputs, 7 active signals

**Type:** Inter (UI, headings, and metrics); system monospace for code/prompt surfaces only; scale: hero 48px / page title 28px / section 18px / body 14px / caption 12px; rules: `tabular-nums` on metrics, `-0.01em` tracking on page titles where applied.

**Color:** brand `#00B48A` (emerald mint — signal clarity); accent `#E8A838` (amber — priority/hot signals); neutrals cool charcoal-blue tinted; tokens in `index.css`; **light theme only** — cool off-white surfaces with charcoal-blue text.

**Layout:** spacing rhythm 4/8px base — section 24px, card 16px, stack gap 8px; corner radius 16px controls / 20px cards / 24px panels / 28px modals; marketing N/A (app-only); attention budget enforced — radar is focal on Today.

**Voice:** surgical, confident, operator-native; e.g. "Seven signals need you before noon" / "No inputs yet — connect Slack and your radar stays dark."

**Signature moment:** The Mattar Radar on `/today` — concentric rings with "What Matters" center, input signals flowing in from left column, processed insights in center metrics, output actions departing right column.

---

## Motif library

Domain: signal routing, attention filtering, automation pipelines.

| Motif | Description | Register use |
|-------|-------------|--------------|
| Signal pulse | Concentric arcs radiating outward | Radar rings, loading, priority |
| Thread strand | Curved line with nodes | Data flow, connections |
| Lens aperture | Hexagonal focus ring | Matter agent, filtering |
| Relay node | Small circle with directional arrow | Input/output endpoints |
| Priority beacon | Amber dot with soft glow | Hot/urgent signals |

**Visual register:** expert / precise / technical — monoline geometric construction, diagrammatic clarity, minimal fills, one amber accent per composition.

**Icon system:** 24×24 grid for nav motifs; integration surfaces use official platform brand marks at 16–20px.

---

## Asset table

| Page | Surface | Class | Asset file | Justification | Motif(s) | Archetype | Size cap |
|------|---------|-------|------------|---------------|----------|-----------|----------|
| Chrome | Header logo | Chrome | `logos/logo-mark.svg` | Brand wayfinding | Signal pulse | Logo | 28px |
| Chrome | Nav icons | Chrome | `icons/nav-*.svg` | Label nav destinations | Various | Icon | 20px |
| Inputs | Empty state | Emotional | `illustrations/empty-inputs.svg` | Explain no connections + point to Integrations | Thread strand, relay node | Illustration | ≤35% card width |
| Integrations | Empty state | Emotional | `illustrations/empty-inputs.svg` | Explain no platform connections | Thread strand, relay node | Illustration | ≤35% card width |
| Chrome | Nav integrations | Chrome | `icons/nav-integrations.svg` | Label Integrations nav destination | Relay node | Icon | 20px |
| Outputs | Empty state | Emotional | `illustrations/empty-outputs.svg` | Explain no outputs + point to Add agent | Relay node, signal pulse | Illustration | ≤35% card width |
| Matter | Hero accent | Emotional | `illustrations/matter-lens.svg` | Orient user to agent configuration | Lens aperture | Illustration | ≤40% header width |
| Today | Task surface | Task | — (radar is live viz) | Data is the design | — | — | — |
| Inputs (with data) | Trigger tables | Task | Status icons only | Data is the content | — | Icon | 16px inline |
| Integrations (with data) | Platform grid | Task | `icons/integration-slack.svg`, `integration-gmail.svg`, `integration-granola.svg` | Official platform brand marks identify connected integrations (Slack hash, Google G, Granola spiral from granola.ai) | — | Logo | 20px |
| Outputs (with data) | List | Task | Status icons only | Data is the content | — | Icon | 16px inline |

**Art briefs:**

*empty-inputs.svg (Medium):* Dormant relay station — transparent crop on light surfaces; midground: three thread strands curling toward empty relay nodes (Slack/Gmail/Granola implied by node shapes, not logos); foreground: one amber beacon unlit (waiting for connection). Light from upper-left. Palette: `#00B48A` base, `#00C997` highlight, `#C8D1DA` borders, `#E8A838` accent (dimmed).

*empty-outputs.svg (Medium):* Open channel with no signal — transparent crop; focal: relay node with arrow pointing outward into empty space; supporting: faint signal pulse rings fading out (nothing to route). Light upper-left. Same teal ramp + amber accent on arrow tip.

*matter-lens.svg (High):* Agent lens focusing scattered threads — light mint wash background (`#E5FAF4` → `#F4F6F9`); midground: 4-5 thread strands converging; foreground: hexagonal lens aperture with amber priority beacon at center focal point; soft grounded shadow. Light upper-left. 3 depth planes, feGaussianBlur on ground shadow.

---

## Geometry

Stroke: 1.75px icons · Grid: 24×24 · Corners: 16px UI, 20px cards, 24px panels, 28px modals · Header lockup gap: 10px · Illustration clearance: 24px from text.

## Detail tier & finish

- High: matter-lens.svg — 3 planes, upper-left light, teal ramps, grain texture
- Medium: empty-inputs.svg, empty-outputs.svg — volume on focal object, grounded shadow
- Icons: crisp monoline system
