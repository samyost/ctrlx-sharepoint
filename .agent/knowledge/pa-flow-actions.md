---
topic: pa-flow-actions
description: Power Automate clipboard JSON format for pasting flow actions, SharePoint REST patterns (list ops, item CRUD, permissions, columns, views), and expression patterns.
sources:
  - .agent/skills/power-automate-actions/SKILL.md
  - .agent/skills/sharepoint-http-requests/SKILL.md
---

# PA Flow Actions

---

## Clipboard JSON Format

Power Automate designer accepts JSON pasted via **Ctrl+V**. Always wrap in a Scope — standalone action paste fails for connector-specific types.

### Scope Wrapper (Always Use This)

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
        "runAfter": { "Action_Name_1": ["SUCCEEDED"] }
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

After pasting, drag the action out of the scope and delete it if desired.

**`allConnectionData` is CRITICAL** for HTTP/connector actions. If omitted, the designer strips the connection on paste and requires manual reconfiguration.

---

## Common Action Types

### Compose
```json
{ "type": "Compose", "inputs": "@triggerOutputs()?['queries']?['itemId']", "runAfter": {} }
```

### SharePoint HTTP Request (GET)
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
      "parameters/headers": { "Accept": "application/json;odata=nometadata" }
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
      "Modified": "@formatDateTime(item()?['Modified'], 'yyyy-MM-dd')"
    }
  },
  "runAfter": { "Get_Items": ["SUCCEEDED"] }
}
```

### Filter Array
```json
{
  "type": "Query",
  "inputs": {
    "from": "@body('Build_History')",
    "where": "@not(equals(item()?['State'], item()?['State_prev']))"
  },
  "runAfter": { "Build_History": ["SUCCEEDED"] }
}
```

### HTTP Response
```json
{
  "type": "Response",
  "kind": "Http",
  "inputs": {
    "statusCode": 200,
    "headers": { "Content-Type": "application/json" },
    "body": "@outputs('Payload')"
  },
  "runAfter": { "Payload": ["SUCCEEDED"] }
}
```

### Parallel Execution
Actions with the same `runAfter` dependency run simultaneously:
```json
"Fetch_Current_Item": { "runAfter": { "Parse_ItemId": ["SUCCEEDED"] } },
"Fetch_Children":     { "runAfter": { "Parse_ItemId": ["SUCCEEDED"] } }
```

---

## Child Flow Trigger Input Naming

**CRITICAL:** "Manually trigger a flow" inputs get auto-incremented internal names by data type — NOT from the display title.

| Creation order | Display Name | Internal Name | Reference |
|---|---|---|---|
| 1st text | Title | `text` | `triggerBody()?['text']` |
| 1st number | ProjectId | `number` | `triggerBody()?['number']` |
| 2nd number | TeamId | `number_1` | `triggerBody()?['number_1']` |
| 2nd text | TaskAreaRaw | `text_1` | `triggerBody()?['text_1']` |

Pattern: `{datatype}`, `{datatype}_1`, `{datatype}_2`. If unsure, copy the trigger from the designer and inspect its `properties` keys.

---

## SharePoint REST Patterns

### List Reference
Either form works in all requests:
- `_api/web/lists/getByTitle('<listName>')`
- `_api/web/lists('<listGuid>')`

### Item CRUD

**GET item:**
```
GET _api/web/lists/getByTitle('<list>')/items(<id>)?$select=Id,Title
```

**Create item:**
```
POST _api/web/lists/getByTitle('<list>')/items
Body: { "__metadata": { "type": "SP.Data.<list>ListItem" }, "Title": "..." }
```

**Update item (ValidateUpdateListItem — preferred):**
```
POST _api/web/lists/getByTitle('<list>')/items(<id>)/validateUpdateListItem
Body: { "formValues": [{ "FieldName": "Status", "FieldValue": "Active" }] }
```
Add `"bNewDocumentUpdate": true` to update without creating a new version.

**ValidateUpdateListItem field value formats:**

| Column Type | FieldValue format |
|---|---|
| Text/Multiline | `"<text>"` |
| Choice | `"<choice>"` |
| Multiple choice | `"<choice1>;#<choice2>"` |
| Number | `"<number>"` |
| Date | `"MM-dd-yyyy"` |
| Yes/No | `"1"` or `"0"` |
| User | `"[{'Key':'i:0#.f\|membership\|email@mpc.com'}]"` |
| Multiple users | `"[{'Key':'i:0#.f\|membership\|a@mpc.com'}, {'Key':'...b@mpc.com'}]"` |
| Lookup | `"<lookupID>"` |
| Managed Metadata | `"<termName>\|<termGuid>"` |

Special fields: `Author` (Created By), `Editor` (Modified By), `FileLeafRef` (file name).

**PATCH via HTTP Request:**
```
PATCH _api/web/lists/getByTitle('<list>')/items(<id>)
Headers: Content-Type: application/json;odata=nometadata, IF-MATCH: *
Body: { "Title": "Updated Value" }
```

### Columns

**Get XML schema of existing column:**
```
GET _api/web/lists/getByTitle('<list>')/fields/getByTitle('<field>')/SchemaXml
```

**Create column from XML schema:**
```
POST _api/web/lists/getByTitle('<list>')/fields/createfieldasxml
Body: { "parameters": { "__metadata": { "type": "SP.XmlSchemaFieldCreationInformation" }, "SchemaXml": "<xml>" } }
```

### Views

**Create view:**
```
POST _api/web/lists/getByTitle('<list>')/views
Body: { "__metadata": { "type": "SP.View" }, "ViewType": "HTML", "Title": "<name>", "PersonalView": false }
```

**Add column to view:**
```
POST _api/web/lists/getByTitle('<list>')/views/getByTitle('<view>')/viewFields/addViewField('<columnName>')
```

### Permissions

**Break inheritance:**
```
POST _api/web/lists/getByTitle('<list>')/breakroleinheritance(true)
POST _api/web/lists/getByTitle('<list>')/items(<id>)/breakroleinheritance(true)
```

**Add permissions:**
```
POST _api/web/lists/getByTitle('<list>')/roleAssignments/addRoleAssignment(principalId=<id>, roleDefId=<permId>)
```

**Default permission level IDs:** Full Control: 1073741829, Edit: 1073741830, Contribute: 1073741827, Read: 1073741826.
**Default group IDs:** Owners: 3, Visitors: 4, Members: 5.

**Get user ID:** `GET _api/web/siteUsers/getByEmail('<email>')/Id`
**Get group ID:** `GET _api/web/siteGroups/getByName('<name>')/Id`

### TaxonomyHiddenList Lookup

```
GET _api/web/lists/getByTitle('TaxonomyHiddenList')/items?$filter=IdForTerm eq '{termGuid}'&$select=Term,PathOfTerm
```

---

## Expression Patterns

| Pattern | Expression |
|---|---|
| Null coalesce | `@coalesce(value, 'default')` |
| Format date | `@formatDateTime(value, 'yyyy-MM-dd')` |
| Array indexing | `@body('Action')?['value'][0]?['Title']` |
| Days ago | `@addDays(utcNow(), -30)` |
| Reverse array | `@reverse(body('Array_Action'))` |
| String from object | `@string(item()?['ComplexField'])` |
| Consecutive pair comparison | `@range(0, length(array))` with Select: `array[item()]` vs `array[add(item(), 1)]` |
