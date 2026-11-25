# Harmek AI — Design System (DESIGN.md)

## Visual World: Warm Ink & Burnished Copper
A calm, tactile, high-craft dark palette inspired by hospitality, apothecary retail, and editorial print — completely distinct from generic purple/neon AI templates.

### Color Palette
- **Canvas (Warm Ink):** `#11100E`
- **Surface (Warm Stone):** `#181613`
- **Surface Elevated:** `#211E1A`
- **Surface Subtle / Inset:** `#141210`
- **Hairline Border:** `#2B2722`
- **Border Strong:** `#3D3730`
- **Primary Text (Warm Parchment):** `#F5F2EB`
- **Secondary Text (Warm Stone):** `#B5AEA2`
- **Muted Text:** `#968E82` (WCAG AA ≥ 5.5:1 on Warm Stone)
- **Primary Accent (Burnished Copper):** `#D97745` (hover `#E28758`, subtle tint `rgba(217, 119, 69, 0.14)`)
- **Semantic Positive / Grounded (Sage Olive):** `#84A98C` (subtle tint `rgba(132, 169, 140, 0.14)`)
- **Warning (Warm Ochre):** `#D9A05B`
- **Destructive (Muted Terracotta Red):** `#D95B5B`

### Typography
- **Display & Editorial Headings:** `Newsreader` (serif, optical sizing, weights 400–600, tracking `-0.025em`)
- **UI & Body:** `Manrope` (geometric-humanist sans, weights 400–700)
- **Code, Snippets & Tabular Metrics:** `JetBrains Mono` (`tabular-nums`)

### Craft Rules (Impeccable Floor)
- No eyebrow kickers above every section heading; let the heading carry its own weight.
- No identical icon-tile + heading + paragraph card grids as the default page scaffold.
- No nested cards; declare elevation once (hairline border OR soft offset shadow, never both as a ghost card).
- No gradient text, no neon glow halos, no emojis (Lucide SVG icons only).
- Theme browser surfaces: custom text selection (`#D97745` tint), caret color, scrollbars, and copper focus rings.
