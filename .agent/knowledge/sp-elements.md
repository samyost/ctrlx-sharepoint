---
topic: sp-elements
description: SPElement elmType support, button vs div rules, customCardProps, columnFormatterReference constraints, and the SP card hover pattern.
sources:
  - .agent/patterns/nested-customCardProps.md
  - .agent/patterns/sp-card-hover-pattern.md
  - .agent/skills/sharepoint-list-formatting/SKILL.md
lib-ref: lib/components.ts:button, lib/quadrant.ts:buildQuadrantTile
---

# SP Elements

## elmType Support

| elmType | Use | Notes |
|---------|-----|-------|
| `div` | Layout containers, card shells, most UI | Default choice |
| `span` | Inline text, icons (`iconName` attribute) | |
| `a` | External links | Set `href` and `target="_blank"` in `attributes` |
| `img` | Avatars, thumbnails | Use `getUserImage()` for person avatars |
| `button` | **customCardProps triggers only** | See button vs div section below |
| `svg` / `path` | Custom SVG graphics | Rarely used |

---

## button vs div

This is a critical distinction:

### Use `div role="button"` (via the `button()` factory) for:
- Row action buttons (`customRowAction`)
- Buttons that trigger flows, set values, share, etc.
- Any interactive element that does NOT open a `customCardProps` card

### Use `button` elmType for:
- The outermost element that carries a `customCardProps` (opens a flyout card)
- `button` elmType's native click propagation is required — `div` with child spans hijacks click registration and the card never opens

> **In practice:** The `button()` factory in `lib/components.ts` handles both cases. When you pass `customCardProps`, it wraps the `div` button in a relative container with an absolute overlay `div` that carries the card props. You get the correct click behavior without using `button` elmType directly.

```ts
// Row action — uses div internally
button({ text: 'Edit', icon: 'Edit', customRowAction: { action: 'editProps' } })

// Card trigger — overlay div pattern applied automatically
button({ text: 'Details', customCardProps: { openOnEvent: 'click', formatter: cardEl } })
```

If you hand-write a `customCardProps` trigger without using `button()`:
```json
{ "elmType": "button", "txtContent": "Open", "customCardProps": { ... } }
```
Put `txtContent` directly on the `button` — no children.

---

## customCardProps Rules

1. All levels must use `openOnEvent: "click"` — hover is impractical for nested cards
2. `columnFormatterReference` inside a `customCardProps` formatter renders blank — do not use
3. ASCII only for text content — Unicode garbles via CSOM
4. Nesting tested to 3 levels ("card inception")
5. Theme CSS classes work via `attributes.class` inside card formatters
6. `directionalHint` controls flyout direction: `"bottomCenter"`, `"rightCenter"`, `"topCenter"`, etc.

```json
{
  "customCardProps": {
    "openOnEvent": "click",
    "directionalHint": "bottomCenter",
    "isBeakVisible": true,
    "formatter": { ... }
  }
}
```

---

## columnFormatterReference

Embeds another column's formatter inside the current formatter.

```json
{ "elmType": "div", "columnFormatterReference": "[$TaskStateUI]" }
```

**Constraints:**
- The referenced column **must be added to the view** (even if hidden) — blank render if missing from view
- Use `sp-card-formatterRef` class in tile/gallery views: `"class": "sp-card-content sp-card-formatterRef"`
- `columnRef()` in `lib/components.ts` wraps this with correct layout isolation

---

## SP Card Hover Pattern

For gallery/tile views. Three-layer structure using native SP CSS classes.

```
Layer 1: div.sp-card-container.sp-card-showOnHoverParent   ← hover context
  ├── Layer 2: div.sp-card-defaultClickButton               ← invisible click capture
  │     customRowAction: { action: 'defaultClick' }
  └── Layer 3: div.ms-bgColor-white.sp-card-borderHighlight ← visible card
        └── card content
```

### Canonical Card Scaffold

