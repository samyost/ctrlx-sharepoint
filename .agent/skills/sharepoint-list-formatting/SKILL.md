---
name: SharePoint List Formatting
description: Comprehensive reference for SharePoint List/View JSON formatting — operators, forEach, customCardProps, encoding, deployment, and proven patterns.
---

> **Consolidated** — key content from this skill has been absorbed into the `.agent/knowledge/` topic files: [`sp-expressions.md`](../knowledge/sp-expressions.md), [`sp-elements.md`](../knowledge/sp-elements.md), [`sp-dates.md`](../knowledge/sp-dates.md), [`sp-aggregates.md`](../knowledge/sp-aggregates.md). This file is kept as the full reference.

# SharePoint List Formatting — Reference & Patterns

Read this skill before creating or modifying any SharePoint list/view JSON formatter.

---

## Available Operators

From the [MS Formatting Syntax Reference](https://learn.microsoft.com/en-us/sharepoint/dev/declarative-customization/formatting-syntax-reference).

### Arithmetic / Comparison
`+`, `-`, `*`, `/`, `%`, `<`, `>`, `==`, `!=`, `<=`, `>=`, `||`, `&&`

### Conditional
`?` / `:` (ternary — use as `"operator": "?"` with `"operands": [condition, trueVal, falseVal]`)

### Type Conversion
- `toString()` — number/boolean to string
- `Number()` — string to number
- `Date()` — string to date

### Math
`abs`, `floor`, `ceiling`, `pow`, `cos`, `sin`

### String Operators

| Operator | Args | Notes |
|---|---|---|
| `indexOf(str/array, search)` | 2 | First occurrence, -1 if not found. **2 args ONLY — 3-arg form DOES NOT EXIST** |
| `lastIndexOf(str/array, search)` | 2 | Last occurrence, -1 if not found |
| `substring(str, start, end)` | 3 | Extract characters from start to end index or use 999 for end index |
| `startsWith(str, prefix)` | 2 | Boolean |
| `endsWith(str, suffix)` | 2 | Boolean |
| `replace(str, old, new)` | 3 | Replace **FIRST** instance only |
| `replaceAll(str, old, new)` | 3 | Replace **ALL** instances |
| `padStart(str, len, pad)` | 3 | Pad from start |
| `padEnd(str, len, pad)` | 3 | Pad from end |
| `toLowerCase(str)` | 1 | Lowercase |
| `toUpperCase(str)` | 1 | Uppercase |
| `toLocaleString()` | 1 | Locale-formatted string |
| `toLocaleDateString()` | 1 | Locale date string |
| `toLocaleTimeString()` | 1 | Locale time string |

### Array Operators

| Operator | Args | Notes |
|---|---|---|
| `split(str,delim)` | 2 | String to array |
| `join(array, sep)` | 2 | Array to string |
| `length(array)` | 1 | Count of elements. **NOT string length!** Returns 1 for non-empty string, 0 for empty |
| `appendTo(array, item)` | 2 | Returns new array with item appended |
| `removeFrom(array, item)` | 2 | Returns new array with item removed |
| `indexOf(array, item)` | 2 | Position of item, -1 if not found |

> **Note**: Dynamic-length empty arrays can be natively generated for numerical `forEach` looping by splitting an empty character against a padded string (e.g., `split(padStart('', count), '')`).

### Date Operators
`getDate`, `getMonth`, `getYear`, `addDays`, `addMinutes`

### Other
- `loopIndex('iteratorName')` — current index within a `forEach` loop
- `getUserImage(email, size)` — user profile image ('S', 'M', 'L')
- `getThumbnailImage()` — document thumbnail

---

## Expression Nesting Depth

**10 levels proven to work.** The actual limit could be higher.

When an expression renders as raw formula text, it indicates a **syntax error** (e.g., unsupported 3-arg `indexOf`), not a nesting depth limit.

---

## forEach Behavior

### Syntax
`forEach` value is `"variableName in expression"` — **NO `=` prefix**.

| Syntax | Result |
|---|---|
| `"forEach": "obj in split(...)"` | ✅ Works |
| `"forEach": "obj in =split(...)"` | ❌ Empty 0x0 card |

### forEach + split() — The Zero Whitespace Rule

`split()` as the `forEach` source has **one single, critical constraint**:
**ZERO WHITESPACE** is permitted anywhere inside the `split()` parenthesis. That means no spaces around or within the parameters of the split function.
There is **NO** requirement to wrap the field reference in `toString()`, despite past assumptions. The only culprit historically has been standard syntax spacing.

| forEach expression | Result | Reason |
|---|---|---|
| `split([$field], ',')` | ❌ Beak only | Space after the comma! |
| `split([$field],'| ')` | ❌ Beak only | Space inside the delimiter string! |
| `split([$field],',')` | ✅ Works | Zero whitespace |


### Iterator Variables
- `[$x]` — the current element value
- `loopIndex('x')` — the current 0-based index
- `length(@currentField)` — total count (for native arrays)
- `[$x.lookupValue]`, `[$x.email]`, `[$x.title]` — sub-properties (Lookup/Person)

---

## customCardProps (Cascading Cards)

Nested `customCardProps` work many levels deep in both column formatters and view `rowFormatter`.

### Rules
1. `div` with child spans might hijack clicks
2. **Put `txtContent` directly on the `button`** — no children needed
3. **All levels must use `openOnEvent: "click"`**
4. **`pointer-events` CSS** is NOT in SP's whitelist — silently ignored
5. **`columnFormatterReference` inside cards**: ✅ Works (renders blank if column has no formatter)
6. **`inlineEditField` inside cards**: ✅ Works for Text and Person fields
7. **`@me` inside cards**: ✅ Works
8. **`beakStyle`**: ✅ Works — e.g., `"beakStyle":{"backgroundColor":"orange"}` for debugging
9. **Theme CSS classes**: ✅ Work via `attributes.class` (e.g., `ms-bgColor-neutralLighter`)

### Minimal Pattern
```json
{
  "elmType": "button",
  "txtContent": "Open Card",
  "style": {
    "padding": "8px 14px",
    "background-color": "#0078d4",
    "color": "#fff",
    "border": "none",
    "border-radius": "6px",
    "cursor": "pointer",
    "font-weight": "600"
  },
  "customCardProps": {
    "openOnEvent": "click",
    "directionalHint": "bottomCenter",
    "isBeakVisible": true,
    "formatter": {
      "elmType": "div",
      "style": { "padding": "16px 20px", "min-width": "300px" },
      "children": [
        {
          "elmType": "div",
          "txtContent": "Card Content"
        },
        {
          "elmType": "button",
          "txtContent": "Nested Card",
          "style": {
            "padding": "8px 14px",
            "background-color": "#008080",
            "color": "#fff",
            "border": "none",
            "border-radius": "6px",
            "cursor": "pointer"
          },
          "customCardProps": {
            "openOnEvent": "click",
            "directionalHint": "rightCenter",
            "isBeakVisible": true,
            "formatter": {
              "elmType": "div",
              "style": { "padding": "14px 18px", "min-width": "240px" },
              "children": [{ "elmType": "div", "txtContent": "Level 2 Content" }]
            }
          }
        }
      ]
    }
  }
}
```

---

## customRowAction + Embed

`customRowAction` with `action: "embed"` inside `customCardProps`: ✅ Works — opens inline edit form panel.

- Requires `actionInput.src` (URL), optional `width`/`height`
- The `Source` return URL must be fully URL-encoded (`%3A`, `%2F`, `%3F`, `%3D`)
- Responsive sizing pattern:
  - `"width": "=if(@window.innerWidth > 1200, '1000', if(@window.innerWidth > 500, toString(@window.innerWidth - 150), '350'))"`
  - `"height": "=if(@window.innerHeight > 1100, '1000', if(@window.innerHeight > 600, toString(@window.innerHeight - 250), '350'))"`

---

## Dynamic Aggregate Math in Group Headers

Derive missing counts (e.g., "Pending Approvals") dynamically using `@group.count` minus a column aggregate.

### Rules
1. Targeted column **must have Totals aggregate turned on** in View Settings
2. `[$aggregate.columnDisplayName]` targets the *Display Name* — renames break the match
3. **Wrap aggregate values in `Number()`** before math — otherwise `+` may concatenate strings

### Minimal Pattern
```json
{
  "elmType": "div",
  "forEach": "aggregate in @aggregates",
  "children": [{
    "elmType": "div",
    "style": {
      "display": "=if([$aggregate.columnDisplayName] == 'Approved' && Number([$aggregate.value]) < @group.count, 'flex', 'none')"
    },
    "txtContent": "='Pending: ' + Number(@group.count - Number([$aggregate.value]))"
  }]
}
```

### Lookup/Person Group Headers
When grouped by Lookup or Person columns, `@group.fieldData` returns an object. Use `@group.fieldData.lookupValue` — NOT `.displayValue` (also returns `[object Object]`).

---

## Friendly Date Formatter Pattern

Displays dates as relative time ("today", "yesterday", "this week", "3 weeks ago", "2 months ago").

### Logic

| Output | Condition |
|---|---|
| `today` | Date >= Midnight Today |
| `yesterday` | Date >= Midnight Yesterday |
| `this week` | Date >= Last Monday |
| `last week` | Date >= Monday before last |
| `X weeks ago` | Older than 14 days, less than 30 |
| `X months ago` | Older than 30 days |

### Key Constants (Milliseconds)

| Value | Meaning |
|---|---|
| `86400000` | 1 day |
| `604800000` | 1 week |
| `2592000000` | 30 days |
| `2629746000` | ~1 month (average) |

### Monday Calculation
`(Number/86400000+4)%7` calculates days since Monday (Unix epoch offset of 4 for Thursday).

### Integer Extraction
Uses `substring` with `indexOf('.')` to extract the integer portion: `substring(toString(value), 0, indexOf(toString(value) + '.', '.'))`.

---

## `_comment` Property

**Only safe inside `style` objects.** Element-level `_comment` properties can cause parsing errors — remove them from production formatters.

---

## CSS Style Allow-List

SharePoint's renderer enforces a strict allow-list. Any property **not** listed below is **silently dropped**.

### At-a-Glance

| Category | Properties |
|---|---|
| **Box model** | `width`, `height`, `min-width`, `min-height`, `max-width`, `max-height`, `box-sizing`, `box-shadow`, `box-decoration-break` |
| **Spacing** | `margin`, `margin-top/right/bottom/left`, `padding`, `padding-top/right/bottom/left` |
| **Borders** | `border`, `border-top/right/bottom/left` (and `-color`/`-style`/`-width`), `border-color`, `border-style`, `border-width` |
| **Border radius** | `border-radius`, `border-top-left-radius`, `border-top-right-radius`, `border-bottom-left-radius`, `border-bottom-right-radius` |
| **Outline** | `outline`, `outline-color`, `outline-style`, `outline-width` |
| **Backgrounds & fills** | `background-color`, `background-image`, `fill`, `fill-opacity`, `stroke` |
| **Layout & position** | `display`, `position`, `top`, `right`, `bottom`, `left`, `z-index`, `clear`, `clip`, `visibility`, `overflow`, `overflow-x`, `overflow-y` |
| **Flexbox** | `flex`, `flex-grow`, `flex-shrink`, `flex-flow`, `flex-direction`, `flex-wrap`, `justify-content`, `align-items` |
| **Tables** | `border-collapse`, `border-spacing`, `caption-side`, `empty-cells`, `table-layout` |
| **Multi-column** | `columns`, `column-count`, `column-fill`, `column-gap`, `column-span`, `column-width`, `column-rule` |
| **Typography** | `font`, `font-family`, `font-size`, `font-weight`, `font-style`, `font-variant`, `color`, `direction`, `letter-spacing`, `line-height`, `text-align`, `text-decoration`, `text-indent`, `text-overflow`, `text-shadow`, `text-transform`, `text-wrap`, `vertical-align`, `white-space`, `word-break`, `word-spacing`, `word-wrap`, `-webkit-line-clamp` |
| **Effects** | `opacity`, `cursor`, `transform` *(translate only)*, `object-fit` |
| **Inline editor CSS vars** | `--inline-editor-border-width`, `--inline-editor-border-style`, `--inline-editor-border-radius`, `--inline-editor-border-color` |

### Silently Stripped (look like CSS but won't work)

`gap`, `row-gap`, `align-self`, `align-content`, `justify-items`, `justify-self`, `place-items`, `place-content`, `place-self`, `order`, `aspect-ratio`, `inset`, `grid-template-columns`, `grid-template-rows`, `grid-template-areas`, `grid-area`, `grid-column`, `grid-row`, `transition`, `animation`, `filter`, `backdrop-filter`, `mix-blend-mode`, `clip-path`, `mask`, `will-change`, `pointer-events`, custom CSS variables (except `--inline-editor-*`), full `transform` (only `translate(...)` honored).

### Workarounds

1. **Use a SharePoint utility class** via `attributes.class` — classes bypass the schema filter entirely
2. **Approximate with allowed props** — margin instead of gap, flex-wrap instead of grid, etc.
3. **Promote to SPFx Field Customizer** — official escape hatch when declarative won't work

---

### Flexbox Subset

| Property | Supported Values |
|---|---|
| `display` | `flex`, `inline-flex`, `block`, `inline-block`, `none`, `inline`, `table`, `table-cell`, `table-row` |
| `flex-direction` | `row`, `row-reverse`, `column`, `column-reverse` |
| `flex-wrap` | `nowrap`, `wrap`, `wrap-reverse` |
| `flex-flow` | shorthand for `<flex-direction> <flex-wrap>` |
| `flex` | shorthand for `<flex-grow> <flex-shrink> <flex-basis>` |
| `flex-grow` | unitless number, e.g. `1` |
| `flex-shrink` | unitless number, e.g. `0` |
| `justify-content` | `flex-start`, `flex-end`, `center`, `space-between`, `space-around`, `space-evenly` |
| `align-items` | `stretch`, `flex-start`, `flex-end`, `center`, `baseline` |

**NOT supported:** `align-self`, `align-content`, `justify-items`, `justify-self`, `place-*`, `order`, `gap`, `row-gap`.

---

### Inline Editor CSS Variables

When an element uses `inlineEditField`, four custom CSS properties style hover/focus rings:

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

Pass 4-side TRBL values for an underline-only editor ring (Material text field style). These are the **only** custom CSS properties the renderer respects.

---

### Pro Tips

- **Status pills:** `border-radius: 999px` + `padding: 2px 10px` + `background-color` = perfect Fluent pill
- **Severity bars:** 4-6px `border-left` driven by expression: `"border-left-color": "=if([$Priority]=='High','#d13438','#107c10')"`
- **`box-shadow`** is **fully supported** — including multiple comma-separated shadows. Material elevation: `"box-shadow": "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)"`
- **`min-width: 0`** on flex children with long text — without it, ellipsis breaks because flex items refuse to shrink below intrinsic min-content width
- **`box-sizing: border-box`** — always set on flex/card containers so padding doesn't blow `width: 100%` past parent
- **`width: 100%` + `max-width: Xpx`** — SharePoint-friendly way to fake `clamp()` (not allowed)
- **CSS gradients** work inside `background-image`: `"background-image": "linear-gradient(135deg, #0078d4, #5c2d91)"`
- **SVG coloring** — use `fill` and `stroke` for `svg`/`path` elmType. `color` won't paint SVGs.
- **`outline`** doesn't take layout space — use for hover rings without pushing layout

---

## Hover in Column & Row Formatters

`sp-card-showOnHoverParent` + `sp-card-showOnHoverChild` works in **column formatters** and **row formatters** — no gallery/tile view required.

```json
{
  "elmType": "div",
  "attributes": { "class": "sp-card-showOnHoverParent" },
  "children": [
    { "elmType": "span", "txtContent": "Always visible" },
    {
      "elmType": "span",
      "txtContent": "Hover only",
      "attributes": { "class": "sp-card-showOnHoverChild" }
    }
  ]
}
```

**Rules:**
- Parent must have `sp-card-showOnHoverParent` class
- Children to show/hide must have `sp-card-showOnHoverChild` class
- Works in column formatters, row formatters, and tile/gallery formatters
- No `additionalRowClass` or `sp-row-card` needed

---

## `columnFormatterReference` in Tile/Gallery Views

Use `sp-card-formatterRef` class on the container to properly render embedded column formatters:

```json
{
  "elmType": "div",
  "attributes": { "class": "sp-card-content sp-card-formatterRef" },
  "children": [
    { "columnFormatterReference": "[$ColumnName]" }
  ]
}
```

---

## `sp-card-*` Classes — The Less-Code Playbook

The `sp-card-*` family is the **single biggest code-saver**. Every class is a pre-baked CSS rule in SharePoint's stylesheet — apply via `attributes.class` and inherit pixel-perfect defaults for spacing, typography, hover, focus rings, line-clamp, and accessibility. **No `style` block required.**

Hand-rolled cards typically run **80-200 lines**. Cards built on `sp-card-*` classes are **20-40 lines**.

### Canonical Card Scaffold

```
sp-card-container                              ← root tile box (sizing + focus ring)
├── sp-card-defaultClickButton                 ← invisible click overlay
└── sp-card-subContainer + sp-card-borderHighlight
    │                                          ← visible card body + hover border
    ├── sp-card-previewColumnContainer         ← top "hero" / image area
    │   └── sp-card-imageContainer
    │       └── sp-card-imagePreviewBackground
    │           ├── <img sp-card-imagePreview>
    │           ├── <svg sp-card-defaultImage>
    │           └── <svg sp-card-defaultImageOverlay>
    │
    ├── sp-card-displayColumnContainer × N     ← one per key/value pair
    │   ├── <p sp-card-label>                  ← field caption (small, secondary)
    │   └── <p sp-card-content>                ← field value
    │         + sp-card-multiline              ← line-clamped
    │         + sp-card-highlightedContent     ← bigger/bolder "headline"
    │         + sp-card-urlContent             ← hyperlink
    │
    ├── sp-card-lastTextColumnContainer        ← last text block
    │
    └── people block (sp-card-previewColumnContainer)
        ├── sp-card-userContainer × N
        │   └── <img sp-card-userThumbnail>
        ├── sp-card-userOthers                 ← "+N" overflow chip
        ├── sp-card-userTitle
        └── sp-card-userEmptyText              ← "–" placeholder
```

### Full Class Reference

| Class | Purpose | Where it goes |
|---|---|---|
| `sp-card-container` | Root card box — tile size, focus ring, positioning. | Outermost `div` |
| `sp-card-container-noPadding` | No padding variant — full-bleed image cards. | Outermost `div` |
| `sp-card-subContainer` | Visible card surface — padding, rounded corners. | First child of container |
| `sp-card-borderHighlight` | 1px neutral border, glows on hover. | Same element as subContainer |
| `sp-card-defaultClickButton` | Invisible absolute overlay → `customRowAction`. | Sibling of subContainer |
| `sp-card-bottomCommandBar` | Bottom command bar zone. | Inside subContainer |
| `sp-card-previewColumnContainer` | Top image/people area. | Inside subContainer |
| `sp-card-imageContainer` | Image wrapper — aspect ratio, overflow. | Inside previewColumnContainer |
| `sp-card-imagePreview` | Actual `<img>` — object-fit, sizing. | On the `<img>` |
| `sp-card-imagePreviewBackground` | Gray placeholder background. | Inside imageContainer |
| `sp-card-defaultImage` | SVG placeholder shape (no image). | `<svg>` |
| `sp-card-defaultImageOverlay` | "Missing image" icon. | `<svg>` |
| `sp-card-displayColumnContainer` | One per label+content pair. | Inside subContainer |
| `sp-card-lastTextColumnContainer` | Last text block (different margin). | Last text block |
| `sp-card-label` | Small secondary caption. Use `[!Field.DisplayName]`. | `<p>` / `<span>` |
| `sp-card-content` | Value text — font, color, line-height. | `<p>` / `<span>` / `<a>` |
| `sp-card-highlightedContent` | Modifier — bigger, bolder. For Title. | + `sp-card-content` |
| `sp-card-multiline` | Modifier — multi-line wrap. Pair with `-webkit-line-clamp`. | + `sp-card-content` |
| `sp-card-urlContent` | Modifier — hyperlink styling. | + `sp-card-content` on `<a>` |
| `sp-card-boldText` | Inline bold helper. | `<span>` |
| `sp-card-keyboard-focusable` | Focus ring on tab. | Any focusable element |
| `sp-card-formatterRef` | Container for `columnFormatterReference`. | Wrapper `div` |
| `sp-card-showOnHoverParent` | Activates hover detection. | Parent container |
| `sp-card-showOnHoverChild` | Hidden until parent hovered. | Child elements |
| `sp-card-starRating` | Filled star in rating block. | `<span>` per star |
| `sp-card-emptyFillStar` | Modifier — empty/outline star. | + `sp-card-starRating` |
| `sp-card-halfFillStar` | Modifier — half-filled star. | + `sp-card-starRating` |
| `sp-card-ratingCount` | "(12)" count beside stars. | `<span>` |
| `sp-card-userContainer` | Person thumbnail wrapper — circular crop. | `<a>` / `<div>` per person |
| `sp-card-userThumbnail` | Person `<img>` — round, sized. | `<img>` |
| `sp-card-userTitle` | Person name (single person). | `<div>` |
| `sp-card-userOthers` | "+3" overflow chip. | `<div>` |
| `sp-card-userEmptyText` | "–" placeholder (empty). | `<p>` |
| `sp-card-userCustomCard` | Modifier inside overflow callout. | In `customCardProps.formatter` |
| `sp-card-personCallout` | Overflow people list container. | Root of callout |

### Decision Matrix: Class vs. Inline Style

| Need | Use a class | Use inline `style` |
|---|---|---|
| Field caption text | ✅ `sp-card-label` | ❌ |
| Field value text | ✅ `sp-card-content` | ❌ |
| Bold/large title | ✅ `sp-card-content sp-card-highlightedContent` | ❌ |
| Multi-line with N-line clamp | ✅ `sp-card-content sp-card-multiline` | ✅ `-webkit-line-clamp` only |
| Hyperlink styling | ✅ `sp-card-urlContent` on `<a>` | ❌ |
| Whole-card click target | ✅ `sp-card-defaultClickButton` | ❌ |
| Card hover border | ✅ `sp-card-borderHighlight` + border color class | ❌ |
| Image thumbnail | ✅ `sp-card-imagePreview` + `imagePreviewBackground` | ❌ |
| Custom card width (rowFormatter) | ❌ | ✅ `width: 100%` |
| Custom colors (off-theme) | ❌ — use `ms-bgColor-*` | ✅ last resort |
| Flexbox layout between blocks | ❌ | ✅ `display: flex` etc. |
| Per-priority severity bar | ❌ | ✅ `border-left-color` |

**Rule of thumb:** Class for *visual treatment* (typography, color, spacing). Style for *layout* (arranging fields).

### Gotchas

- **Use `attributes.class`, not `className`.** Schema uses HTML attribute name.
- **Space-separate multiple classes** in a single string — no array.
- **`sp-card-defaultClickButton` must be a sibling** of `sp-card-subContainer`, not nested inside.
- **`sp-card-container` sets a fixed width** (Gallery tile size). Override with `style: { "width": "100%" }` in rowFormatter.
- **Classes won't autocomplete** in Monaco — not in JSON schema. Mistyped names fail silently.
- **Cannot create custom `.sp-card-*` classes** — use published classes + inline `style` overrides.

### Using `sp-card-*` in List View rowFormatters

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/row-formatting.schema.json",
  "hideSelection": true,
  "hideColumnHeader": true,
  "rowFormatter": {
    "elmType": "div",
    "attributes": { "class": "sp-card-container" },
    "style": { "width": "100%", "margin-bottom": "8px" },
    "children": [
      { "elmType": "div", "attributes": { "class": "sp-card-defaultClickButton" }, "customRowAction": { "action": "defaultClick" } },
      {
        "elmType": "div",
        "attributes": { "class": "ms-bgColor-white sp-css-borderColor-neutralLight sp-card-borderHighlight sp-card-subContainer" },
        "style": { "display": "flex", "align-items": "center", "padding": "12px" },
        "children": [
          {
            "elmType": "div",
            "attributes": { "class": "sp-card-displayColumnContainer" },
            "style": { "flex": "1 1 0", "min-width": "0" },
            "children": [
              { "elmType": "p", "attributes": { "class": "ms-fontColor-neutralSecondary sp-card-label" }, "txtContent": "[!Title.DisplayName]" },
              { "elmType": "p", "attributes": { "class": "ms-fontColor-neutralPrimary sp-card-content sp-card-highlightedContent" }, "txtContent": "[$Title]" }
            ]
          }
        ]
      }
    ]
  }
}
```

The `width: 100%` override is the one inline style needed — the class defaults to Gallery tile width.

---

## Data Table Layout (CSS Table)

For Gallery cards presenting key/value spec sheets:

```json
{
  "elmType": "div",
  "style": {
    "display": "table",
    "width": "100%",
    "table-layout": "fixed",
    "border-collapse": "collapse"
  },
  "children": [
    {
      "elmType": "div",
      "style": { "display": "table-row" },
      "children": [
        {
          "elmType": "div",
          "style": { "display": "table-cell", "padding": "6px 8px", "width": "40%", "font-weight": "600" },
          "txtContent": "Owner"
        },
        {
          "elmType": "div",
          "style": { "display": "table-cell", "padding": "6px 8px" },
          "txtContent": "[$Owner.title]"
        }
      ]
    }
  ]
}
```

### Table Pro Tips

- **`table-layout: fixed` is non-negotiable** — without it, auto pass measures every cell (slow + width jitter)
- **`border-spacing` is your `gap`** — use with `border-collapse: separate`
- **`empty-cells: hide`** cleans up sparse data without `=if(...)` on every cell
- **Mixing table + flex parents works** — table behaves as single flex item
- **No `colspan`/`rowspan`** — HTML attributes, not CSS. Fake colspan with single cell + `width: 100%`
- **Tables = true equal-width children** without flexbox math. `fixed` divides width evenly
- **Performance:** deeply nested table row formatter renders faster than flex with heavy conditional logic

---

## Theme Awareness

- Card classes use Fluent **tokens**, not hard-coded colors. Theme/dark mode changes auto-recolor cards.
- **Don't hard-code `color` or `background-color` if a Fluent class would do** — fights cascade, loses theme parity.
- For accents, prefer `ms-bgColor-themePrimary`, `ms-fontColor-themePrimary` over hex.
