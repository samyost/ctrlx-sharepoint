# Formatter Component Guide

## Import Pattern

All lib exports are available from a single entry point:

```ts
import { statusBadge, VStack, compile, theme, FIELDS } from '../lib';
```

No more per-file imports. `index.ts` is the public surface.

---

## Decision Tree

**What am I building?**

### Layout structure (rows, columns, spacing, containers)
→ **Primitives:** `VStack`, `HStack`, `Box`, `Text`

```ts
VStack({ gap: 'sm', padding: 'md' }, [child1, child2])   // flex column
HStack({ alignItems: 'center', gap: 'xs' }, [icon, label]) // flex row
Box({ bgColor: 'surface', borderRadius: '4px' }, children) // generic div
Text({ variant: 'caption', content: '[$Field]' })          // span with preset
```

Props accept theme tokens directly — `gap: 'sm'` resolves to `'8px'`.  
`styleOverrides` is the **base** (lowest priority). Computed props like `bgColor` and `gap` override it.

> **Gap shim:** CSS `gap` is not supported by SharePoint's renderer (silently stripped).  
> `VStack`/`HStack` automatically convert `gap` to `margin-bottom`/`margin-right` on children.  
> For wrapping containers (`wrap: 'wrap'`), both directions get margins.

---

### SP-Specific UI → Component Factories

| What | Factory | Key notes |
|------|---------|-----------|
| Status pill badge | `statusBadge(fieldRef, statusMap)` | Conditional color + optional icon per status |
| Avatar + display name | `persona(personRef, size?)` | Person field reference, size `'s'`/`'m'`/`'l'` |
| Avatar only | `userAvatar(emailExpr, size?)` | Pass `.email` property ref |
| Editable inline field | `inlineEdit(fieldRef, placeholder, opts?)` | Prevents visibility lock-out bug |
| Delimited tags as pills | `pillsBadge(fieldRef, delimiter?)` | Default delimiter `;` |
| Path breadcrumb | `breadcrumbPath(fieldRef, delimiter?)` | Default delimiter `:` |
| Column formatter embed | `columnRef(fieldRef, styleOverrides?, opts?)` | Pass `{ galleryCard: true }` in tile views |
| Multi-person count | `memberCountBadge(fieldRef)` | "N members" with icon |
| Empty-state message | `emptyState(hasDataExpr, message)` | Shown when `hasDataExpr` is false |
| Auth visibility gate | `dualContainer(authExpr, interactive, readOnly)` | Mutually exclusive siblings |
| Top-right action icons | `actionCluster(actions)` | Absolute-positioned; pass links or row actions |
| Cache-busting rev tag | `revLabel(version)` | Required — triggers validation warning if missing |
| Loading spinner | `progressSpinnerFlat(size?, colorExpr?)` | Rotating ProgressLoopOuter icon |
| Key/value spec table | `dataTable(rows, options?)` | CSS `display: table` layout; `table-layout: fixed` |

---

### Buttons

| Scenario | Approach |
|---|---|
| Triggers a row action (`setValue`, `executeFlow`, etc.) | `button({ text, icon?, customRowAction })` |
| Opens a hover/click card | `button({ text, icon?, customCardProps })` — overlay div handled automatically |
| Link to external URL | `actionCluster` with a string `action`, or `<a>` element directly |

> **Note on `button` vs `div`:** `button()` uses `div role="button"` everywhere. The one exception is if you need a bare `customCardProps` trigger without using `button()` — in that case `button` elmType is required (`div` hijacks click registration). `button()` avoids this with an absolute overlay.  
> See: `.agent/knowledge/sp-elements.md`

---

### Complete Gallery/Tile Cards
→ **`buildQuadrantTile(config, options?)`**

2×2 quadrant layout. Pass `QuadrantConfig` (identity, state, details, actions) and `QuadrantCardOptions` (width, height, rev, doneExpr).

```ts
const tile = buildQuadrantTile(config, { rev: 3, width: 360, height: 300 });
compileTile(tile, 'MyList_GalleryView');
```

See: `.agent/knowledge/sp-elements.md` — SP card hover pattern, three-layer structure

---

### Non-Quadrant Card Shell
→ **`cardRoot(children, options?)`**

For cards that need relative positioning (for `actionCluster`), optional terminal-state dimming (`doneExpr`), and a no-op click absorber.

---

## Build Pipeline

```ts
// Column or row formatter
const el = VStack({ gap: 'sm' }, [ statusBadge(...), persona(...), revLabel(4) ]);
compile(el, 'MyList_ColumnName');

// Gallery/tile formatter
const tile = buildQuadrantTile(config, { rev: 2 });
compileTile(tile, 'MyList_GalleryView');
```

`compile()` and `compileTile()` both:
- Run `validate()` and print any warnings
- Inject `_debug` metadata (source path, compile time)
- Strip spaces from SP expressions (`sanitizeForCSOM`)
- Skip the write if output is unchanged (preserves git history)

**Validation catches:** Unicode characters, misplaced `_comment`, missing `revLabel`.

See: `.agent/knowledge/sp-expressions.md` — Zero Whitespace Rule  
See: `.agent/knowledge/deployment.md` — CSOM deployment constraints
