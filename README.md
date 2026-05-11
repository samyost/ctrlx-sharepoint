# CTRLx SharePoint

TypeScript builder pattern for SharePoint Online list, column, and view formatters — plus an agent-consumable knowledge base for working with SharePoint and Power Automate.

The library lets you write formatters as composable TypeScript instead of hand-edited JSON. The `.agent/` tree gives Claude (and other coding agents) the context to use it productively without re-deriving SharePoint's quirks every session.

---

## What's in here

| Path | Purpose |
|---|---|
| `Formatters/lib/` | The typed builder library — primitives, component factories, theme tokens, the `compile()` pipeline |
| `Formatters/lib/GUIDE.md` | Decision tree for "which factory do I reach for?" |
| `Formatters/src/Demo_*.ts` | Annotated example formatters showing the full pipeline |
| `Formatters/tsconfig.json` | TypeScript config for the builder |
| `.agent/rules/` | Hard project conventions |
| `.agent/knowledge/` | Domain notes — SP expressions, dates, aggregates, deployment, NoSQL patterns, Power Automate string ops / routing / actions |
| `.agent/patterns/` | Reusable techniques — zero-whitespace rule, SP card hover, friendly date formatter, split-twice template engine, dynamic aggregate math, hierarchical term routing, ... |
| `.agent/skills/` | Packaged how-tos invocable by name — `sharepoint-list-formatting`, `pnp-deployment`, `theme-colors`, `ctrlx-ontology`, ... |
| `.agent/workflows/` | Multi-step playbooks — scaffold a formatter, deploy a formatter, troubleshoot PnP |
| `CLAUDE.md` | Agent operating instructions for this workspace |

---

## Quick start

```bash
git clone https://github.com/samyost/ctrlx-sharepoint.git
cd ctrlx-sharepoint
npm install
```

Build a formatter (compile a `.ts` source into JSON under `Formatters/dist/`):

```bash
npx tsx Formatters/src/Demo_ProjectCard.ts
```

Then either paste `Formatters/dist/Demo_ProjectCard.json` into the SharePoint column or view formatter dialog, or deploy via PnP PowerShell — see `.agent/knowledge/deployment.md`.

---

## Library overview

| Layer | File | Purpose |
|---|---|---|
| Primitives | `primitives.ts` | `VStack`, `HStack`, `Box`, `Text` — flex layout with theme-token props |
| Components | `components.ts` | SP-specific factories: `statusBadge`, `persona`, `userAvatar`, `actionCluster`, `inlineEdit`, `pillsBadge`, `breadcrumbPath`, `dualContainer`, `revLabel`, ... |
| Quadrant tiles | `quadrant.ts` | `buildQuadrantTile()` — 2×2 gallery card with identity / state / details / actions zones |
| Theme | `theme.ts` | Spacing scale, color tokens, typography presets, status palettes |
| Helpers | `helpers.ts` | `compile()`, `compileTile()`, validation, expression sanitization |
| Types | `types.ts` | `SPElement`, `StatusMap`, `QuadrantConfig`, ... |
| Index | `index.ts` | Public surface — single import path |

All exports are reachable from `'../lib'`:

```ts
import { VStack, statusBadge, compile, theme } from '../lib';
```

See [`Formatters/lib/GUIDE.md`](Formatters/lib/GUIDE.md) for the full decision tree.

---

## Conventions

- **Never edit JSON in `Formatters/dist/` directly.** It's compiler output. Edit the `.ts` source and rebuild.
- **Zero-whitespace rule** for SP expressions — see `.agent/patterns/zero-whitespace-rule.md`. `compile()` sanitizes automatically, but it's a real SharePoint renderer constraint worth understanding.
- **PnP deployment** uses direct CSOM (`$field.CustomFormatter = [string]$json; $field.Update()`) rather than `Set-PnPField -Values`, which has known JSON parsing bugs in PnP v1.12.0. See `.agent/knowledge/deployment.md`.
- Full operating rules in `CLAUDE.md`.

---

## Working with agents

This repo is structured so a coding agent (Claude Code, Copilot, Antigravity, etc.) can pick up context from `CLAUDE.md` + `.agent/` on first read. The `.agent/skills/` and `.agent/workflows/` folders in particular are written as named, invocable procedures — point your agent at them by name when scaffolding new formatters or debugging deployments.

---

## License

MIT.
