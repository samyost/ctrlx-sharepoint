---
pattern: zero-whitespace-rule
description: SP expression strings ("=...") fail silently when they contain spaces outside of single-quoted string literals. All spaces must be stripped before deployment.
tags: [sharepoint, formatting, deployment, csom, gotcha]
---

> **Consolidated** — this pattern has been absorbed into [`.agent/knowledge/sp-expressions.md`](../knowledge/sp-expressions.md). This file is kept for reference.

# Zero Whitespace Rule

SharePoint's expression parser is whitespace-sensitive. Any space outside of a single-quoted string literal inside an `"=..."` expression will cause the element to silently fail — it renders nothing, with no error.

## The Rule

> **Strip all spaces from SP expression strings, except spaces inside `'single-quoted literals'`.**

## Bad vs Good

```json
// BAD — spaces around == and after commas cause silent failure
"display": "=if([$Status] == 'Active', 'flex', 'none')"

// GOOD — no spaces outside quoted literals
"display": "=if([$Status]=='Active','flex','none')"
```

```json
// BAD
"txtContent": "='Due: ' + toLocaleDateString([$DueDate], 'en-US')"

// GOOD — space inside the quoted string 'Due: ' is safe; spaces outside are removed
"txtContent": "='Due: '+toLocaleDateString([$DueDate],'en-US')"
```

## What Counts as an SP Expression

Only JSON string values that begin with `=`. All other strings (static text, forEach expressions, field references used as identifiers) are unaffected.

```json
"forEach": "entry in split([$Tags], ',')"   // NOT an expression — spaces fine here
"txtContent": "=[$Title]"                    // IS an expression — spaces would break it
"display": "=if([$X]=='','none','flex')"     // IS an expression
```

## In the TypeScript Builder

`sanitizeForCSOM()` in `lib/helpers.ts` handles this automatically during `compile()` and `compileTile()`. Any expression string written in TypeScript source will have spaces stripped on output — **you do not need to write spaces-free expressions in `.ts` files**.

```ts
// This is fine in source — sanitizeForCSOM strips the spaces on compile
style: { display: `=if(${fieldRef} == '', 'none', 'flex')` }
```

## Hand-Written JSON (Deploy Without Compiler)

If you write or edit a formatter JSON file directly and deploy it via PnP without going through `compile()`, you must strip spaces manually. CSOM can also introduce additional corruption of expression strings during deployment — the safest path is always to go through the TypeScript builder.

## Debugging Tip

If a formatted element is completely invisible and there are no console errors, the first thing to check is whitespace in expressions. Copy the `"=..."` value and search for any space character that is not inside single quotes.
