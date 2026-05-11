---
topic: deployment
description: SharePoint formatter deployment via PnP and CSOM — auth, CSOM direct vs Set-PnPField, gallery view constraints, logging, and common gotchas.
sources:
  - .agent/skills/pnp-deployment/SKILL.md
  - CLAUDE.md
---

# Deployment

## Environment

- **Site URL:** `https://mympc.sharepoint.com/sites/mplxcontrols/`
- **PnP Version:** 1.12.0 (locked — do not upgrade)
- **Auth:** `-UseWebLogin` always (interactive browser popup)
- **Blocked:** Microsoft Graph PowerShell SDK, `Get-PnPUserProfileProperty`, `Connect-MgGraph`

```powershell
Connect-PnPOnline -Url "https://mympc.sharepoint.com/sites/mplxcontrols/" -UseWebLogin
```

---

## CSOM Direct vs Set-PnPField

**Always use direct CSOM.** `Set-PnPField -Values @{ CustomFormatter = $json }` has a known parsing bug — it deserializes the JSON string into a PSObject hashtable before setting, corrupting the value.

```powershell
# CORRECT — direct CSOM field assignment
$ctx = Get-PnPContext
$list = $ctx.Web.Lists.GetByTitle("Tasks")
$field = $list.Fields.GetByInternalNameOrTitle("StatusUI")
$field.CustomFormatter = [string]$json
$field.Update()
$ctx.ExecuteQuery()

# WRONG — silently corrupts JSON
Set-PnPField -List "Tasks" -Identity "StatusUI" -Values @{ CustomFormatter = $json }
```

Same pattern for view formatters:
```powershell
$view = $list.Views.GetByTitle("Gallery View")
$view.CustomFormatter = [string]$json
$view.Update()
$ctx.ExecuteQuery()
```

---

## Gallery View — Cannot Deploy Programmatically

Gallery/tile view formatters **cannot be deployed via PnP or CSOM**. The value appears to save but silently reverts on page load.

**Only working method:** Copy the JSON manually into the SharePoint UI:
1. Open the gallery view → View formatting → Edit view format
2. Paste JSON → Save

Always note this in the deploy script as a comment.

---

## Mandatory Logging

Every `.ps1` script must route output to `.logs/deploy.log`:

```powershell
$logPath = ".logs\deploy.log"
if (-not (Test-Path ".logs")) { New-Item -ItemType Directory -Path ".logs" | Out-Null }
"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting deploy..." | Tee-Object -FilePath $logPath -Append
```

Log to file AND console (`Tee-Object`) so both are captured. Inner exceptions are swallowed by the console — only the log captures them.

---

## Lookup Column Creation

Lookup columns must be created via XML schema (not `Add-PnPField -Type Lookup`):

```powershell
$xml = '<Field Type="Lookup" DisplayName="Project" Name="Project" List="{GUID}" ShowField="Title" />'
Add-PnPFieldFromXml -FieldXml $xml
```

Use the list's actual GUID, not the list title.

---

## Unicode / ASCII Rule

All formatter content deployed via CSOM must be **ASCII only**. Non-ASCII characters are corrupted during XML round-tripping (CSOM serializes to XML internally).

`sanitizeForCSOM()` replaces `×` (U+00D7) with `x` automatically. Watch for copy-pasted em-dashes, curly quotes, arrows, etc.

**Validation:** `validate()` warns about non-ASCII characters before compile output is written.

---

## CSOM Throttling

When deploying formatters to multiple columns in a loop, add a 1-second delay between iterations:

```powershell
Start-Sleep -Seconds 1
```

Without it, CSOM raises 429 errors that can leave columns in a broken state.

---

## View Name Matching

`Get-PnPView` requires an **exact case-sensitive** view name match. Always enumerate views before targeting:

```powershell
Get-PnPView -List "Tasks" | Select-Object Title
```

---

## Title Column

SharePoint's `Title` column formatter is unreliable via CSOM — it often doesn't apply correctly. Use a separate text column for display purposes when title formatting is needed.

---

## Set-PnPView — Bracket Stripping

`Set-PnPView` strips `[$fieldName]` brackets from JSON strings. Always deploy view formatters via direct CSOM, not `Set-PnPView`.

---

## PowerShell Constraints (CLAUDE.md rules)

- **No `cd`** — triggers security block. Use full paths or paths relative to the project root.
- **No subexpressions** — `$(...)` and `(Get-Content ...).Property` trigger unbypassable prompts. Use intermediate variables:
  ```powershell
  # WRONG
  $lines = (Get-Content $file | Measure-Object -Line).Lines
  # CORRECT
  $measure = Get-Content $file | Measure-Object -Line
  $lines = $measure.Lines
  ```
- **No inline PowerShell** — always write a `.ps1` file and execute it, never run deployment logic inline.

---

## User Profile Lookup

Graph PowerShell is blocked by corporate Conditional Access. Use the **User Information List** instead:

```powershell
Get-PnPListItem -List "User Information List" -Query "<View><Query><Where><Eq><FieldRef Name='EMail'/><Value Type='Text'>user@mpc.com</Value></Eq></Where></Query></View>"
```

Fields available: `Department`, `JobTitle`, `Office`, `EMail`, `Name`.
