---
topic: spo-nosql
description: SPO-NoSQL v2.1 — JSON state storage in SharePoint multiline text columns, CRUD patterns, Universal JSON Parser V2, escaping guide.
sources:
  - .agent/skills/spo-nosql/SKILL.md
---

# SPO-NoSQL

Native JSON state management in SharePoint **Multiple lines of text (Plain Text)** columns. No external database, no Flow storage — just string manipulation.

---

## Storage Rules

1. **Array Baseline** — always `[{ }]` or `[]` or `''` when empty. Never a bare object.
2. **Strict Minification** — no structural whitespace, no `\n`.
3. **Unique IDs** — include a jitter suffix to prevent rapid-click `@now` collisions:
   ```
   "id":"' + toString(Number(@now)) + '_' + substring(toString(Number(@now) * 7), 0, 3) + '"
   ```
4. **Input Sanitization** — always `=replaceAll([$input], '"', '''')` before injecting user input. Double-quote injection breaks the multi-character parsing boundaries.

---

## Mutation Patterns (customRowAction setValue)

In a `forEach` loop, `[$obj]` is the inner KVP string. Reconstruct as `'{"' + [$obj] + '"}'` to target it safely.

### Append (FIFO)
```json
"JSONPayload": "=if([$JSONPayload] == '' || [$JSONPayload] == '[]', '[{\"' + [$TempKey] + '\":\"' + [$TempValue] + '\"}]', substring([$JSONPayload], 0, length([$JSONPayload]) - 1) + ',{\"' + [$TempKey] + '\":\"' + [$TempValue] + '\"}]')"
```

### Prepend (LIFO)
```json
"JSONPayload": "=if([$JSONPayload] == '' || [$JSONPayload] == '[]', '[{\"' + [$TempKey] + '\":\"' + [$TempValue] + '\"}]', '[{\"' + [$TempKey] + '\":\"' + [$TempValue] + '\"},' + substring([$JSONPayload], 1, length([$JSONPayload])))"
```

### Update (In-Place Property)
```json
"JSONPayload": "=replaceAll([$JSONPayload], '{\"' + [$obj] + '\"}', '{\"' + replaceAll([$obj], '\"s\":\"0\"', '\"s\":\"1\"') + '\"}')"
```

### Delete (3-Pass Comma Cascade)
```json
"JSONPayload": "=replaceAll(replaceAll(replaceAll([$JSONPayload], '{\"' + [$obj] + '\"},', ''), ',{\"' + [$obj] + '\"}', ''), '{\"' + [$obj] + '\"}', '')"
```
Pass order: middle/first (trailing comma) → last (leading comma) → only item (empty array result).

---

## Rendering — Basic forEach

```json
{
  "elmType": "div",
  "style": { "display": "=if([$JSONPayload] == '' || [$JSONPayload] == '[]', 'none', 'flex')", "flex-direction": "column", "gap": "8px" },
  "children": [{
    "elmType": "div",
    "forEach": "obj in split(replaceAll(replaceAll([$JSONPayload],'[{\"', ''),'\"}]',''),'\"},{\"')",
    "children": [{
      "elmType": "div",
      "forEach": "kvp in split([$obj],'\",\"')",
      "children": [
        { "elmType": "span", "txtContent": "=substring([$kvp], 0, indexOf([$kvp], '\":\"')) + ': '" },
        { "elmType": "span", "txtContent": "=substring([$kvp], indexOf([$kvp], '\":\"') + 3, length([$kvp]))" }
      ]
    }]
  }]
}
```

> Use basic forEach for flat KVP objects. For nested objects, arrays, or polymorphic payloads, use the Universal JSON Parser V2 (below).

---

## Safe Read Patterns

Since `indexOf` only takes 2 arguments, use the next key's delimiter as the end boundary. Pad `[$obj]` with `"` on both sides to handle edge keys.

```json
// Extract "t" (next key is "e")
"txtContent": "=substring('\"' + [$obj] + '\"', indexOf('\"' + [$obj] + '\"', '\"t\":\"') + 5, indexOf('\"' + [$obj] + '\"', '\",\"e\"'))"

// Extract last key "s"
"txtContent": "=substring('\"' + [$obj] + '\"', indexOf('\"' + [$obj] + '\"', '\"s\":\"') + 5, length('\"' + [$obj] + '\"') - 1)"

// Missing key guard
"txtContent": "=if(indexOf('\"' + [$obj] + '\"', '\"e\":\"') == -1, '', <extraction>)"
```

**Object count:** `length(split(toString([$field]), '},{'))` — N segments for N objects.

---

## Limits

| | Value |
|---|---|
| SPO render degradation | ~64,000 characters |
| Capacity | ~1,400 items at ~45 chars/entry |
| Concurrency | No OCC — last writer wins; 409 Conflict possible |
| vs Pipe-delimited | JSON: 1,400 items. Pipe: 2,600 items. Use JSON unless 2,500+ items required. |

---

## Universal JSON Parser V2

Schema-agnostic formatter for rendering structured JSON as native CSS tables. Reference implementation: `Formatters/src/JsonParser_V2.ts`.

**Data contract:** Array of single-key objects, string-only values, minified.
```json
[{"Section":{"Key":"Val"}},{"Metrics":["A","B"]},{"KPIs":{"Sub1":{"k":"v"}}}]
```

### Token Markers

| Token | Replaces | Purpose |
|---|---|---|
| `_#S#_` | `},{"` | Section boundary (root split) |
| `_#R#_` | `"},"` | Row/sub-group boundary |
| `_#D#_` | `":{"` | Descent into sub-object |
| `_#K#_` | `":"` | Key-value separator |
| `_#C#_` | `","` | Cell/property separator |
| `##` | — | Sentinel for safe substring-to-end |

### Iterator Names (all prefixed `_` per convention)

| Level | Iterator |
|---|---|
| Root | `_section` |
| Flat obj rows | `_kvp` |
| Array cells | `_cell` |
| Nested groups | `_grp` |
| Nested props | `_prop` |

All `forEach` iterators MUST have unique names — SharePoint does not scope them.

### Escaping Rule

**Never manually backslash-escape quotes** in TypeScript template literals for SP patterns. Write `'},{"'` directly — `JSON.stringify` adds the `\"` automatically. Writing `'},\\"'` produces the wrong pattern.

### Constraints

1. Minified JSON only — whitespace breaks token tracking
2. Strict strings — `"Age":"12"` not `"Age":12`
3. Reserved markers — values must not contain `_#S#_`, `_#R#_`, `_#K#_`, `_#C#_`
4. Mutually exclusive pill arrays — wrap pill arrays as isolated root-level nodes

---

## In-Place Mutation via Helper Columns

For click-to-edit a value inside a JSON string without a modal form:

- `_edit` — staging column; formatter pre-fills with current value, user edits directly
- `_save` — trigger column; "Save" button sets `_save` (encodes index + field name); Flow patches the multiText via string replace, clears both helpers
