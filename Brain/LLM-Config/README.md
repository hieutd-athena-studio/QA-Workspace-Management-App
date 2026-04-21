---
title: LLM-Config
type: index
---

# LLM-Config

Claude Code configuration that lives outside the repo's `.claude/` folder — swappable personas and tool descriptions.

## Sub-folders

- [[LLM-Config/System-Prompts/README|System-Prompts]] — persona files Claude can load on demand (e.g. "Security Auditor", "Frontend Specialist", "DB Migration Reviewer")
- [[LLM-Config/Tool-Schemas/README|Tool-Schemas]] — descriptions of your local scripts / MCP servers / helper CLIs, written so Claude can invoke them correctly

## Usage

- **Load a persona:** `claude "Load [[default-claude-persona]] and review this PR."`
- **Tool schema:** When asking Claude to invoke a local script, point it at the relevant tool-schema note for arg shape.

## Note on authority

Project-level rules in `CLAUDE.md` and `Brain/QA-Workspace-Management-App/Rules/*.md` **override** any persona in this folder. Personas can **narrow** focus (e.g. "only care about security today") but can't contradict the rulebook.