```
sp-card-container                              ← root tile box (sizing + focus ring)
├── sp-card-defaultClickButton                 ← invisible click overlay (captures default action)
└── sp-card-subContainer + sp-card-borderHighlight
    │                                          ← visible card body + hover border treatment
    ├── sp-card-previewColumnContainer         ← top "hero" / image area
    │   └── sp-card-imageContainer
    │       └── sp-card-imagePreviewBackground ← gray placeholder background
    │           ├── <img sp-card-imagePreview>
    │           ├── <svg sp-card-defaultImage>          ← decorative shape (no image)
    │           └── <svg sp-card-defaultImageOverlay>   ← placeholder icon
    │
    ├── sp-card-displayColumnContainer × N     ← one per key/value pair in the body
    │   ├── <p sp-card-label>                  ← the field caption (small, secondary)
    │   └── <p sp-card-content>                ← the field value
    │         + sp-card-multiline              ← line-clamped multi-line value
    │         + sp-card-highlightedContent     ← bolder/larger "headline" content
    │         + sp-card-urlContent             ← hyperlink content
    │
    ├── sp-card-lastTextColumnContainer        ← last text block (different bottom margin)
    │
    └── people block (sp-card-previewColumnContainer)
        ├── sp-card-userContainer              ← one per visible person
        │   └── <img sp-card-userThumbnail>
        ├── sp-card-userOthers                 ← "+N" chip when overflow
        ├── sp-card-userTitle                  ← single-person name beside thumbnail
        └── sp-card-userEmptyText              ← "–" placeholder when no people
```

### Hover-Reveal Children
`sp-card-showOnHoverChild` — hidden by default, visible when parent is hovered.

```json
{ "elmType": "div", "attributes": { "class": "sp-card-showOnHoverChild" }, "children": [...] }
```

### Full `sp-card-*` Class Reference

| Class | Purpose | Where it goes |
|-------|---------|---------------|
| `sp-card-container` | Root card box — fixes tile size, applies focus ring, sets positioning context. | Outermost `div` |
| `sp-card-container-noPadding` | Variant with internal padding stripped — for full-bleed image cards. | Outermost `div` |
| `sp-card-subContainer` | Visible "card surface" — inner padding, rounded corners, content layout. | First child of `sp-card-container` |
| `sp-card-borderHighlight` | Adds 1px neutral border that glows on hover. Combine with `sp-css-borderColor-neutralLight`. | Same element as `sp-card-subContainer` |
| `sp-card-defaultClickButton` | Invisible absolute overlay that captures clicks → routes to `customRowAction`. **Required for whole-card clickable UX.** | Child of container, sibling of subContainer |
| `sp-card-bottomCommandBar` | Reserved zone at bottom for command-bar controls. Sticks to bottom. | Inside `sp-card-subContainer` |
| `sp-card-previewColumnContainer` | Top section for image preview (or people row). | Inside `sp-card-subContainer` |
| `sp-card-imageContainer` | Wrapper around image — handles aspect ratio and overflow. | Inside `sp-card-previewColumnContainer` |
| `sp-card-imagePreview` | The actual `<img>` thumbnail. Encodes `object-fit`, sizing, loading transition. | On the `<img>` itself |
| `sp-card-imagePreviewBackground` | Flat gray "no-image-yet" background. Combine with `ms-bgColor-neutralLight`. | Inside `sp-card-imageContainer` |
| `sp-card-defaultImage` | Decorative SVG placeholder shape when image field is empty. Pair with `ms-bgColor-themeLighter`. | `<svg>` |
| `sp-card-defaultImageOverlay` | "Missing image" icon drawn on top of placeholder. | `<svg>` |
| `sp-card-displayColumnContainer` | One block per `label + content` pair in card body. Encodes vertical rhythm. | Inside `sp-card-subContainer` — repeat per field |
| `sp-card-lastTextColumnContainer` | Same as displayColumnContainer but for last text field — different bottom margin. | Last text block in card |
| `sp-card-label` | Small, neutral-secondary caption above a value. Use `[!Field.DisplayName]` for text. | `<p>` / `<span>` inside displayColumnContainer |
| `sp-card-content` | Actual value text. Sets font, color, line-height. | `<p>` / `<span>` / `<a>` inside displayColumnContainer |
| `sp-card-highlightedContent` | Modifier on `sp-card-content` — bigger, bolder. For primary identifier (usually Title). | Combined with `sp-card-content` |
| `sp-card-multiline` | Modifier on `sp-card-content` — allows wrapping. Pair with `-webkit-line-clamp` to cap lines. | Combined with `sp-card-content` |
| `sp-card-urlContent` | Modifier on `sp-card-content` — hyperlink styling. | Combined with `sp-card-content` on `<a>` |
| `sp-card-boldText` | Inline bold text helper. | `<span>` |
| `sp-card-keyboard` / `sp-card-keyboard-focusable` | Shows SharePoint focus ring when tabbed. **Always add to interactive elements.** | Any focusable element |
| `sp-card-formatterRef` | Container for `columnFormatterReference` output. | Wrapper `div` around the reference |
| `sp-card-showOnHoverParent` | Activates hover detection for children. | Parent container |
| `sp-card-showOnHoverChild` | Hidden by default, visible when parent is hovered. | Child elements |
| `sp-card-starRating` | One filled star in a rating block. | `<span>` per star (use `forEach`) |
| `sp-card-emptyFillStar` | Modifier — renders star as empty/outline. | Combined with `sp-card-starRating` |
| `sp-card-halfFillStar` | Modifier — renders star as half-filled. | Combined with `sp-card-starRating` |
| `sp-card-ratingCount` | The "(12)" count text beside stars. | `<span>` |
| `sp-card-userContainer` | Wrapper around one person's thumbnail — circular crop + spacing. | `<a>` or `<div>` per person (use `forEach`) |
| `sp-card-userThumbnail` | Person `<img>` — round, sized, hover state. | `<img>` |
| `sp-card-userTitle` | Person's name beside thumbnail (single person). | `<div>` |
| `sp-card-userOthers` | "+3" overflow chip when more people than fit. | `<div>` |
| `sp-card-userEmptyText` | "–" placeholder when multi-person field is empty. | `<p>` |
| `sp-card-userCustomCard` | Modifier on `sp-card-userContainer` inside overflow callout. | Inside `customCardProps.formatter` |
| `sp-card-personCallout` | Container for overflow people list inside `customCardProps` callout. | Root of callout formatter |

