---
name: SPO-NoSQL
description: "Native JSON state management and parsing in SharePoint multiline text columns. CRUD patterns, Safe Read extraction, and UI integration rules."
---

> **Consolidated** — key content from this skill has been absorbed into [`.agent/knowledge/spo-nosql.md`](../knowledge/spo-nosql.md). This file is kept as the full reference.

# SPO-NoSQL v2.1: Native JSON State Management in SPO

SharePoint Online does not support repeating tables, NoSQL schema-less data, or `parseJSON()`. This architecture uses a standard **Multiple lines of text (Plain Text)** column to store a minified JSON array string, deconstructed via multi-character delimiters.

---

## 1. Mandatory Storage Rules

1. **Array Baseline:** The string must always be wrapped in `[{ }]` or evaluate to `[]` or `''` if empty.
2. **Strict Minification:** No structural whitespace or `\n`.
3. **Unique Identifiers:** Every object must include a unique ID. To prevent rapid-click `@now` collisions, inject a math-based jitter suffix:
   `"id":"' + toString(Number(@now)) + '_' + substring(toString(Number(@now) * 7), 0, 3) + '"`
4. **Input Sanitization:** All text inputs MUST be sanitized via `=replaceAll([$input], '"', '''')`.
   This single replacement renders the payload immune to structural delimiter injection because the parsing engine relies on multi-character boundaries that include double-quotes.

---

## 2. The Mutation Layer (WRITE / UPDATE / DELETE)

These patterns execute in `customRowAction` (`setValue`). In a `forEach` loop, `[$obj]` represents the inner KVP string. To safely target that object, reconstruct it as `'{"' + [$obj] + '"}'`.

### Append (FIFO — Bottom of List)
```json
"actionInput": {
  "JSONPayload": "=if([$JSONPayload] == '' || [$JSONPayload] == '[]', '[{\"' + [$TempKey] + '\":\"' + [$TempValue] + '\"}]', substring([$JSONPayload], 0, length([$JSONPayload]) - 1) + ',{\"' + [$TempKey] + '\":\"' + [$TempValue] + '\"}]')"
}
```

### Prepend (LIFO — Top of List)
```json
"actionInput": {
  "JSONPayload": "=if([$JSONPayload] == '' || [$JSONPayload] == '[]', '[{\"' + [$TempKey] + '\":\"' + [$TempValue] + '\"}]', '[{\"' + [$TempKey] + '\":\"' + [$TempValue] + '\"},' + substring([$JSONPayload], 1, length([$JSONPayload])))"
}
```

### Update (In-Place Property Mutation)
```json
"actionInput": {
  "JSONPayload": "=replaceAll([$JSONPayload], '{\"' + [$obj] + '\"}', '{\"' + replaceAll([$obj], '\"s\":\"0\"', '\"s\":\"1\"') + '\"}')"
}
```

### Delete (Comma Cleanup Cascade)
A 3-pass cascading replace that targets the object and its adjacent structural comma:

```json
"actionInput": {
  "JSONPayload": "=replaceAll(replaceAll(replaceAll([$JSONPayload], '{\"' + [$obj] + '\"},', ''), ',{\"' + [$obj] + '\"}', ''), '{\"' + [$obj] + '\"}', '')"
}
```

Cascade logic:
1. `{"B"},` — matches middle/first items, removes trailing comma
2. `,{"B"}` — matches last items, removes leading comma
3. `{"B"}` — clears the array if it's the only item

---

## 3. The Rendering Engine

### forEach JSON Element Syntax
```json
{
  "elmType": "div",
  "style": {
    "display": "=if([$JSONPayload] == '' || [$JSONPayload] == '[]', 'none', 'flex')",
    "flex-direction": "column", "gap": "8px"
  },
  "children": [{
    "elmType": "div",
    "forEach": "obj in split(replaceAll(replaceAll([$JSONPayload],'[{\"', ''),'\"}]',''),'\"},{\"')",
    "children": [{
      "elmType": "div",
      "forEach": "kvp in split([$obj],'\",\"')",
      "style": { "display": "flex", "gap": "4px" },
      "children": [
        { "elmType": "span", "txtContent": "=substring([$kvp], 0, indexOf([$kvp], '\":\"')) + ': '", "style": { "font-weight": "600" } },
        { "elmType": "span", "txtContent": "=substring([$kvp], indexOf([$kvp], '\":\"') + 3, length([$kvp]))" }
      ]
    }]
  }]
}
```

> [!TIP]
> The basic rendering above handles **flat KVP objects** only. For **nested objects, arrays, or polymorphic payloads** (where chunk shapes vary), use the **Standardized JSON Parser** pattern documented in §6 below. It uses a split-first pipeline with type detection and scoped tokenization.

### Safe Read Pattern (Key-Order Extraction)

Since `indexOf` only supports **2 arguments**, use the next key's delimiter as the end boundary. Pad `[$obj]` with `"` on both sides to handle shell-stripped first/last keys.

