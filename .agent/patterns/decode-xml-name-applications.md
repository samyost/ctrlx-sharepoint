---
pattern: decode-xml-name-applications
description: Generic JSON key-value extraction and AuditDiff at runtime using undocumented DecodeXmlName() / EncodeXmlValue() Power Automate expressions.
tags: [power-automate, xml, json, introspection, audit]
---

> **Consolidated** — this pattern has been absorbed into [`.agent/knowledge/pa-routing.md`](../knowledge/pa-routing.md). This file is kept for reference.

# DecodeXmlName Application Patterns

Techniques enabled by the undocumented `DecodeXmlName()` / `EncodeXmlValue()` Power Automate expressions for working with unknown or variable JSON structures at runtime.

> **Source**: [Eliot Cole — DecodeXmlName()](https://www.linkedin.com/pulse/using-decodexmlname-iterate-over-json-object-key-property-eliot-cole-8jtee), comment on [John Liu's chunk() post](https://johnliu.net/blog/2026/2/flow-crazy-string-replacement-patterns)

## Core Technique: Generic JSON Key-Value Extraction

Extract all key-value pairs from **any** JSON object without knowing property names at design time.

### Steps

1. **Wrap JSON in a root** for XML conversion:

    ```text
    addProperty(json('{}'), 'root', json(yourJsonString))
    ```

2. **Convert to XML, xpath to get all children**:

    ```text
    xpath(xml(addProperty(json('{}'), 'root', json(yourJsonString))), '/root/*')
    ```

3. **Select to extract key-value pairs**:
    - Key: `DecodeXmlName(xpath(item(), 'name(/*)'))`
    - Value: `xpath(item(), 'string(/*)')` or navigate original JSON with `?[DecodeXmlName(...)]`

Result: a generic array of key-value pairs from any shape of JSON.

---

## Application: SPO-NoSQL Introspection

When using the SPO-NoSQL pattern (JSON stored in SharePoint multiline text columns), different records can have different JSON shapes. `DecodeXmlName()` enables:

- **Rendering dynamic property tables** in Smart Gateway — "show all fields on this record" without knowing what fields exist
- **Diffing two JSON blobs** to detect what changed between versions
- **Searching across heterogeneous records** — finding records where any key matches a search term

**Primary candidates**: Connections list and any list using flexible metadata blobs.

---

## Application: Generic AuditDiff Child Flow

A single reusable child flow that diffs **any** two JSON snapshots and returns what changed.

### Inputs

- `BeforeJSON` — snapshot before update
- `AfterJSON` — snapshot after update

### Logic

1. Extract all keys from After using XML conversion trick
2. For each After key, compare `Before?[key]` vs `After?[key]`
3. If values differ → `{"field": "status", "from": "Active", "to": "Complete"}`
4. If key only exists in After → `{"field": "dueDate", "action": "added", "value": "2026-03-15"}`
5. Filter to keep only changed entries

### Output

```json
[
  { "field": "status", "from": "Active", "to": "Complete" },
  { "field": "dueDate", "action": "added", "value": "2026-03-15" }
]
```

### Before/After Strategy

Use a **shadow column** (`_PreviousState` multiline text) on the list item. On each update:

1. Read current `_PreviousState` as "Before"
2. Build current state as "After"
3. Run AuditDiff
4. Overwrite `_PreviousState` with "After"

### Rendering

Feed the change array into the Split-Twice template engine for human-readable log entries:

> "2 fields changed: **status** Active → Complete, **dueDate** added (2026-03-15)"

---

## Application: Term Store Custom Properties as Config Store

Term Store custom properties are unstructured key-value bags — each term can have different properties. `DecodeXmlName()` makes them generically readable.

### Pattern: Term-Driven Configuration

Different Location terms carry different custom properties:

```json
// Gulf Coast Refinery
{ "SiteContact": "jones@mpc.com", "PlantCode": "GRB", "TimeZone": "CST" }

// Midwest Terminal
{ "SiteContact": "smith@mpc.com", "TerminalCode": "MWT", "Capacity": "250000" }
```

### Flow Logic

1. Request comes in tagged with a Location term
2. Flow resolves the term via REST API
3. **Generically extracts all custom properties** (no hardcoded list)
4. Stamps them into a JSON blob on the Request/Project item
5. Smart Gateway renders whatever properties exist

### Benefits

- **Zero-maintenance**: Add a new custom property to a term → it flows through automatically
- **Location-specific metadata**: Different locations surface different info, no flow changes
- **Auditable**: Combine with AuditDiff to track when term properties change over time

---

## Related Patterns

- [split-twice-template-engine](split-twice-template-engine.md) — token-level template hydration
- [chunk-character-replacement](chunk-character-replacement.md) — character-level encoding (includes EncodeXmlValue reference)
- [hierarchical-term-routing](hierarchical-term-routing.md) — dynamic team routing and subtree subscriptions via TaxonomyHiddenList PathOfTerm
- SPO-NoSQL skill — JSON state management in SharePoint multiline text columns
