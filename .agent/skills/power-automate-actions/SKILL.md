---
name: Power Automate Actions
description: How to generate copy-paste-able Power Automate flow actions, scopes, and triggers as JSON that can be pasted directly into the Power Automate designer clipboard.
---

# Power Automate — Clipboard-Ready Flow Actions

This skill covers how to generate Power Automate flow definitions as JSON that can be **copied and pasted directly into the Power Automate designer**. This bypasses the need to manually configure each action through the UI.

---

## The Clipboard Format

Power Automate's designer accepts a specific JSON structure when you paste into it. There are two formats depending on whether you're pasting a **Scope** (container of actions) or a **single action**.

### Scope (Multiple Actions)

```json
{
  "nodeId": "My_Scope_Name",
  "serializedValue": {
    "type": "Scope",
    "actions": {
      "Action_Name_1": {
        "type": "Compose",
        "inputs": "some value",
        "runAfter": {}
      },
      "Action_Name_2": {
        "type": "Compose",
        "inputs": "@outputs('Action_Name_1')",
        "runAfter": {
          "Action_Name_1": ["SUCCEEDED"]
        }
      }
    },
    "runAfter": {}
  },
  "allConnectionData": {
    "Action_Name_1": {
      "connectionReference": {
        "api": {
          "id": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline"
        },
        "connection": { "id": "sdy_TwFwSharepoint" },
        "connectionName": "sdy_TwFwSharepoint"
      },
      "referenceKey": "shared_sharepointonline"
    }
  },
  "staticResults": {},
  "isScopeNode": true,
  "mslaNode": true
}
```

### Single Action — ALWAYS Wrap in a Scope

**Do NOT paste standalone actions** using `serializedValue` + `isScopeNode: false`. Connector-specific actions (e.g., `Respond to a PowerApp or flow`) will fail to paste in this format. The safe pattern is to always wrap in a throwaway Scope:

```json
{
  "nodeId": "Wrapper_Scope",
  "serializedValue": {
    "type": "Scope",
    "actions": {
      "My_Action_Name": {
        "type": "Compose",
        "inputs": "some value",
        "runAfter": {}
      }
    },
    "runAfter": {}
  },
  "allConnectionData": {},
  "staticResults": {},
  "isScopeNode": true,
  "mslaNode": true
}
```

After pasting, you can drag the action out of the wrapper scope and delete the scope if desired. Alternatively, the New Designer also accepts a `nodeData` format for standalone actions, but wrapping in a scope is simpler and universally reliable.

---

## Key Properties

| Property | Description |
|---|---|
| `nodeId` | The action/scope name as it appears in the designer. Use underscores for spaces. |
| `serializedValue` | The full action definition. |
| `serializedValue.type` | Action type: `Scope`, `Compose`, `OpenApiConnection`, `Response`, `Query`, `Select`, `If`, `Foreach`, etc. |
| `serializedValue.actions` | Only used in `Scope` and control actions. Contains child actions. |
| `serializedValue.runAfter` | Dependency map. `{}` = runs first. `{"Action_Name": ["SUCCEEDED"]}` = runs after that action succeeds. |
| `allConnectionData` | **CRITICAL for HTTP/Connector actions.** If an action uses a connection (e.g., `OpenApiConnection`), you MUST register it here. If omitted, the designer strips the connection entirely on paste, forcing manual reconfiguration. |
| `isScopeNode` | `true` for Scopes, `false` for single actions. |
| `mslaNode` | Always `true`. |

---

## Common Action Types

### Compose
```json
{
  "type": "Compose",
  "inputs": "@triggerOutputs()?['queries']?['itemId']",
  "runAfter": {}
}
```

### SharePoint HTTP Request (Send an HTTP request to SharePoint)
```json
{
  "type": "OpenApiConnection",
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connection": "shared_sharepointonline",
      "operationId": "HttpRequest"
    },
    "parameters": {
      "dataset": "https://mympc.sharepoint.com/sites/mplxcontrols/",
      "parameters/method": "GET",
      "parameters/uri": "_api/web/lists/getbytitle('ListName')/items(123)?$select=Id,Title",
      "parameters/headers": {
        "Accept": "application/json;odata=nometadata"
      }
    }
  },
  "runAfter": {}
}
```

