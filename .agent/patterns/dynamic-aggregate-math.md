---
pattern: dynamic-aggregate-math
description: Derive missing data sums (e.g. "Pending Approvals") dynamically in a group header by crossing @group.count with @aggregates.
tags: [sharepoint, formatting, group-header, aggregates, math]
---

> **Consolidated** — this pattern has been absorbed into [`.agent/knowledge/sp-aggregates.md`](../knowledge/sp-aggregates.md). This file is kept for reference.

# Dynamic Aggregate Math in Group Headers

This pattern demonstrates how to dynamically cross-reference a group's total item count (`@group.count`) with calculated column aggregates (`@aggregates`) to infer data that isn't explicitly calculated in a column (e.g., finding the number of "Pending" items by subtracting "Approved" items from the total).

## Key Rules & Validation Requirements

1. **View Configuration Dependency**: The calculation relies entirely on the View Settings. For `[$aggregate.value]` to exist, the targeted column (e.g., "Approved") **must have a Totals aggregate turned on** in the SharePoint List View Settings (e.g., Count or Sum). If removed from the view, the pattern breaks and returns empty/hidden.
2. **Display Name Fragility**: `[$aggregate.columnDisplayName]` targets the *Display Name* of the column, not its internal name. If a site owner renames the column ("Approved" -> "Is Approved"), the string matching inside the JSON will drop the value.
3. **Type Coercion**: You MUST wrap aggregate values in `Number()` before doing math operations (e.g., `Number([$aggregate.value])`). Without it, `+` operators might perform string concatenation instead of addition/subtraction.
4. **Data Availability**: The `foreach` loop (`aggregate in @aggregates`) will only trigger if there are actually items in the group and an aggregate calculation is present.

## Minimal Pattern

```json
{
  "elmType": "div",
  "forEach": "aggregate in @aggregates",
  "children": [
    {
      "elmType": "div",
      "style": {
        "display": "=if([$aggregate.columnDisplayName] == 'Approved' && Number([$aggregate.value]) < @group.count, 'flex', 'none')"
      },
      "txtContent": "='Pending actions: ' + Number(@group.count - Number([$aggregate.value]))"
    }
  ]
}
```

## Advanced Example (With Pluralization)

From a real grouped view setting where "Pending" items are calculated dynamically based strictly on the missing number between "Approved" items and total items:

```json
{
  "elmType": "div",
  "forEach": "aggregate in @aggregates",
  "children": [
    {
      "elmType": "div",
      "style": {
        "display": "=if([$aggregate.columnDisplayName] == 'Approved' && Number([$aggregate.value]) < @group.count, 'flex', 'none')",
        "flex-direction": "row"
      },
      "children": [
        {
          "elmType": "div",
          "txtContent": "='has approval pending for ' + Number(@group.count - Number([$aggregate.value])) + if(@group.count - Number([$aggregate.value]) > 1 , ' employees', ' employee')",
          "style": {
            "font-weight": "500"
          }
        }
      ]
    }
  ]
}
```

## Handling Lookup and Person Columns

When you group by a Lookup or Person column, `@group.fieldData` returns an object rather than a simple string. If you try to output `@group.fieldData` directly in a `txtContent` property, it will render as `[object Object]`.

To correctly render the grouped value for these complex types, you must use `.lookupValue`. (Note: using `.displayValue` will also result in `[object Object]`).

**Incorrect:**

```json
{
  "elmType": "span",
  "txtContent": "@group.fieldData"
}
```

**Incorrect (Still renders as Object):**

```json
{
  "elmType": "span",
  "txtContent": "@group.fieldData.displayValue"
}
```

**Correct:**

```json
{
  "elmType": "span",
  "txtContent": "@group.fieldData.lookupValue"
}
```

For Lookup and Person columns, this will reliably extract the human-readable text (e.g., the person's name or the text of the looked-up item) rather than the underlying array/object metadata.

