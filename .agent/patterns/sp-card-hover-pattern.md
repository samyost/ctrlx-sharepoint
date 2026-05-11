---
pattern: sp-card-hover-pattern
description: Three-layer SP card structure for gallery/tile views with hover-reveal actions using sp-card-showOnHoverParent and sp-card-showOnHoverChild classes.
tags: [sharepoint, formatting, gallery, tile, hover, css-classes]
tested: 2026-04-10
---

> **Consolidated** — this pattern has been absorbed into [`.agent/knowledge/sp-elements.md`](../knowledge/sp-elements.md). This file is kept for reference.

# SP Card Hover Pattern

The standard structure for interactive gallery/tile cards in SharePoint. Uses native SP CSS classes to implement the three-layer card shell and hover-reveal behavior — no custom CSS required.

## The Three Layers

```
sp-card-container sp-card-showOnHoverParent   ← Layer 1: outer shell, hover context
  ├─ sp-card-defaultClickButton               ← Layer 2: invisible click blocker (defaultClick action)
  └─ visible card div                         ← Layer 3: the actual rendered card
       └─ card content
```

**Layer 1 — Hover context container**: Sets up the hover detection zone. `sp-card-showOnHoverParent` activates any `sp-card-showOnHoverChild` elements inside when the user hovers the card.

**Layer 2 — Click blocker**: An invisible `div` with `customRowAction: { action: 'defaultClick' }`. This intercepts clicks on the card surface and triggers the item's default navigation (open item panel). Without it, clicks on the inner card content go nowhere.

**Layer 3 — Visible card**: The actual visible card with border, background, and content. Uses `sp-card-borderHighlight` to show a left accent border on hover (SP applies this automatically).

## Minimal JSON Pattern

```json
{
  "elmType": "div",
  "attributes": { "class": "sp-card-container sp-card-showOnHoverParent" },
  "children": [
    {
      "elmType": "div",
      "attributes": { "class": "sp-card-defaultClickButton" },
      "customRowAction": { "action": "defaultClick" }
    },
    {
      "elmType": "div",
      "attributes": {
        "class": "ms-bgColor-white sp-css-borderColor-neutralLight sp-card-borderHighlight sp-card-subContainer sp-card-subContainer-borderRadius"
      },
      "style": { "height": "100%", "overflow": "hidden" },
      "children": [
        {
          "elmType": "div",
          "txtContent": "Card content here"
        }
      ]
    }
  ]
}
```

## Hover-Reveal Child Elements

`sp-card-showOnHoverChild` hides an element by default and makes it visible when the `sp-card-showOnHoverParent` ancestor is hovered. Use this for action bars, overflow menus, or secondary controls.

```json
{
  "elmType": "div",
  "attributes": { "class": "sp-card-showOnHoverChild" },
  "style": { "display": "flex", "gap": "4px" },
  "children": [
    { "elmType": "span", "attributes": { "iconName": "Edit" } },
    { "elmType": "span", "attributes": { "iconName": "Share" } }
  ]
}
```

The "always show a subtle indicator, expand on hover" pattern — used in Q4 of the quadrant card:

```json
// Always visible: subtle "..." icon
{ "elmType": "span", "attributes": { "iconName": "More" }, "style": { "opacity": "0.5" } },

// Hover only: full action buttons
{ "elmType": "div", "attributes": { "class": "sp-card-showOnHoverChild" }, "children": [ ... ] }
```

## Class Reference

| Class | Purpose |
|-------|---------|
| `sp-card-container` | Outer shell; required for SP card layout engine |
| `sp-card-showOnHoverParent` | Activates hover detection for all child `showOnHoverChild` elements |
| `sp-card-showOnHoverChild` | Hidden by default; visible when parent is hovered |
| `sp-card-defaultClickButton` | Invisible click-capture div; triggers item default click |
| `sp-card-borderHighlight` | Adds a left accent border on hover (SP-managed) |
| `sp-card-subContainer` | Inner card container; pairs with borderHighlight |
| `sp-card-subContainer-borderRadius` | Rounds the inner card corners |
| `sp-card-content` | Used on `columnFormatterReference` wrappers inside tile cards |
| `sp-card-formatterRef` | Pairs with `sp-card-content` for embedded column formatters in tiles |

## This Pattern vs customCardProps

| | Hover Pattern | customCardProps |
|---|---|---|
| **Trigger** | Hover anywhere on card | Click or hover a specific element |
| **Content** | Inline reveal (within card bounds) | Flyout callout (outside card bounds) |
| **Nesting** | No limit | Tested to 3 levels (see nested-customCardProps) |
| **Use for** | Action bars, secondary info | Detail panels, cascading cards |

## Implementation Reference

`lib/quadrant.ts:buildQuadrantTile()` — full three-layer implementation with Q4 hover-reveal action zone.
