---
topic: sp-dates
description: Relative date display in SP formatters — two formula approaches (Monday-anchor vs rolling window), millisecond constants, and when to use each.
sources:
  - .agent/patterns/friendly-date-formatter.md
  - .agent/skills/sharepoint-list-formatting/SKILL.md
lib-ref: lib/quadrant.ts:buildRelativeDateElement
---

# SP Dates — Relative Date Display

## Two Formula Approaches

### Approach A: Rolling Window (simpler)
Used in `lib/quadrant.ts:buildRelativeDateElement`.

```
dayDiff = floor((Number(@now) - Number(Date([$Field]))) / 86400000)

=if(dayDiff < 1, 'today',
  if(dayDiff < 2, 'yesterday',
    if(dayDiff < 7, 'this week',
      if(dayDiff < 14, 'last week',
        if(dayDiff < 30, N + ' weeks ago',
          M + ' months ago')))))
```

- **"this week"** = within last 7 days (rolling, not calendar week)
- **"last week"** = 7–14 days ago
- Simpler math, slightly less precise
- Used in the quadrant tile's `relativeDate` render type

### Approach B: Monday-Anchor (calendar-precise)
From the `friendly-date-formatter` pattern. Uses `toLocaleDateString(@now)` to snap to midnight, then computes the actual Monday of the current week.

```
midnight = Date(toLocaleDateString(@now))
mondayThisWeek = midnight - ((Number(midnight)/86400000 + 4) % 7) * 86400000
mondayLastWeek = mondayThisWeek - 7 * 86400000

=if(field >= midnight, 'today',
  if(field >= midnight - 86400000, 'yesterday',
    if(field >= mondayThisWeek, 'this week',
      if(field >= mondayLastWeek, 'last week',
        if(dayDiff < 30, N + ' weeks ago',
          M + ' months ago')))))
```

- **"this week"** = since Monday 12:00 AM (true calendar week)
- More accurate for "this week" / "last week" boundaries
- More complex — inline epoch math for Monday offset

### Choosing Between Them

| | Rolling Window | Monday-Anchor |
|---|---|---|
| Complexity | Low | Medium |
| "This week" accuracy | Rolling 7 days | True calendar week |
| Implementation | `buildRelativeDateElement()` | Hand-code or copy pattern |
| Best for | Cards, tiles, quick-scan views | Update logs, weekly summaries |

---

## Millisecond Constants

| Constant | Value | Meaning |
|----------|-------|---------|
| `86400000` | 86,400,000 | 1 day |
| `604800000` | 604,800,000 | 1 week (7 days) |
| `2592000000` | 2,592,000,000 | 30 days |
| `2629746000` | 2,629,746,000 | ~1 month (average) |

---

## Integer Extraction from Division

SP has no `parseInt()`. To get the integer part of a division result (e.g. "3 weeks ago"):

```
= substring(toString(dayDiff / 7), 0, indexOf(toString(dayDiff / 7) + '.', '.'))
```

Appends `'.'` to guarantee `indexOf` finds one, then takes everything before it.

---

## Monday Offset Formula

`(Number(Date(toLocaleDateString(@now))) / 86400000 + 4) % 7`

Computes days since Monday. The `+4` accounts for the Unix epoch starting on a Thursday (Jan 1, 1970 = Thursday). Result: 0 = Monday, 1 = Tuesday, … 6 = Sunday.

---

## Lookup Projected Date Fields

Lookup projected fields encode the colon (`:`) as `_x003a_`:

```json
"[$Update_x003a_Date]"   // references "Update:Date" projected field
```

The relative date formula works the same — just use the encoded field name.
