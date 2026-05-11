---
description: Enforces the Builder Pattern workflow for SharePoint JSON formatting in this repo.
---

# Formatting Rules — Builder Pattern Enforcement

These rules are **mandatory** for any AI agent working in this repository.

## Core Workflow

```
lib/theme.ts + lib/components.ts + lib/types.ts
         ↓
   src/MyScript.ts  (builder)
         ↓
   npx tsx Formatters/src/MyScript.ts
         ↓
   dist/MyScript.json  (compiled)
         ↓
   pwsh -File Scripts/Deploy-Format.ps1 -JsonFile Formatters/dist/MyScript.json -ListName X -FieldName Y
```

## Rules

### 1. Never Write Raw JSON
- **NEVER** create or edit `.json` files in `Formatters/` directly. They are compiler output.
- Always write a `.ts` builder script in `Formatters/src/`.
- The builder imports primitives, components, helpers, and theme from `'../lib'` — `index.ts` re-exports the full public surface.

### 2. Always Use TypeScript
- All builder scripts and library files use `.ts` extension.
- Use the `SPElement` interface from `lib/types.ts` for all formatter nodes.
- Run with `npx tsx` (zero-config TypeScript execution).

### 3. Use the Theme Library
- **ALWAYS** use `theme.cssClass()` or `theme.msClass()` for colors in `style` and `attributes.class`.
- Hex values from `theme.colors` are acceptable ONLY in: SVG fills, Power Automate, external integrations.
- Never hardcode hex colors that aren't in `theme.colors`.

### 4. Use the Library
Before writing raw JSON nodes, check if the lib already covers it. Current inventory:
- **Layout primitives** (`primitives.ts`): `VStack`, `HStack`, `Box`, `Text`
- **SP component factories** (`components.ts`): `statusBadge`, `persona`, `userAvatar`, `inlineEdit`, `pillsBadge`, `breadcrumbPath`, `columnRef`, `memberCountBadge`, `emptyState`, `dualContainer`, `actionCluster`, `revLabel`, `progressSpinnerFlat`, `dataTable`, `button`, `flexContainer`, `cardRoot`
- **Tile builder** (`quadrant.ts`): `buildQuadrantTile()` for 2×2 gallery cards

See `Formatters/lib/GUIDE.md` for the decision tree. If a new reusable pattern emerges, add it to the appropriate lib file — don't duplicate.

### 6. Compile to /dist
- Run `npx tsx Formatters/src/YourScript.ts` to produce output in `Formatters/dist/`.
- The `compile()` function from helpers handles validation, sanitization, and file writing.
- **Workflow:** Use `/scaffold-formatter` when creating a new builder script to get the correct boilerplate and imports.

### 7. Deploy via Script (Columns & List Views ONLY)
- **NEVER** paste Column JSON or standard List View JSON into SharePoint's Advanced Mode editor. Always deploy via a PowerShell script that uses direct CSOM. See `.agent/knowledge/deployment.md` and the `/deploy-formatter` workflow for the canonical PnP + CSOM pattern.
- **GALLERY VIEWS EXCEPTION:** You **CANNOT** deploy Gallery View formatters programmatically via CSOM or PnP. SharePoint will silently revert them on page load. **Gallery View JSON MUST be copied from `dist/` and pasted into Advanced Mode in the SharePoint UI by the human user.** If you compile a Gallery View, DO NOT attempt to script its deployment. Instead, halt and explicitly ask the user to copy/paste the JSON to avoid getting stuck in a silent-failure loop.
- **CSOM Throttling:** When deploying formatters to multiple columns or views in a loop using CSOM, you **MUST** insert a hard delay (e.g., `Start-Sleep -Seconds 1`) between iterations to prevent SharePoint from throwing 429 Throttling exceptions, because bypassing PnP cmdlets also bypasses their built-in retry logic.
- **Workflow:** Use `/deploy-formatter` for the exact compilation and deployment execution sequence.
- **Workflow:** Use `/troubleshoot-pnp` if you encounter "Access Denied" or Microsoft Graph conditional access errors during deployment.

### 9. CSOM Encoding
- Avoid Unicode characters in JSON strings — use ASCII equivalents.

