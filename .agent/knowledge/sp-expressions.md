---
topic: sp-expressions
description: SP expression syntax, operators, the Zero Whitespace Rule, forEach, and structural constraints for SharePoint JSON formatters.
sources:
  - .agent/patterns/zero-whitespace-rule.md
  - .agent/skills/sharepoint-list-formatting/SKILL.md
lib-ref: lib/helpers.ts:sanitizeForCSOM
---

# SP Expressions

## What Is an SP Expression

Any JSON string value that begins with `=` is evaluated as a SharePoint expression. All other strings are literal text.

```json
"txtContent": "hello"              // literal — rendered as "hello"
"txtContent": "=[$Title]"          // expression — evaluates to field value
"display":    "=if([$X]=='','none','flex')"  // expression — conditional
"forEach":    "entry in split([$Tags],',')"  // NOT an expression — no "="
```

---

## Zero Whitespace Rule

> **Strip all spaces from SP expression strings, except spaces inside `'single-quoted literals'`.**

Spaces outside quoted literals cause **silent rendering failure** — the element renders nothing, with no error.

```json
// BAD — spaces around == and after commas
"display": "=if([$Status] == 'Active', 'flex', 'none')"

// GOOD
"display": "=if([$Status]=='Active','flex','none')"

// SAFE — space inside quoted literal is fine
"txtContent": "='Due: '+toLocaleDateString([$DueDate],'en-US')"
```

**In the TypeScript builder:** `sanitizeForCSOM()` strips spaces automatically on every `compile()` and `compileTile()` call. You can write readable expressions in `.ts` source — they are stripped on output.

**Hand-written JSON:** Must be stripped manually before deployment. When an element is completely invisible with no console errors, whitespace in expressions is the first thing to check.

---

## Operator Reference

### Arithmetic
`+` `-` `*` `/` `%`  — also used for string concatenation with `+`

### Comparison
`==` `!=` `<` `>` `<=` `>=`

### Logical
`||` `&&` `!`  — ternary: `condition ? trueVal : falseVal`

### Math Functions
`abs()` `floor()` `ceiling()` `pow()` `cos()` `sin()`

### String Functions
`indexOf(str, substr)` `lastIndexOf(str, substr)` `substring(str, start, length)`  
`startsWith(str, prefix)` `endsWith(str, suffix)` `replace(str, old, new)` `replaceAll(str, old, new)`  
`padStart(str, len, char)` `padEnd(str, len, char)`  
`toLowerCase(str)` `toUpperCase(str)`  
`toLocaleString()` `toLocaleDateString()` `toLocaleTimeString()`

### Array / Split Functions
`split(str, delimiter)` `join(arr, separator)` `length(arr)` `appendTo(arr, val)` `removeFrom(arr, val)`  
`indexOf(arr, val)`

### Date Functions
`Date(str)` `Number(date)` — convert date to milliseconds for math  
`@now` — current timestamp

### Other
`if(condition, trueVal, falseVal)` — nested `if()` for multi-branch logic  
`loopIndex(iteratorName)` — index of current forEach item  
`getUserImage(email, size)` — returns avatar image URL  
`getThumbnailImage(url, w, h)`  
`toString(val)`

---

## forEach Syntax

```json
"forEach": "varName in expression"
```

- `expression` is evaluated (split, field reference, etc.) — **no `=` prefix**
- Iterator variable referenced in children as `[$varName]` in expression context, or bare `varName` in `txtContent`
- Zero whitespace applies inside the split: `split([$Field],',')` not `split([$Field], ',')`

```json
// Correct — no space before delimiter
"forEach": "_tag in split([$Tags],';')"

// Correct — reference iterator in child expression
"txtContent": "=[$_tag]"
```

`wrapForEach(iteratorName, fieldRef, delimiter)` in `lib/helpers.ts` generates safe forEach expressions.

---

## Expression Depth Limit

Nested `if()` chains are proven stable to **10 levels**. Beyond that, SharePoint may silently fail to render. Use `buildConditionalChain()` (internal to components.ts) for status badge chains, which keeps nesting within limits.

---

## _comment Placement

`_comment` keys are **only safe inside `style` objects**. Anywhere else they cause rendering failures.

```json
// SAFE
"style": { "_comment": "this is fine", "display": "flex" }

// UNSAFE — breaks element rendering
"elmType": "div", "_comment": "this breaks"
```

`validate()` in `lib/helpers.ts` checks for this and warns at compile time.
