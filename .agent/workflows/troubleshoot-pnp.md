---
description: How to troubleshoot SharePoint PnP PowerShell Connectivity
---
# Troubleshoot PnP Connection Workflow

Use this workflow when facing "Access Denied" or timeout errors when attempting to deploy formatters or modify SharePoint schemas.

1. **Verify Authentication Method**: Ensure you are connecting strictly with `-UseWebLogin`. 
    ```powershell
    Connect-PnPOnline -Url "https://mympc.sharepoint.com/sites/mplxcontrols/" -UseWebLogin
    ```
2. **Handle Interactivity Prompts**: If prompted by the Microsoft authentication window, ensure the browser pop-up is successfully completed.
3. **Verify Read Connectivity**: Run a safe read command to confirm the connection is established.
    ```powershell
    Get-PnPList -Identity "Tasks"
    ```
4. **Graph Exclusions**: If the error mentions 'Microsoft Graph', abort the command immediately. Microsoft Graph PowerShell SDK is blocked by Conditional Access policies in this environment. Do not try to authenticate to Graph directly.
5. **Clear Old Sessions**: If the connection inexplicably fails, try running `Disconnect-PnPOnline` and then reconnecting, or restarting the PowerShell terminal entirely.
