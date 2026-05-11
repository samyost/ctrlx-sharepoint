---
description: How to deploy a SharePoint JSON Formatter
---
# Deploy Formatter Workflow

This workflow ensures the correct order of operations when deploying a JSON formatter using the builder pattern.

1.  Identify the target builder script in `Formatters/src/` (e.g., `Projects_ProjectUI.ts`).
2.  Ensure a `.logs` directory exists (e.g., `New-Item -ItemType Directory -Force -Path .logs` in PowerShell or `mkdir .logs` in Bash).
3.  Compile the TypeScript builder into the `dist/` folder. If piping output, capture compilation logs to the `.logs/` folder:
    ```bash
    npx tsx Formatters/src/[ScriptName].ts
    ```
4.  Optional: Briefly verify the output was successfully generated in `Formatters/dist/[ScriptName].json`.
5.  Run the deployment script via PowerShell. **Always route logs to a dedicated `.logs/` folder**. DO NOT log to the `Formatters/dist/` or root directory.
    *For a column:*
    ```powershell
    pwsh -File Scripts/Deploy-Format.ps1 -JsonFile Formatters/dist/[ScriptName].json -ListName "[ListName]" -FieldName "[FieldName]" *>&1 | Out-File .logs/deploy.log
    ```
    *For a view:*
    ```powershell
    pwsh -File Scripts/Deploy-Format.ps1 -JsonFile Formatters/dist/[ScriptName].json -ListName "[ListName]" -ViewName "[ViewName]" *>&1 | Out-File .logs/deploy.log
    ```