### 10. `_comment` Safety
- `_comment` is **ONLY safe inside `style` objects**.
- Never place `_comment` as a sibling to `elmType`, `children`, or `attributes`.

### 11. Type Safety

- All new component factories must define their return type as `SPElement`.
- New config interfaces go in `lib/types.ts`.
- Use `as const` assertions for literal string values in `elmType`.

### 15. Inline Edit Safety

- `inlineEditField` **only works** on Text (single-line, multi-line) and Person fields.
- **ALWAYS** use the `inlineEdit()` factory — never write raw `inlineEditField` nodes.
- The factory prevents the **Visibility Lock-Out Bug**: if you conditionally hide an inline-edit container when the field is empty, users can never click it to enter the first value.
- The factory keeps the container **always visible** with a placeholder like `'Add update...'`.
- `inlineEditField` works in column formatters and `customCardProps` — NOT in `rowFormatter`.

### 16. Gallery/Tile Card Container Pattern

- **ALWAYS** use the three-layer SP card container structure for gallery/tile view formatters:
  1. **Outer:** `sp-card-container` — root wrapper (selection, focus ring)
  2. **Click blocker:** `sp-card-defaultClickButton` with `"customRowAction": {"action": ""}` — suppresses default edit form
  3. **Inner:** `sp-card-subContainer` + `sp-card-borderHighlight` + `ms-bgColor-white` + `sp-css-borderColor-neutralLight` — visible card chrome
- The click blocker must be a **sibling before** the subContainer, never nested inside it.
- All your custom layout goes **inside** the subContainer.
- Use `"action": "editProps"` instead of `""` if you *want* the edit form on click.

---

## Column Formatter Reference Architecture

### 12. Real Columns vs. UI Columns

Every formatter must target the **right kind** of column:

| Column Type | When to Format | Examples |
|---|---|---|
| **Real data column** | The formatter is **self-contained** — it only reads `@currentField` or very few related fields, and it looks fine inside an Edit Form panel. | Status badge on `[$Status]`, date pill on `[$DueDate]` |
| **Dummy UI column** | The formatter is **composite** — it reads many fields, has action clusters, or would look confusing in an Edit Form context. | `ProjectUI`, `TaskBoardUI`, `AssignedToUI` |

**Rules for dummy UI columns:**
- Create as a **Calculated column** with formula `="'"` (single quote) — produces a blank canvas.
- Name with a `UI` suffix: `ProjectUI`, `TaskUI`, `AssignedToUI`, `TaskStateUI`.
- **General-purpose** UI columns (e.g., `ProjectUI`) combine multiple field references into a full "card" layout.
- **Field-specific** UI columns (e.g., `AssignedToUI`) focus on presenting one domain object (person, status) with richer interactivity than the raw column allows.

### 13. columnFormatterReference Strategy

Use `columnFormatterReference` to **reuse** column formatters inside other contexts:

```
Column Formatter (source)     →  Referenced by
─────────────────────────────────────────────────
AssignedToUI column formatter →  rowFormatter, customCardProps
TaskStateUI column formatter  →  ProjectUI column formatter
Status column formatter       →  Gallery tile card
```

**Rules:**
- A column used via `columnFormatterReference` **must be added to the view** (even if hidden/narrow) — otherwise the reference renders blank.
- Wrap references in a sanitization div to isolate layout flow:
  ```typescript
  columnRef('[$FieldName]')  // use the helper from components.ts
  ```
- **Never duplicate** formatter logic across columns. If two views need the same status badge, put it on a column and reference it.

### 14. Builder Script Naming Convention

Builder scripts in `src/` follow `{List}_{Column}.ts` so the source file mirrors its deployment target:

| Script | Targets | Type |
|---|---|---|
| `MyList_ItemUI.ts` | `ItemUI` column on `MyList` | Dummy UI column |
| `MyList_AssignedToUI.ts` | `AssignedToUI` column on `MyList` | Field-specific UI column |
| `MyList_BoardView.ts` | A view formatter on a list view | View formatter |
| `All_StatusBadge.ts` | A `Status` column reused across multiple lists | Real data column |

