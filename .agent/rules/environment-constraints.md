---
trigger: always_on
---

# Environment Constraints

## SharePoint Site
- **Site URL:** `https://mympc.sharepoint.com/sites/mplxcontrols/`

## Deployment Rules
- **Always use script files** — never run inline PowerShell commands for deployments. Write a `.ps1` file and run it with pwsh.
- **MANDATORY LOGGING:** You **MUST ALWAYS** output script and PowerShell execution logs to a dedicated folder (e.g., `.logs/deploy.log`) and then explicitly use `view_file` to read the file. **Log files must NEVER go directly in the `Formatters/dist/` folder or the root project directory** to avoid cluttering views and directories. The standard agent console output will swallow inner script exceptions. You must do this for **every single PowerShell script run** to confirm success or capture true errors. Create the folder if it doesn't exist (e.g. `mkdir -p .logs` or `New-Item -ItemType Directory -Force -Path .logs`).
- **Always use direct CSOM** (`$field.CustomFormatter = [string]$json; $field.Update(); $ctx.ExecuteQuery()`) instead of `Set-PnPField -Values` to deploy column formatters in PnP v1.12.0. `Set-PnPField` has a bug that auto-parses JSON strings into `PSObject` hashtables, causing silent deployment failures.
- **Always embed a subtle rev number** in every formatter that requires a browser refresh. Add it somewhere visible but unobtrusive (e.g., a small faded `rev-N` label). This confirms which version is live.

## Authentication
- **PnP v1.12.0 with `-UseWebLogin`** 
- **Do NOT upgrade PnP to v3.x** — it removes the built-in multi-tenant app needed for `-UseWebLogin`.

## Blocked Tools
- **Microsoft Graph PowerShell SDK** (`Connect-MgGraph`): Blocked by corporate Conditional Access policy. Do NOT attempt Graph PowerShell commands.
- **`Get-PnPUserProfileProperty`**: Requires admin permissions — does not work.

## User Profile Lookups
Use the User Information List:
```powershell
Get-PnPListItem -List "User Information List"
```
Contains Department, JobTitle, Office synced from Entra ID.

## Dataverse
- Dataverse MCP is available for querying tables directly (no auth friction).
- `systemuser` table does NOT contain `department`.
- `aaduser` table is virtual and CANNOT be queried via Dataverse SQL.

## JSON Formatting Enforcement
- **Typically the Agent should not edit or create raw JSON format files directly**. Instead, use the TypeScript builder pattern: write a `.ts` script in `Formatters/src/` utilizing `Formatters/lib/` and compile it to `.json` in `Formatters/dist/` (`npx tsx Formatters/src/YourScript.ts`).
- **Iterator Naming:** Every iterator in a `forEach` loop MUST be prepended with an underscore (e.g., `_item`, `_user`) to ensure visual distinction from field references.

## Power Automate Rules
- **Flow Versioning:** Whenever modifying a Power Automate flow scope or action, always include a timestamp or revision note (e.g., `[Rev: 2026-04-30]`) in the scope's `description` property in the JSON. This ensures version changes are visible to users inside the Flow Designer UI.