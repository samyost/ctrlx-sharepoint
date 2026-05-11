---
topic: pa-routing
description: PA hierarchical routing — TaxonomyHiddenList PathOfTerm for most-specific team match and subscription fan-out; DecodeXmlName for generic JSON key extraction and AuditDiff.
sources:
  - .agent/patterns/hierarchical-term-routing.md
  - .agent/patterns/decode-xml-name-applications.md
---

# PA Routing

---

## Hierarchical Term Routing

Route requests and notify subscribers based on taxonomy ancestry — no Term Store API round-trips.

### Core Concept: PathOfTerm

Every term used on the site is auto-cached in the `TaxonomyHiddenList` with a full semicolon-delimited ancestor path:

```text
Location;West;South-West;Compressor Field X;Compressor Station 7
```

`split(PathOfTerm, ';')` gives an ordered array from root to leaf. All routing reduces to:

> "Does any segment of this term's ancestor path match a stored subscription/team?"

**REST call to get PathOfTerm:**
```text
/_api/web/lists/getByTitle('TaxonomyHiddenList')/items?
  $filter=IdForTerm eq '{termGuid}'
  &$select=Term,PathOfTerm
```

---

### Pattern 1: Dynamic Team Routing (Most-Specific Match)

Route an incoming request to the closest matching team in the hierarchy.

**Setup:** Teams list has an `Area` column (same term set). Sub-Team Bravo → Area: `South-West`. Team Alpha → Area: `West`.

**Flow:**
1. Get PathOfTerm for the request's Location term (one REST call)
2. `reverse(split(PathOfTerm, ';'))` — most-specific segment first
3. For each segment, check if any team's Area label matches
4. First hit wins — Bravo matches `South-West` before Alpha matches `West`

**Optimization — pre-fetch all teams:**
```text
Select
  from:   reverse(split(PathOfTerm, ';'))
  map:    filter(teamAreaLabels, equals(item(), segment))
```
First non-empty result = most-specific team. One query, no per-segment API calls.

---

### Pattern 2: Hierarchical Subscription (Subscribe to a Subtree)

A subscriber at a parent term gets notified about anything in its subtree.

**Flow:**
1. Get PathOfTerm segments for the request's Location
2. Get all subscriptions from the subscriptions source
3. Filter: any subscriber whose subscribed term appears **anywhere in the path array** is a match
4. Result: Supervisor (subscribed to `Compressor Field X`) AND VP (subscribed to `West`) both match `Compressor Station 7`

**Fan-out is natural** — the path array inherently contains all ancestors. One path comparison notifies local supervisor, area lead, and regional VP simultaneously.

---

### TaxonomyHiddenList vs Term Store API

| | Term Store API | TaxonomyHiddenList |
|---|---|---|
| Auth | Specific permissions | Regular list permissions |
| Speed | Multiple API calls | One REST call |
| Path pre-flattened | No | Yes |
| Available in PA | HTTP action + parsing | "Get items" |
| Caveat | Always up-to-date | Only terms used on site (moot for routing) |

---

### Flexible Subscription Storage

For variable per-subscriber metadata (notification preferences, escalation rules), store as JSON blobs in a multiline text column and use `DecodeXmlName()` to generically read whatever properties exist.

---

## DecodeXmlName Application Patterns

Generic JSON key extraction and AuditDiff using undocumented PA expressions.

### Core Technique: Generic Key-Value Extraction

Extract all KV pairs from **any** JSON object without knowing property names at design time:

```text
1. Wrap in root:   addProperty(json('{}'), 'root', json(yourJsonString))
2. XPath children: xpath(xml(addProperty(json('{}'), 'root', json(yourJsonString))), '/root/*')
3. Select:
   - Key:   DecodeXmlName(xpath(item(), 'name(/*)'))
   - Value: xpath(item(), 'string(/*)')
```

Result: generic array of key-value pairs from any JSON shape.

---

### Application: Generic AuditDiff Child Flow

A single reusable flow that diffs any two JSON snapshots.

**Inputs:** `BeforeJSON`, `AfterJSON`

**Logic:**
1. Extract all After keys using XML conversion
2. For each After key, compare `Before?[key]` vs `After?[key]`
3. Differ → `{"field": "status", "from": "Active", "to": "Complete"}`
4. New key → `{"field": "dueDate", "action": "added", "value": "2026-03-15"}`
5. Filter to keep only changed entries

**Before/After strategy:** Keep a `_PreviousState` shadow column on each list item. On update: read current as Before, build new state as After, diff, overwrite `_PreviousState` with After.

**Rendering:** Feed change array into the Split-Twice template engine for log entries:
> "2 fields changed: **status** Active → Complete, **dueDate** added (2026-03-15)"

---

### Application: Term Store Custom Properties as Config Store

Different Location terms carry different custom properties (heterogeneous shapes). `DecodeXmlName()` reads them generically.

**Flow:** Request tagged with a Location term → resolve term via REST → generically extract all custom properties (no hardcoded list) → stamp as JSON blob on the Request item → formatter renders whatever properties exist.

**Zero-maintenance:** Add a new custom property to a term → it flows through automatically, no flow changes needed.

---

### Parse JSON vs DecodeXmlName()

| | Parse JSON | DecodeXmlName() |
|---|---|---|
| Schema required? | Yes — fixed at design time | No — discovers keys at runtime |
| Enumerate keys? | No | Yes |
| Variable shapes? | Breaks | Works |
| Best for | Known, stable structures | Unknown/heterogeneous data |

These are complementary, not competing. Use Parse JSON for freeze types; use DecodeXmlName for discover types.
