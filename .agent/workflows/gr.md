---
description: Triggers Antigravity to retrieve Claude Code's latest output from the response bridge.
---

# GR (Gemini Read) Workflow

**Description:** Triggers Antigravity to retrieve Claude Code's latest output from the response bridge.

**Instructions for Antigravity:**
When the user runs the `/gr` command:
1. Immediately use your `view_file` tool to read the contents of `c:\Users\FW97\OneDrive - Marathon Petroleum\Documents\TwFw\.agent\claude-response.md`.
2. Analyze Claude's response.
3. **Vision Loop:** If Claude explicitly requests a visual test (e.g., `REQUEST_VISION_TEST`), you MUST immediately launch your `browser_subagent`.
    - Follow Claude's interaction instructions (e.g., hovering, clicking, scrolling).
    - If Claude simply asks you to "visually verify the changes," use your own judgment based on the codebase changes to navigate and interact with the relevant UI elements.
4. Once you have captured the screenshots/recordings, save them to the workspace, and write a new task to `.agent/claude-task.txt` passing the image/video paths to Claude for analysis.
5. Present your findings to the user. If a Vision Loop occurred, tell the user to run `CR` or `CX` to let Claude analyze the visual artifacts you just captured.