### Select (Transform Array)
```json
{
  "type": "Select",
  "inputs": {
    "from": "@body('Get_Items')?['value']",
    "select": {
      "Title": "@item()?['Title']",
      "Status": "@item()?['Status/Value']",
      "Modified": "@formatDateTime(item()?['Modified'], 'yyyy-MM-dd')"
    }
  },
  "runAfter": {
    "Get_Items": ["SUCCEEDED"]
  }
}
```

### Filter Array (Query)
```json
{
  "type": "Query",
  "inputs": {
    "from": "@body('Build_History')",
    "where": "@not(equals(item()?['State'], item()?['State_prev']))"
  },
  "runAfter": {
    "Build_History": ["SUCCEEDED"]
  }
}
```

### HTTP Response (for HTTP-triggered flows)
```json
{
  "type": "Response",
  "kind": "Http",
  "inputs": {
    "statusCode": 200,
    "headers": { "Content-Type": "application/json" },
    "body": "@outputs('Payload')"
  },
  "runAfter": {
    "Payload": ["SUCCEEDED"]
  }
}
```

### Update SharePoint Item (PATCH via HTTP Request)
```json
{
  "type": "OpenApiConnection",
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connection": "shared_sharepointonline",
      "operationId": "HttpRequest"
    },
    "parameters": {
      "dataset": "https://mympc.sharepoint.com/sites/mplxcontrols/",
      "parameters/method": "PATCH",
      "parameters/uri": "_api/web/lists/getbytitle('ListName')/items(123)",
      "parameters/headers": {
        "Content-Type": "application/json;odata=nometadata",
        "IF-MATCH": "*"
      },
      "parameters/body": "{\"Title\": \"Updated Value\"}"
    }
  },
  "runAfter": {}
}
```

---

## Parallel Execution via runAfter

Actions that share the same `runAfter` dependencies run **in parallel**:

```json
"Fetch_Current_Item": {
  "runAfter": { "Parse_ItemId": ["SUCCEEDED"] }
},
"Fetch_Children": {
  "runAfter": { "Parse_ItemId": ["SUCCEEDED"] }
}
```

Both `Fetch_Current_Item` and `Fetch_Children` run simultaneously after `Parse_ItemId` succeeds.

---

## Expression Patterns

| Pattern | Expression |
|---|---|
| Null coalesce | `@coalesce(value, 'default')` |
| Format date | `@formatDateTime(value, 'yyyy-MM-dd')` |
| Array indexing | `@body('Action')?['value'][0]?['Title']` |
| Previous version comparison | Use `@range(0, length(array))` with `Select` to access `array[item()]` and `array[add(item(), 1)]` |
| String from object | `@string(item()?['ComplexField'])` |
| Days ago | `@addDays(utcNow(), -30)` |
| Reverse array | `@reverse(body('Array_Action'))` |

---

## How to Use

1. Generate the JSON following the format above
2. Copy the JSON to clipboard
3. In Power Automate designer, click on the `+` button between steps
4. Press **Ctrl+V** — the scope/action pastes directly into the flow
5. The designer will prompt to select connections for any connector actions

## Tips

- **Action names** use underscores in the JSON but display as spaces in the designer
- **Connection references** MUST be defined in BOTH the action's `host` property and the root `allConnectionData` block. If they mismatch or are omitted from `allConnectionData`, the connection is stripped on paste.
- When referencing other actions, use `outputs('Action_Name')` or `body('Action_Name')`
- `description` property can be added to any action for inline documentation

---

## Child Flow Trigger Input Naming

**CRITICAL**: "Manually trigger a flow" inputs get **auto-incremented internal names by data type**, NOT names derived from the display title. The names are assigned in creation order and never change, even if you rename the input.

| Creation order | Display Name | Internal Name | Reference |
|---|---|---|---|
| 1st text | Title | `text` | `triggerBody()?['text']` |
| 1st number | ProjectId | `number` | `triggerBody()?['number']` |
| 2nd number | TeamId | `number_1` | `triggerBody()?['number_1']` |
| 3rd number | RequestId | `number_2` | `triggerBody()?['number_2']` |
| 2nd text | TaskAreaRaw | `text_1` | `triggerBody()?['text_1']` |

Pattern: `{datatype}`, `{datatype}_1`, `{datatype}_2`, etc. If unsure, copy the trigger from the designer to inspect its `nodeData` schema — the property keys in `properties` are the real internal names.
