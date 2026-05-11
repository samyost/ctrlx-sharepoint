---
pattern: hierarchical-term-routing
description: Route requests and fan-out notifications by matching against TaxonomyHiddenList PathOfTerm — no Term Store API round-trips.
tags: [power-automate, sharepoint, taxonomy, routing, subscriptions]
---

> **Consolidated** — this pattern has been absorbed into [`.agent/knowledge/pa-routing.md`](../knowledge/pa-routing.md). This file is kept for reference.

# Hierarchical Term Routing Pattern

Route requests to teams and notify subscribers based on taxonomy term ancestry, using the TaxonomyHiddenList's pre-flattened `PathOfTerm` to avoid Term Store API round-trips.

> **Context**: TwFw uses a site-level term group for Location taxonomy. Terms used on the site are auto-cached in the TaxonomyHiddenList with full ancestor paths.

## Core Concept: Path-Contains Matching

Every term in the TaxonomyHiddenList has a `PathOfTerm` field containing the full semicolon-delimited ancestry:

```text
Location;West;South-West;Compressor Field X;Compressor Station 7
```

`split(PathOfTerm, ';')` produces an ordered array from root to leaf. All routing and subscription logic reduces to one question:

> **"Does any segment of this term's ancestor path match a stored subscription?"**

No tree-crawling. No recursive API calls. One list query + one split.

---

## Pattern 1: Dynamic Team Routing (Most-Specific Match)

Route an incoming request to the **closest matching team** in the hierarchy.

### Setup

- Teams list has an `Area` column (Managed Metadata, same term set as Location)
- Team Alpha → Area: `West`
- Sub-Team Bravo → Area: `South-West`
- Request arrives with Location: `Compressor Station 7`

### Flow Logic

1. **Get the term path** — one REST call to TaxonomyHiddenList:

    ```text
    /_api/web/lists/getByTitle('TaxonomyHiddenList')/items?
      $filter=IdForTerm eq '{termGuid}'
      &$select=Term,PathOfTerm
    ```

2. **Split into segments**:

    ```text
    split(PathOfTerm, ';')
    → ["Location", "West", "South-West", "Compressor Field X", "Compressor Station 7"]
    ```

3. **Reverse the array** (most-specific first) — use the `reverse()` expression or build reversed via Select with index math

4. **For each segment, check Teams list** — does any team's Area label match this segment?

5. **First hit wins** — Sub-Team Bravo matches on `South-West` before Team Alpha matches on `West`

### Optimization: Pre-Fetch Teams

Instead of querying per segment, pre-fetch all teams with their Area values into a Select, then use the path array to find the deepest match:

```text
Select
  from:   reverse(split(PathOfTerm, ';'))
  map:    filter(teamAreaLabels, equals(item(), segment))
```

First non-empty result = most-specific team.

---

## Pattern 2: Hierarchical Subscription (Subscribe to a Subtree)

A supervisor subscribes to a parent term and gets notified about anything in its subtree.

### Setup

- Subscriptions stored in a list (or JSON blob) with the subscribed term label or GUID
- Supervisor Jones subscribes to `Compressor Field X`
- VP Smith subscribes to `West`
- Request arrives at `Compressor Station 7`

### Flow Logic

1. **Get the request's PathOfTerm** (same REST call as above)
2. **Split into segments** → `["Location", "West", "South-West", "Compressor Field X", "Compressor Station 7"]`
3. **Get all subscriptions** from the subscriptions source
4. **Filter**: any subscriber whose subscribed term appears **anywhere in the path array** is a match
5. **Result**: Both Jones (`Compressor Field X` ∈ path) and Smith (`West` ∈ path) get notified

### Fan-Out

One request can match multiple subscribers at different levels of the hierarchy — local supervisor, area lead, regional VP — all from a single path comparison. No fan-out logic needed; the path naturally contains all ancestors.

---

## TaxonomyHiddenList vs Term Store API

| | Term Store API | TaxonomyHiddenList |
| --- | --- | --- |
| **Auth** | Specific permissions required | Regular list permissions |
| **Speed** | Multiple API calls to walk tree | One REST call, path pre-flattened |
| **Caching** | None (live queries) | Auto-cached as terms are used on site |
| **Available fields** | Term GUID, Label | Term, PathOfTerm, IdForTerm, WssId |
| **Power Automate** | HTTP action + parsing | "Get items" or "Send HTTP to SharePoint" |
| **Caveat** | Always up-to-date | Only contains terms used on the site |

The caveat is moot for routing: any Location term tagged on a Request is by definition already cached in the TaxonomyHiddenList.

---

## Flexible Subscription Storage

If subscriptions carry variable metadata per subscriber (notification preferences, escalation rules, priority overrides), store them as JSON blobs in a multiline text column. Use `DecodeXmlName()` to generically introspect subscription properties at runtime without hardcoding the schema.

Example subscriber record:

```json
{
  "termGuid": "abc-123",
  "termLabel": "Compressor Field X",
  "notifyVia": "email",
  "escalateAfterHours": 4,
  "backupSubscriber": "smith@mpc.com"
}
```

Different subscribers can have different properties. The routing flow reads "whatever's there" generically.

---

## Parse JSON vs DecodeXmlName() — When to Use Which

| | Parse JSON | DecodeXmlName() |
| --- | --- | --- |
| **Schema required?** | Yes — fixed at design time | No — discovers keys at runtime |
| **Enumerate keys?** | No — must know property names | Yes — xpath returns all child elements |
| **Variable shapes?** | Breaks (schema mismatch) | Works on any shape |
| **Best for** | Known, stable structures | Unknown, amorphous, heterogeneous data |

**Complementary, not competing**: Parse JSON for stable schemas (freeze types). DecodeXmlName for unknown/variable schemas (discover keys).

---

## Related Patterns

- [decode-xml-name-applications](decode-xml-name-applications.md) — generic JSON introspection, AuditDiff, term config
- [split-twice-template-engine](split-twice-template-engine.md) — hydrate notification templates for subscription alerts
- [Taxonomy Hidden List Lookup KI](../../.gemini/antigravity/knowledge/sharepoint_data_lifecycle_patterns/artifacts/implementation/taxonomy_hidden_list_lookup.md) — WssId/IdForTerm lookup fundamentals
