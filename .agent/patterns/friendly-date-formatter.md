---
pattern: friendly-date-formatter
description: Display dates as human-readable relative time (today, yesterday, this week, X weeks ago) using SP expression math.
tags: [sharepoint, formatting, dates, lookup]
---

> **Consolidated** — this pattern has been absorbed into [`.agent/knowledge/sp-dates.md`](../knowledge/sp-dates.md). This file is kept for reference.

# Friendly Date Formatter Pattern

A SharePoint column formatting pattern for displaying dates from lookup column projected fields in a human-readable, relative time format.

## Logic Breakdown

| Output | Condition |
|--------|-----------|
| `today` | Update Date ≥ Midnight Today |
| `yesterday` | Update Date ≥ Midnight Yesterday |
| `this week` | Update Date ≥ Last Monday at 12:00 AM |
| `last week` | Update Date ≥ Monday before last at 12:00 AM |
| `X weeks ago` | Older than 14 days but less than 30 days |
| `X months ago` | Anything older than 30 days |

## Column Formatter JSON

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "txtContent": "=if(Number(Date([$Update_x003a_Date])) >= Number(Date(toLocaleDateString(@now))), 'today', if(Number(Date([$Update_x003a_Date])) >= (Number(Date(toLocaleDateString(@now)))-86400000), 'yesterday', if(Number(Date([$Update_x003a_Date])) >= (Number(Date(toLocaleDateString(@now)))-((Number(Date(toLocaleDateString(@now)))/86400000+4)%7)*86400000), 'this week', if(Number(Date([$Update_x003a_Date])) >= (Number(Date(toLocaleDateString(@now)))-(((Number(Date(toLocaleDateString(@now)))/86400000+4)%7)+7)*86400000), 'last week', if((Number(Date(@now))-Number(Date([$Update_x003a_Date]))) < 2592000000, substring(toString((Number(Date(@now))-Number(Date([$Update_x003a_Date])))/604800000),0,indexOf(toString((Number(Date(@now))-Number(Date([$Update_x003a_Date])))/604800000)+'.','.')) + ' weeks ago', substring(toString((Number(Date(@now))-Number(Date([$Update_x003a_Date])))/2629746000),0,indexOf(toString((Number(Date(@now))-Number(Date([$Update_x003a_Date])))/2629746000)+'.','.')) + ' months ago')))))"
}
```

## Key Constants (Milliseconds)

| Value | Meaning |
|-------|---------|
| `86400000` | 1 day (24 × 60 × 60 × 1000) |
| `604800000` | 1 week (7 days) |
| `2592000000` | 30 days |
| `2629746000` | ~1 month (average) |

## Usage Notes

- **Field Reference**: Replace `[$Update_x003a_Date]` with your lookup column's projected date field
- **Encoded Field Names**: The `_x003a_` represents a colon (`:`) in the internal field name (e.g., `Update:Date`)
- **Monday Calculation**: The formula `(Number/86400000+4)%7` calculates days since Monday (using Unix epoch offset of 4 for Thursday)
- **Integer Extraction**: Uses `substring` with `indexOf('.')` to extract the integer portion of week/month calculations

## Related Patterns

- Used in Smart Gateway HTML responses for relative time display
- Compatible with `Update.aspx` view formatting
