---
pattern: split-twice-template-engine
description: Loop-free Power Automate token replacement using handlebar-style {{token}} syntax — no Apply-to-Each.
tags: [power-automate, templates, string-manipulation]
---

> **Consolidated** — this pattern has been absorbed into [`.agent/knowledge/pa-string-ops.md`](../knowledge/pa-string-ops.md). This file is kept for reference.

# Split-Twice Template Engine Pattern

A loop-free, zero-second Power Automate technique for token replacement in strings using handlebar-style `{{token}}` syntax. Replaces tokens from a dictionary lookup without any Apply-to-Each.

> **Source**: [John Liu — Flow lightweight fast template engine using Split twice](https://johnliu.net/blog/2026/2/flow-lightweight-fast-template-engine-using-split-twice)

## How It Works

Given template: `"ABC {{def}} GHI {{jkl}} MN"` and a Dictionary compose `{"def":"fish 🐟","jkl":"chips 🍟"}`

### Step 1 — Split on `{{`

```
split(outputs('Template'), '{{')
```
Result: `["ABC ", "def}} GHI ", "jkl}} MN"]`

### Step 2 — Split each item on `}}`  (Select action)

```
from:  split(outputs('Template'), '{{')
map:   split(item(), '}}')
```
Result: `[["ABC "], ["def", " GHI "], ["jkl", " MN"]]`

### Step 3 — Conditional dictionary lookup (Select action)

```
if(
  equals(length(item()), 2),
  concat(outputs('Dictionary')?[item()?[0]], item()?[1]),
  item()?[0]
)
```

**Key insight**: If the sub-array has **2 elements**, element `[0]` is the token key → look it up in the dictionary. If it has **1 element**, it's literal text — pass through.

### Step 4 — Join

```
join(body('Select'), '')
```
Result: `"ABC fish 🐟 GHI chips 🍟 MN"`

## Case-Insensitive Tokens

Wrap the key in `toLower()`:

```
outputs('Dictionary')?[toLower(item()?[0])]
```

## Use Cases

- Dynamic email notification templates
- Server-side HTML rendering for Smart Gateway responses
- Merge-field replacement in Dataverse text columns
- Activity log entry templating (e.g., `"{{Actor}} assigned {{Task}} to {{Assignee}}"`)
- Dynamic document generators

## Why This Beats Alternatives

| Approach | Loops | Speed | Complexity |
|---|---|---|---|
| **Split-Twice** | None | ~0 sec | Medium (expressions) |
| Apply-to-Each + Replace | O(N) | 5–30 sec | Low |
| Nested `replace()` calls | None | ~0 sec | Brittle (hard-coded per token) |

## Related Patterns

- [friendly-date-formatter](friendly-date-formatter.md) — expression-heavy formatting example
