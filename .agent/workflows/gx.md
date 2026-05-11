---
description: Triggers Antigravity to write a task prompt for Claude Code.
---

# GX (Gemini Execute Task) Workflow

**Description:** Triggers Antigravity to write a task prompt for Claude Code.

**CRITICAL BEHAVIORAL RULE:**
When writing a task for Claude (`.agent/claude-task.txt`), Antigravity MUST ONLY provide:
1. **The Objective (What):** A clear description of the end goal requested by the user.
2. **The Boundaries (Where):** Which files are allowed to be touched and any strict environmental rules. 
    - *Rule of Thumb for CFRs:* ALWAYS explicitly grant Claude permission to traverse and amend underlying Column Formatter scripts if they are referenced via `columnFormatterReference` (CFR) in the primary task view. Do not trap Claude in a single file if the UI is distributed across CFRs.

**STRICT PROHIBITION:**
Antigravity MUST NEVER provide opinions, structural advice, CSS property suggestions, or instructions on *HOW* the code should be changed. You are strictly banned from dictating the "Structural How". Do not pre-architect the code. Let Claude figure out the code entirely on its own.
