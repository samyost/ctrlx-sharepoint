---
topic: sp-aggregates
description: Dynamic aggregate math in SP group headers — @group.count, @aggregates forEach, Number() coercion, and lookupValue for grouped person/lookup columns.
sources:
  - .agent/patterns/dynamic-aggregate-math.md
  - .agent/skills/sharepoint-list-formatting/SKILL.md
---

# SP Aggregates

## Group Header Variables

Available inside a group header formatter (View Settings → Group By):

| Variable | Value |
|----------|-------|
| `@group.count` | Total items in the group (integer) |
| `@group.fieldData` | The grouped field value (string for Choice/Text, object for Lookup/Person) |
| `@aggregates` | Array of `{ columnDisplayName, value }` objects for columns with Totals enabled |

---

## @aggregates forEach Pattern

To access a specific column's aggregate, iterate `@aggregates` and match by display name:

```json
{
  "elmType": "div",
  "forEach": "aggregate in @aggregates",
  "children": [{
    "elmType": "div",
    "style": {
      "display": "=if([$aggregate.columnDisplayName]=='Approved' && Number([$aggregate.value])<@group.count,'flex','none')"
    },
    "txtContent": "='Pending: '+(@group.count-Number([$aggregate.value]))"
  }]
}
```

---

## Critical Rules

### 1. Totals Must Be Enabled in the View
`[$aggregate.value]` is only populated for columns that have a **Totals aggregate** turned on in List View Settings (Count, Sum, etc.). If the aggregate is removed from the view, the pattern silently returns empty/hidden.

### 2. Match by Display Name — Not Internal Name
`[$aggregate.columnDisplayName]` targets the column's **Display Name** as shown in the view. If a site owner renames "Approved" to "Is Approved", the string match breaks silently.

### 3. Always Wrap in Number()
`[$aggregate.value]` is a string. Without `Number()`, the `+` operator concatenates instead of adding:

```json
// WRONG — string concatenation
"txtContent": "='Pending: '+(@group.count-[$aggregate.value])"

// CORRECT
"txtContent": "='Pending: '+(@group.count-Number([$aggregate.value]))"
```

### 4. forEach Only Fires With Data
If the group has no items or no aggregate is configured, the forEach loop does not execute.

---

## Pluralization Pattern

```json
"txtContent": "='has approval pending for '+Number(@group.count-Number([$aggregate.value]))+if(@group.count-Number([$aggregate.value])>1,' employees',' employee')"
```

---

## Grouped Lookup and Person Columns

When grouped by a Lookup or Person column, `@group.fieldData` is an object — rendering it directly shows `[object Object]`.

```json
// WRONG — renders as "[object Object]"
"txtContent": "@group.fieldData"
"txtContent": "@group.fieldData.displayValue"

// CORRECT
"txtContent": "@group.fieldData.lookupValue"
```

`lookupValue` reliably extracts the human-readable text (person display name, lookup item text).
