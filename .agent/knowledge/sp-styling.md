---
topic: sp-styling
description: SP formatter styling — CSS class helpers vs hex, Fluent UI theme tokens, dark-mode compliance, and the TwFw color palette.
sources:
  - .agent/skills/theme-colors/SKILL.md
lib-ref: lib/theme.ts
---

# SP Styling

## Rule: CSS Classes Over Hex

**Always prefer CSS class helpers over hardcoded hex values** in SharePoint JSON formatters. CSS classes respond to the site's Fluent UI theme (including dark mode) automatically. Hex values are static and break in light/dark mode transitions.

```json
// WRONG — hardcoded hex, dark-mode blind
"style": { "background-color": "#536a8b" }

// CORRECT — theme-reactive
"attributes": { "class": "sp-css-backgroundColor-themePrimary" }
```

Use hex **only** for status badge colors (`statusBadge()`) where per-status conditional colors are required and no Fluent token exists.

---

## CSS Class Helper Formats

Two naming conventions. Both are valid in `attributes.class`:

### `sp-css-*` (SharePoint native)
```
sp-css-backgroundColor-{token}
sp-css-color-{token}
sp-css-borderColor-{token}
```

### `ms-*` (Fluent UI)
```
ms-bgColor-{token}
ms-fontColor-{token}
ms-borderColor-{token}
```

Hover variants (apply style on hover):
```
ms-bgColor-{token}--hover
```

---

## In the TypeScript Builder

```ts
theme.cssClass('backgroundColor', 'themePrimary')
// → 'sp-css-backgroundColor-themePrimary'

theme.msClass('bgColor', 'themeLight--hover')
// → 'ms-bgColor-themeLight--hover'

theme.msClass('fontColor', 'neutralPrimary')
// → 'ms-fontColor-neutralPrimary'
```

---

## TwFw Theme Color Tokens

### Primary Palette (Dark Mode — lighter = brighter)
| Token | Hex | |
|-------|-----|-|
| `themeDarker` | `#d0e2f3` | Lightest (brightest blue) |
| `themeDark` | `#c0d4e5` | |
| `themeDarkAlt` | `#90a5c2` | |
| `themePrimary` | `#536a8b` | Brand primary |
| `themeSecondary` | `#617697` | |
| `themeTertiary` | `#526684` | |
| `themeLight` | `#40546e` | |
| `themeLighter` | `#354760` | |
| `themeLighterAlt` | `#081628` | Darkest |

### Neutral Palette (Dark Mode — names are inverted)
| Token | Hex | Semantic |
|-------|-----|---------|
| `white` | `#1a1d21` | Background (darkest) |
| `neutralLighter` | `#0e1114` | Surface |
| `neutralLight` | `#080b0d` | Deep surface |
| `neutralQuaternaryAlt` | `#2a2e31` | Border |
| `neutralTertiaryAlt` | `#737a7f` | Muted icon |
| `neutralTertiary` | `#686f73` | Muted text |
| `neutralSecondary` | `#d5d5d5` | Secondary text |
| `neutralPrimary` | `#ffffff` | Primary text |
| `black` | `#ffffff` | Brightest text |

### Status Colors (hex — no Fluent token equivalent)
| Token | Hex |
|-------|-----|
| `statusGreen` | `#107c10` |
| `statusYellow` | `#ffb900` |
| `statusRed` | `#d13438` |
| `statusBlue` | `#0078d4` |
| `statusOrange` | `#ff8c00` |
| `statusGray` | `#737a7f` |

---

## Typography Presets

| Preset | font-size | font-weight |
|--------|-----------|-------------|
| `caption` | 10px | 400 |
| `body` | 12px | 400 |
| `bodyLarge` | 14px | 400 |
| `subtitle` | 14px | 600 |
| `title` | 16px | 600 |
| `headline` | 20px | 700 |

```ts
// Spread into style object
style: { ...theme.typography.caption }
```

## Spacing Scale

| Token | Value |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 24px |
| `xxl` | 32px |

---

## Inline Editor CSS Variables

When an element uses `inlineEditField`, four custom CSS properties control hover/focus ring styling. These are the **only** custom CSS properties the renderer respects — generic `--my-color` won't survive.

| Variable | Purpose |
|---|---|
| `--inline-editor-border-width` | Border width (accepts 4-side TRBL syntax) |
| `--inline-editor-border-style` | Border style (solid, dashed, etc.) |
| `--inline-editor-border-radius` | Corner radius |
| `--inline-editor-border-color` | Border color (accepts 4-side TRBL syntax) |

### Material-Style Underline Pattern

Pass 4-side TRBL values to draw an underline-only editor ring:

```json
{
  "elmType": "div",
  "inlineEditField": "[$Status]",
  "txtContent": "[$Status]",
  "style": {
    "--inline-editor-border-color": "transparent transparent #0078d4 transparent",
    "--inline-editor-border-style": "solid",
    "--inline-editor-border-width": "0 0 2px 0",
    "--inline-editor-border-radius": "0"
  }
}
```

---

## Background & SVG Tips

- **CSS gradients work** inside `background-image`: `"background-image": "linear-gradient(135deg, #0078d4, #5c2d91)"`
- `background-image` URL must pass SharePoint's image domain allow-list. Tenant URLs and `cdn.office.net` always work.
- For SVG `path`/`svg` `elmType`, use `fill` and `stroke` — the `color` property will **not** paint SVGs.
- Solid `background-color` is the fallback when a gradient isn't allowed for the current build.

