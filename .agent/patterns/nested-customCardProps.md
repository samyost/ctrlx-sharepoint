---
pattern: nested-customCardProps
description: Nest customCardProps to create cascading click-through cards ("card inception") in SharePoint list formatting.
tags: [sharepoint, formatting, customCardProps, cascading-cards]
tested: 2026-02-17
---

> **Consolidated** — this pattern has been absorbed into [`.agent/knowledge/sp-elements.md`](../knowledge/sp-elements.md). This file is kept for reference.

# Nested customCardProps (Cascading Cards)

Opens one card from another — "card inception". Tested up to 3 levels deep.

## Key Rules

1. **Use `button` elmType for `customCardProps` triggers** — `div` with child spans hijacks click registration, preventing the card from opening. `button`'s native browser event behavior propagates correctly. This is the one place where `button` elmType is required.
   > **Exception to the general rule**: everywhere else in SP formatting (action buttons, row actions), use `div` with `role="button"` — `button` elmType has font/sizing conflicts when paired with icons. Reserve `button` elmType *exclusively* for the outermost element that carries a `customCardProps`. The `components.ts:button()` factory handles this distinction automatically via an absolute-positioned overlay div when `customCardProps` is needed.
2. **Put `txtContent` directly on the `button`** — no children needed
3. **Works in both** column formatters and view `rowFormatter`
4. **All levels must use `openOnEvent: "click"`** — hover is impractical for nested cards
5. **`columnFormatterReference` inside `customCardProps`**: renders blank (don't use)
6. **ASCII only** for text deployed via PnP — Unicode characters garble

## Minimal Pattern

```json
{
  "elmType": "button",
  "txtContent": "Open Card",
  "style": {
    "padding": "8px 14px",
    "background-color": "#0078d4",
    "color": "#fff",
    "border": "none",
    "border-radius": "6px",
    "cursor": "pointer",
    "font-weight": "600"
  },
  "customCardProps": {
    "openOnEvent": "click",
    "directionalHint": "bottomCenter",
    "isBeakVisible": true,
    "formatter": {
      "elmType": "div",
      "style": {
        "padding": "16px 20px",
        "min-width": "300px"
      },
      "children": [
        {
          "elmType": "div",
          "txtContent": "Card Level 1 Content"
        },
        {
          "elmType": "button",
          "txtContent": "Open Nested Card",
          "style": {
            "padding": "8px 14px",
            "background-color": "#008080",
            "color": "#fff",
            "border": "none",
            "border-radius": "6px",
            "cursor": "pointer"
          },
          "customCardProps": {
            "openOnEvent": "click",
            "directionalHint": "rightCenter",
            "isBeakVisible": true,
            "formatter": {
              "elmType": "div",
              "style": {
                "padding": "14px 18px",
                "min-width": "240px",
                "border": "2px solid #008080",
                "border-radius": "8px"
              },
              "children": [
                {
                  "elmType": "div",
                  "txtContent": "Card Level 2 Content (nested!)"
                }
              ]
            }
          }
        }
      ]
    }
  }
}
```

## Test Script

`Scripts/Test-NestedCustomCardProps.ps1` — creates 3 views on the Tests list to compare column vs rowFormatter behavior.
