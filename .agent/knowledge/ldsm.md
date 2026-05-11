---
topic: ldsm
description: Lookdown State Machine — three-column architecture, implicit Backlog state, client-side state transitions, and CountRelated aggregation.
sources:
  - workspace/default_folder/default_folder/LDSM_Pattern.md
---

# Lookdown State Machine (LDSM)

A client-side, formatter-driven state machine implemented entirely in SharePoint JSON formatters. No Power Automate flows required for state transitions.

> Full specification: `workspace/default_folder/default_folder/LDSM_Pattern.md`

---

## Three-Column Architecture

Each work item type uses three parallel Lookup columns pointing to the same parent list:

| Column | Role | State |
|--------|------|-------|
| **Anchor** (e.g. `Project`) | Immutable parent relationship | Always populated |
| **Volatile 1** (e.g. `ProjectToDo`) | Populated with Anchor ID when "active" | Null = not active |
| **Volatile 2** (e.g. `ProjectDone`) | Populated with Anchor ID when "done" | Null = not done |

### Implicit States

| Anchor | Volatile 1 | Volatile 2 | State |
|--------|-----------|-----------|-------|
| Set | Null | Null | **Backlog** |
| Set | Set | Null | **To-Do** |
| Set | Null | Set | **Done** |
| Set | Set | Set | Invalid (avoid) |

The Backlog state requires no explicit column value — it is the absence of both volatiles.

---

## Implemented In TwFw

| List | Anchor | Volatile 1 | Volatile 2 |
|------|--------|-----------|-----------|
| Tasks | `Project` | `ProjectToDo` | `ProjectDone` |
| Projects | `Team` | `TeamWorking` | `TeamClosed` |

---

## State Transitions

Transitions happen via `setValue` `customRowAction` in formatters — no page reload, no Power Automate:

```json
{
  "customRowAction": {
    "action": "setValue",
    "actionInput": {
      "ProjectToDo": "=[$Project.lookupId]",
      "ProjectDone": ""
    }
  }
}
```

**Important:** Fields used for LDSM should be hidden from the standard edit form to prevent accidental corruption.

---

## CountRelated Aggregation

Parent items (e.g. Projects) use SharePoint's `CountRelated` attribute to get real-time child counts without Power Automate:

```xml
<Field Type="Integer" Name="TasksToDo" CountRelated="true" RelatedList="Tasks" RelatedField="ProjectToDo" />
```

This gives Projects instant `TasksToDo`, `TasksDone`, `TasksTotal` columns that update the moment a Task's volatile column changes.

**Rule:** CountRelated fields are read-only calculated aggregates. Do not attempt to set them via `setValue`.

---

## Formatter Pattern

LDSM formatters typically use `dualContainer()` for auth gating (owners can transition, viewers see read-only state), and `statusBadge()` to display the current state derived from which volatile is populated.

State display expression:
```ts
`=if([$ProjectDone.lookupId]!='','Done',if([$ProjectToDo.lookupId]!='','To-Do','Backlog'))`
```
