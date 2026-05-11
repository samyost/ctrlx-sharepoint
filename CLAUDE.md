# Claude Code System Instructions

## Workspace Architecture & Constraints

You MUST adhere to the following environment rules:

1. **JSON Formatters (TypeScript Builder Pattern):** NEVER edit raw `.json` files in `Formatters/dist/` directly. They are compiler output. Always edit the corresponding `.ts` script in `Formatters/src/` and compile it with `npx tsx Formatters/src/YourScript.ts`.
2. **SharePoint Deployment (PnP):** Never run inline PowerShell deployment commands. Always write a `.ps1` script file and execute it.
3. **PnP Authentication & Execution:** Use PnP v1.12.0 with `-UseWebLogin`. When deploying formatters, use direct CSOM (`$field.CustomFormatter = [string]$json; $field.Update(); $ctx.ExecuteQuery()`) rather than `Set-PnPField -Values` — the latter has known JSON parsing bugs.
4. **Mandatory Logging:** Any PowerShell script executed should route its output to `.logs/deploy.log` so execution history is tracked.
5. **No Directory Changing:** NEVER use `cd` in terminal executions. Run all commands relative to the current working directory.
6. **No PowerShell Subexpressions in Terminal:** NEVER use PowerShell subexpressions like `(Get-Content ... | Measure-Object).Lines` or `$(...)` in terminal commands — they trigger security prompts. Use intermediate variables instead: `$result = Get-Content ... | Measure-Object -Line; $result.Lines`.

## Autonomy & Library Management

You have full architectural autonomy over the frontend engineering environment. You are explicitly encouraged to:

- **Manage the Library:** Create, refactor, or optimize helper functions, types, and patterns inside `Formatters/lib/`.
- **Refactor Sources:** Update `.ts` files in `Formatters/src/` to use new library patterns.
- **Traverse CFRs (Column Formatter References):** When updating a View Formatter that relies on `columnFormatterReference` (CFRs), hunt down and amend the underlying Column Formatter scripts directly. Do not trap yourself in a single file by building hacky overlays.
- **Improve Deployments:** Build more robust or reusable deployment tools in `Formatters/deploy/`.
- **Manage Dependencies:** Update `package.json` or `tsconfig.json` if new npm packages or build configuration adjustments are needed.

## Knowledge Base

This repo ships with a structured knowledge base under `.agent/`:

- `.agent/rules/` — hard project conventions
- `.agent/knowledge/` — domain notes (SP expressions, dates, aggregates, deployment, NoSQL patterns, Power Automate)
- `.agent/patterns/` — reusable techniques
- `.agent/skills/` — named, invocable how-tos
- `.agent/workflows/` — multi-step playbooks

Consult these before re-deriving SharePoint quirks from scratch. `Formatters/lib/GUIDE.md` is the canonical decision tree for "which factory do I reach for?"

## Autonomy

Proceed autonomously on all tasks. Do not ask for confirmation before acting. Execute directly unless a destructive operation (delete, force-push, drop table) is genuinely irreversible.
