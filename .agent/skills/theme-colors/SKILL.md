---
name: Theme Colors
description: Fluent UI modern theme color tokens for the Teamwork Framework SharePoint site, with CSS class usage rules.
---

> **Consolidated** — key content from this skill has been absorbed into [`.agent/knowledge/sp-styling.md`](../knowledge/sp-styling.md). This file is kept as the full reference.

# SharePoint Fluent UI Modern Theme Colors

## Usage Rule

**Always prioritize CSS classes** over hardcoded hex values:
- `sp-css-backgroundColor-[tokenName]`
- `sp-css-color-[tokenName]`
- `sp-css-borderColor-[tokenName]`

These classes ensure native theme reactivity. Only use hex codes when strictly required (SVG backgrounds, Power Automate, external integrations).

Also available via `attributes.class`:
- `ms-borderColor-themePrimary`
- `ms-bgColor-neutralLighter`
- `ms-fontColor-themePrimary`

---

## Primary Theme Colors

| Token | Hex |
|---|---|
| `-themeDarker` | `#d0e2f3` |
| `-themeDark` | `#c0d4e5` |
| `-themeDarkAlt` | `#90a5c2` |
| **`-themePrimary`** | **`#536a8b`** |
| `-themeSecondary` | `#617697` |
| `-themeTertiary` | `#526684` |
| `-themeLight` | `#40546e` |
| `-themeLighter` | `#354760` |
| `-themeLighterAlt` | `#081628` |

## Neutral Colors

| Token | Hex | Role |
|---|---|---|
| `-white` | `#1a1d21` | Base background |
| `-black` | `#ffffff` | Base text |
| `-neutralLighter` | `#0e1114` | |
| `-neutralLight` | `#080b0d` | |
| `-neutralQuaternaryAlt` | `#2a2e31` | |
| `-neutralQuaternary` | `#5f656a` | |
| `-neutralTertiaryAlt` | `#737a7f` | |
| `-neutralTertiary` | `#686f73` | |
| `-neutralSecondary` | `#d5d5d5` | |
| `-neutralPrimaryAlt` | `#d1d1d1` | |
| `-neutralPrimary` | `#ffffff` | |
| `-neutralDark` | `#ffffff` | |

> **Note:** Neutral names are inverted for Dark Mode — "white" refers to the darkest background, "black" refers to the brightest text.
