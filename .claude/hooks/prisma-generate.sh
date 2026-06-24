#!/usr/bin/env bash
# Regenerate the Prisma client after the schema changes.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE_PATH" == *"prisma/schema.prisma" ]]; then
  cd "$CLAUDE_PROJECT_DIR" && npx prisma generate
fi

exit 0
