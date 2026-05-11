---
pattern: chunk-character-replacement
description: Loop-free per-character string transformation in Power Automate using chunk() + Select + coalesce() for HTML escaping and sanitization.
tags: [power-automate, string-manipulation, html-escaping, xml]
---

> **Consolidated** — this pattern has been absorbed into [`.agent/knowledge/pa-string-ops.md`](../knowledge/pa-string-ops.md). This file is kept for reference.

# Chunk Character Replacement Pattern

A loop-free Power Automate technique for **character-level** string transformation using `chunk()` + `Select` + `coalesce()`. Ideal for HTML escaping, sanitization, and any per-character mapping.

> **Source**: [John Liu — character replace pattern with chunk()](https://johnliu.net/blog/2026/2/flow-crazy-string-replacement-patterns)

## How It Works

**Core insight**: `string → array → transform → join`. `Select` is a `map()` function.

### Step 1 — Break string into character array

```text
chunk(outputs('Compose'), 1)
```

Each character becomes its own array element.

### Step 2 — Map each character via Select

```text
Select
  from:   chunk(outputs('Compose'), 1)
  map:    coalesce(
            if(equals(item(), '&'), '&amp;', null),
            if(equals(item(), '<'), '&lt;', null),
            if(equals(item(), '>'), '&gt;', null),
            if(equals(item(), '"'), '&quot;', null),
            if(equals(item(), ''''), '&#39;', null),
            item(),
            null
          )
```

`coalesce()` returns the first non-null value — so the first matching `if()` wins, otherwise pass through the original character.

### Step 3 — Reassemble

```text
join(body('Select'), '')
```

## Why This Beats Nested `replace()`

| | Nested `replace()` | `chunk()` + `Select` |
| --- | --- | --- |
| **Readability** | Deeply nested, unreadable | Clear per-character rules |
| **Order safety** | Can double-encode (`&` → `&amp;` → `&amp;amp;`) | Each char processed independently |
| **Extensibility** | Add another wrapping layer | Add another `if()` line |
| **Debugging** | Which layer broke? | Inspect the Select output |

## Bonus: XML Encode/Decode Functions

Eliot Cole [discovered](https://www.linkedin.com/pulse/using-decodexmlname-iterate-over-json-object-key-property-eliot-cole-8jtee) four undocumented expressions that handle XML encoding/decoding natively:

| Function | Purpose |
| --- | --- |
| `EncodeXmlName()` | Encode a string for use as an XML element name |
| `EncodeXmlValue()` | Encode a string for use as an XML element value (escapes `<`, `>`, `&`, `"`, `'`) |
| `DecodeXmlName()` | Decode an XML-encoded element name back to original |
| `DecodeXmlValue()` | Decode an XML-encoded value back to original |

**For HTML escaping specifically**, `EncodeXmlValue()` may replace the entire `chunk()` pattern in a single expression:

```text
EncodeXmlValue(outputs('Compose'))
```

### DecodeXmlName() for JSON Key Iteration

The killer use case: iterate over **unknown JSON object keys** without knowing property names ahead of time.

1. Wrap the JSON object in a root → convert to XML → xpath to get child nodes as array
2. In `Select`, use `DecodeXmlName(xpath(item(), 'name(/*)'))`  to get each key name
3. Use that decoded name to dynamically navigate the original JSON: `?[DecodeXmlName(...)]`

### JSON `@`-Prefix Keys → XML Attributes

When converting JSON to XML via `xml()`, any key starting with `@` becomes an XML attribute on its parent element ([source](https://www.linkedin.com/pulse/insert-attributes-xml-power-automate-logic-apps-json-eliot-cole-pul4c)):

```json
{ "a": { "@href": "startpage.com", "span": "startpage" } }
```

Converts to:

```xml
<a href="startpage.com"><span>startpage</span></a>
```

## Use Cases

- **HTML escaping** user input before injecting into email templates
- **Sanitizing** AI-generated text, Dataverse fields, or Excel values before PDF/HTML rendering
- **Dynamic JSON key iteration** — processing objects with unknown/variable property names
- **Building XML documents** with attributes from JSON in Power Automate

## Related Patterns

- [split-twice-template-engine](split-twice-template-engine.md) — token-level `{{key}}` replacement (different granularity)
- XPath Join pattern — existing KI technique for array flattening