```json
// Extract "t" (ends at next key "e")
"txtContent": "=substring('\"' + [$obj] + '\"', indexOf('\"' + [$obj] + '\"', '\"t\":\"') + 5, indexOf('\"' + [$obj] + '\"', '\",\"e\"'))"

// Extract last key "s" (ends at trailing quote)
"txtContent": "=substring('\"' + [$obj] + '\"', indexOf('\"' + [$obj] + '\"', '\"s\":\"') + 5, length('\"' + [$obj] + '\"') - 1)"

// Safe Read with missing key check
"txtContent": "=if(indexOf('\"' + [$obj] + '\"', '\"e\":\"') == -1, '', <extraction>)"
```

### Replace-then-Read (Order-Independent)

```
substring(
  replace([$obj], substring([$obj], 0, indexOf([$obj], '"t":"') + 5), ''),
  0,
  indexOf(replace([$obj], substring([$obj], 0, indexOf([$obj], '"t":"') + 5), ''), '"')
)
```

### Object Count
```
length(split(toString([$field]), '},{'))
```
`split` on `},{` yields N segments for N objects. `toString()` wrapper is required.

---

## 4. Limits & Constraints

### Storage
- **SPO Render Limit:** Plain Text degrades around ~64,000 characters
- **Capacity:** ~1,400 items per cell at ~45 chars/entry

### Concurrency
- `setValue` actions are stateless REST operations — no native Optimistic Concurrency Control
- If two users mutate simultaneously, the second may get a `409 Conflict` or silently overwrite
- **Guidance:** Use for asynchronous workflows or single-owner records

### Trade-Off vs Pipe-Delimited
JSON wins on missing key safety, extensibility, readability, and injection safety. Pipe-delimited wins only on capacity (~2,600 vs ~1,400 items). **JSON is the default standard unless 2,500+ items are required.**

---

## 5. In-Place Mutation via Helper Columns

To allow click-to-edit a value inside the JSON string (e.g., toggle a status):

- `_edit` — editable staging column. Formatter pre-fills with current value; user edits directly.
- `_save` — trigger column. "Save" button does `setValue` on `_save` (encodes object index + field name). Flow fires on `_save` change, reads `_edit`, patches the multiText via string replace, clears both helpers.

Formatter handles display + click; Flow handles JSON mutation. No modal, no form.

---

## 6. Universal JSON Parser V2 (Dynamic Sub-Extraction Pattern)

Schema-agnostic column formatter that renders structured JSON from a multiline text column as native CSS tables. Supersedes the legacy Standardized/AST approach with a vastly more robust pipeline featuring recursive Level 3 object extrusion and auto-promotion of sibling properties.

> **Reference implementation:** `Formatters/src/JsonParser_V2.ts` → `Formatters/dist/JsonParser_V2.json`

### Data Contract

Root shape: **Array of single-key objects** (minified, string-only values).

```json
[{"Section":{"Key":"Val","Key2":"Val2"}},{"Metrics":["A","B","C"]},{"KPIs":{"Sub1":{"k":"v"},"Sub2":{"k":"v"}}}]
```

**Constraints:**
- String-only values (no numbers, booleans, nulls)
- Minified (no whitespace)
- No escaped quotes in values
- No `}`, `{`, `]`, `[` characters in values
- Each root object has EXACTLY one key

### Supported Level Constraints & Chunk Types

| Depth | Type | Shape | Detection | Rendering |
|---|---|---|---|---|
| **Level 1** | Root Outer Element | `[ {...} ]` | Outer Array | Root groupings separated by `_#S#_` |
| **Level 2** | Flat Object | `{"Key":{"k":"v"}}` | Extracted before `:{` | 2-col key-value table inside root tree |
| **Level 2** | Keyed Array | `{"Key":["a","b"]}` | `indexOf(":[")` | Horizontal tag pill cells |
| **Level 2/3** | Nested Objects | `{"Key":{"sub":{"k":"v"}}}` | Contains `:{` tail object | Multi-tiered L2 header groups with L3 enclosed inset tables |

> **Sibling Auto-Promotion Rule:** If a payload dictates consecutive sibling Level 3 objects side-by-side inside the same Level 2 object (`{"Platform": {"LB": {"A":"1"}, "Proxy": {"B":"2"}}}`), the V2 engine automatically **chunks them up**, promoting subsequent objects into their own parallel Level 2 Nested Tables.

### Parsing Pipeline ("Tail-Extraction")

1. **Root isolation:** `split(..., '_#S#_')` separates core root bundles.
2. **Chunking Split:** `},"` splits deep object stacks within the bundle.
3. **L2 Isolation:** `PREFIX` natively scrapes `Substring` before the first instance of `:{` inside the chunk, isolating pure L2 keys and string values.
4. **L3 Extrusion:** In the residual `NEST_DATA_STR`, `HAS_L3` identifies a trailing `:{`, slicing flat strings into the L2 iteration and passing the inner tail exactly into an enclosed, dynamically expanding L3 flex-table.
5. **Scoped tokenization:** Each depth tier gets its own `replaceAll` chain safely converting commas `_#C#_` and colons `_#K#_` without cross-pollinating into higher scopes.

