---
name: PnP Deployment
description: How to deploy SharePoint list schemas, formatters, and columns using PnP PowerShell from this environment, including auth, encoding, and constraints.
---

> **Consolidated** — key content from this skill has been absorbed into [`.agent/knowledge/deployment.md`](../knowledge/deployment.md). This file is kept as the full reference.

# PnP Deployment — Environment & Best Practices

Read this skill before running any PowerShell scripts that interact with SharePoint.

---

## Environment Constraints

### Authentication
- **PnP v1.12.0 with `-UseWebLogin`** — a browser popup appears for user auth.
- Site URL: `https://mympc.sharepoint.com/sites/mplxcontrols/`
- **Do NOT upgrade PnP to v3.x** — it removes the built-in multi-tenant app needed for `-UseWebLogin`.

### Blocked Tools
- **Microsoft Graph PowerShell SDK** (`Connect-MgGraph`): Blocked by corporate Conditional Access policy. Do NOT attempt Graph PowerShell commands.
- **`Get-PnPUserProfileProperty`**: Requires admin permissions — does not work.

### User Profile Lookups
Use the User Information List instead:
```powershell
Get-PnPListItem -List "User Information List"
```
Contains Department, JobTitle, Office synced from Entra ID.

### Dataverse
- Dataverse MCP is available for querying tables directly (no auth friction).
- `systemuser` table does NOT contain `department` — only `fullname`, `title`, `internalemailaddress`.
- `aaduser` table is a virtual table and CANNOT be queried via Dataverse SQL.

---

## Deployment Rules

1. **Always use script files** — never run inline PowerShell commands for deployments. Write a `.ps1` file and run it.
2. **Embed a subtle rev number** in every formatter that requires a browser refresh. Add it somewhere visible but unobtrusive (e.g., a small faded `rev-N` label). This lets the user confirm which version is live.

---

## Module Installation

```powershell
Install-Module -Name PnP.PowerShell -AllowClobber -Scope CurrentUser -Force
```
Use `-AllowClobber` to avoid conflicts with older `SharePointPnPPowerShellOnline` module.

---

## Terminal Output

Adjust host UI size at the start of scripts to avoid line-wrapping:
```powershell
$Host.UI.RawUI.BufferSize = New-Object System.Management.Automation.Host.Size(200, 5000)
$Host.UI.RawUI.WindowSize = New-Object System.Management.Automation.Host.Size(200, 50)
```

---

## Lookup Columns

`Add-PnPField -Type Lookup` can fail to resolve the target list by name. Use `Add-PnPFieldFromXml` with the target list's GUID:

```powershell
$LookupList = Get-PnPList -Identity "TargetListName"
$ListId = $LookupList.Id
$FieldXml = "<Field Type='Lookup' DisplayName='MyLookup' List='{$ListId}' ShowField='Title' Name='MyLookup' />"
Add-PnPFieldFromXml -List "MainList" -FieldXml $FieldXml
```

---

## Encoding via PnP/CSOM

### Unicode
Unicode characters (`→`, `—`, `✅`, `🔥`) get garbled when deployed via CSOM. **Use ASCII only** in JSON strings — `>>` instead of `→`, `--` instead of `—`.



### Source URLs in Embed Actions
Fully URL-encode the entire `Source=` return URL (`%3A`, `%2F`, `%3F`, `%3D`).

---

## Formatter Deployment Notes

- **Title column**: Unreliable for custom formatters via CSOM. Use regular text columns instead.
- **`Set-PnPView` strips `[$fieldName]` brackets** from JSON. Deploy view formatters via direct CSOM:
  ```powershell
  $ViewObj.CustomFormatter = $json
  $ViewObj.Update()
  $Ctx.ExecuteQuery()
  ```
- **JSON Validation**: PowerShell `ConvertFrom-Json` chokes on deeply nested escaped quotes. Use Node.js:
  ```bash
  node -e "JSON.parse(require('fs').readFileSync('file.json','utf8'))"
  ```
- **View names**: `Get-PnPView` requires the EXACT view name (case-sensitive). List views first.
- **Images**: Use `=getUserImage([$email], 's')` rather than constructing `userphoto.aspx` URLs.

---

## Site Architecture

Always use **Site Columns** for shared metadata. Create Site Columns first, then add them to lists. This ensures consistent definitions across all lists that share the same column.
