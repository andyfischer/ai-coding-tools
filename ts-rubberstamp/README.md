# TypeScript Hook Validator

Rust-based Claude Code hook that automatically approves some safe TypeScript file edits.

## Features

Will auto-approve edits to Typescript files that are:

- **Formatting-only changes**: Whitespace, indentation, and formatting adjustments
- **Import statement changes**: Adding, modifying, or removing import statements

## Installation

1. Build the project:
   ```bash
   cargo build --release
   ```

2. Install the hook automatically:
   ```bash
   # Install for all projects (user-wide)
   ./target/release/ts-hook-validator install user
   
   # Install for current project only
   ./target/release/ts-hook-validator install project
   ```

## Manual Configuration

Alternatively, you can manually add this to your Claude Code settings file (`.claude/settings.json` or `~/.claude/settings.json`):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/ts-hook-validator/target/release/ts-hook-validator"
          }
        ]
      }
    ]
  }
}
```

## Testing

The test suite uses Vitest:

```bash
cd ts
npm install
npm test
```

You can also create manual test cases by providing JSON input to the binary:

```bash
echo '{"session_id":"test","transcript_path":"","tool_name":"Edit","tool_input":{"file_path":"test.ts","old_string":"const x=1","new_string":"const x = 1"}}' | ./target/release/ts-hook-validator
```

## Logging

To enable logging, set the `TS_RUBBERSTAMP_ENABLE_LOGS` environment variable:

```bash
export TS_RUBBERSTAMP_ENABLE_LOGS=1
```

When logging is enabled, the hook will write to `tsrubberstamp.log`.