### Token Markers

| Token | Purpose | Replaces |
|---|---|---|
| `_#S#_` | Section boundary (root split) | `},{"` |
| `_#R#_` | Row/sub-group boundary (nested) | `"},"` |
| `_#D#_` | Descent into sub-object | `":{"` |
| `_#K#_` | Key-value separator | `":"` |
| `_#C#_` | Cell/property separator | `","` |
| `##` | Sentinel for safe substring-to-end | appended via `+` |

### Iterator Names

All `forEach` iterators MUST have unique names (prefixed with `_` per project convention):

| Level | Iterator | Scope |
|---|---|---|
| Root | `_section` | One per root object chunk |
| Flat obj rows | `_kvp` | Key-value pairs within a flat object |
| Array cells | `_cell` | Items within a keyed array |
| Nested groups | `_grp` | Sub-object groups within a nested object |
| Nested props | `_prop` | Properties within a nested group |

### Escaping Guide (TypeScript Builder → JSON → SharePoint)

Expressions pass through **3 layers** of escaping:

1. **TypeScript template literal** (source file)
2. **JSON.stringify** (compile step)
3. **SharePoint expression engine** (runtime)

To match a `"` character in data:
- SP expression needs `"` inside single-quoted string: `'..."...'`
- JSON string needs `\"` (escaped for JSON)
- TypeScript needs plain `"` — `JSON.stringify` handles the rest

> [!CAUTION]
> **Never manually backslash-escape quotes** in TypeScript template literals for SP patterns. Writing `'},\\"'` produces the wrong pattern (`},"` instead of `},{"`).
> Just write `'},{"'` directly. `JSON.stringify` adds the `\"` automatically.

### Zero Whitespace Rule

All `forEach` + `split()` expressions MUST have **zero spaces** inside the `split()` parentheses. SharePoint's engine silently returns an empty array if any whitespace is present. This includes spaces around `+` operators (write `+4` not `+ 4`).

### Use Cases

- **Term custom property snapshots** — PA flow reads term properties, serializes as standardized JSON, stamps on list item. Formatter renders automatically.
- **Polymorphic activity streams** — single scratchpad column holds type-specific metadata (status changes, assignments, milestones). Same formatter, different shapes per row.
- **Project dashboards** — KPIs, workload summaries, and contributor data in one stamped payload.

### CSS Layout Notes

Layout decisions validated through peer review of the formatter's DOM structure in SharePoint's virtualized React scroll grid:

- **Block header above table body, not `table-caption`:** `table-caption` renders outside the table's principal border-box. In SharePoint's heavily nested CSS environment, this risks rogue margin collapsing, text clipping, and layout shifts during column resize. A `flex-column` → `block header` → `table body` stack creates an indestructible bounding box.

- **`width: 1%` on key cells (aggressive constraint):** Relying on `width: 100%` for the value cell alone is a "passive" trust of the browser's table layout algorithm. `width: 1%` + `white-space: nowrap` forces the layout engine's fallback: *"I cannot be 1% wide because the text is wider and cannot wrap, so I collapse to exact content width."* Zero ambiguity.

- **Pill badges for arrays (`flex-wrap` + `border-radius`):** `table-cell` per array item creates N columns that stretch the SharePoint column or trigger horizontal scrollbars. `flex-wrap` pills flow horizontally and cascade vertically when the column narrows — trading width for height. Also matches Fluent UI's native Tag/Chip pattern for M365 aesthetic consistency.

- **`div` over `span` for all cells:** `span` is intrinsically `display: inline`. Overriding to `table-cell` fights the browser's baseline stylesheet. SharePoint injects massive global CSS — starting from `div` (`display: block`) gives an unopinionated foundation where padding, borders, and margins behave predictably.

- **AST routing via multi-character boundaries, not single-char delimiters:** The split-first pipeline uses `},{"` (4 chars), `":{"`(4 chars), and `":["` (4 chars) as structural boundaries — not bare `:` or `,`. This is critical because user data values (e.g. `"Note":"Meeting at 3:00, rescheduled"`) contain colons and commas. Single-char `replaceAll` would destroy internal data. The `+4` index math in `substring(... +4, ...)` is not arbitrary — it's the exact character width of each boundary pattern, ensuring extraction starts precisely after the structural delimiter without consuming or losing data characters.

### Mandatory Limitations

1. **Minified JSON Only** — structural whitespace breaks token tracking.
2. **Strict Strings** — `"Age":"12"`, NOT `"Age":12`. Boundaries depend on quotes.
3. **Reserved Markers** — values must not contain `_#S#_`, `_#R#_`, `_#K#_`, or `_#C#_`.
4. **Mutually Exclusive Pill Groupings** — A "pill array" MUST be wrapped as an isolated element on its own root node, distinct from nested dictionary chunks.
