# Hooks

Project-specific automation that the harness runs around tool calls. Wire these up
in `.claude/settings.json` under `"hooks"`. Empty by default — add what this project needs.

## Common patterns

**Regenerate a derived artifact after editing its source** (e.g. an ORM client after a
schema change, GraphQL types after a `.graphql` edit). Add to `settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/regen.sh" }
        ]
      }
    ]
  }
}
```

And a guard in the script so it only fires for the relevant file:

```bash
#!/usr/bin/env bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [[ "$FILE_PATH" == *"path/to/schema-source" ]]; then
  cd "$CLAUDE_PROJECT_DIR/<app>" && <regenerate command>
fi
exit 0
```

Other useful hook points: `PreToolUse` (block/guard a command), `Stop` (notify when
Claude finishes). The `/bootstrap` command can set these up interactively.