### Gotchas

- **Use `attributes.class`, not `className`.** The formatter schema uses HTML attribute name, not React camelCase.
- **Space-separate multiple classes** — e.g. `"class": "sp-card-content sp-card-highlightedContent ms-fontColor-neutralPrimary"`. No array.
- **`sp-card-defaultClickButton` must be a sibling of `sp-card-subContainer`, not nested inside.** Otherwise clicks land on content and the card-wide click target breaks.
- **`sp-card-container` sets a fixed width** matching Gallery tile size. In List rowFormatter, override with `style: { "width": "100%" }`.
- **Classes are not in the JSON schema** — won't autocomplete in Monaco. Mistyped names fail silently.
- **Cannot extend with custom `.sp-card-myThing` classes.** No custom CSS via formatter. Use published classes + inline `style` overrides.

`buildQuadrantTile()` in `lib/quadrant.ts` implements the full three-layer pattern.

---

## Unsupported CSS Properties

`pointer-events` — not supported (silently ignored)  
`calc()`, `min()`, `max()` — not supported in style values  
`gap`, `row-gap` — not supported in flex context (use margin instead)  
`align-self`, `align-content`, `justify-items`, `order` — not supported  
`transition`, `animation`, `filter`, `backdrop-filter` — not supported  
`grid-template-*`, `grid-area`, `grid-column`, `grid-row` — not supported  
`aspect-ratio`, `clip-path`, `mask`, `will-change` — not supported  
Custom CSS variables (except `--inline-editor-*`) — not supported  
Full `transform` — only `translate(...)` is honored

### Supported (commonly assumed unsupported)

`box-shadow` — **fully supported** including multiple comma-separated shadows  
`-webkit-line-clamp` — supported for text truncation  
`object-fit` — supported for image sizing  
`display: table` / `table-row` / `table-cell` — supported for CSS table layouts
