
# ai-coding-tools #

Repo with open sourced tools for AI assisted coding.

# Contents #

### Candle ###

This is a small process manager for running local servers, with MCP integration.
I wrote this because Claude Code was having a lot of trouble launching local servers by itself.

[Project link](./candle)

### claude-history-tool ###

Electron based application that allows you to browse the full history of every Claude Code session.

### ts-rubberstamp ###

First experiment using Claude Code hooks. This looks for certain Typescript edits
that are generally always safe (such as adding 'import' statements) and it auto-approves them.

[Project link](./ts-rubberstamp)

### mcp-cli ###

Very simple REPL for interacting with a shell process using MCP protocol over stdin.
