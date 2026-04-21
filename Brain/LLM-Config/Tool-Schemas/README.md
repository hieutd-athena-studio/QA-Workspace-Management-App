---
title: Tool-Schemas
type: index
---

# Tool-Schemas

Descriptions of local scripts, CLIs, or MCP servers Claude should know how to invoke.

## Structure

One file per tool: `<tool-name>.md`

```markdown
---
title: <tool-name>
invocation: cli | mcp | npm-script
---

# <tool-name>

## Purpose
## Invocation

\`\`\`bash
<exact command with arg shape>
\`\`\`

## Args

| Arg | Type | Required | Description |
|-----|------|----------|-------------|

## Output shape

\`\`\`json
{ ... }
\`\`\`

## When Claude should reach for it
```

## Current schemas

_Empty. Add as new tools / scripts are introduced._

## Note

For npm scripts already documented in `package.json`, don't duplicate here — just reference them by name. Only document tools whose args or output shape **aren't** obvious from the script file.
