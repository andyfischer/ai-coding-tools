# MCP CLI

Very simple terminal-based UI for browsing MCP (Model Context Protocol) servers.

You probably shouldn't use this yet, instead use this instead: https://github.com/chrishayuk/mcp-cli

## Installation

```bash
yarn install
yarn build
```

## Usage

### Connect to an MCP server via URL
```bash
node dist/index.js https://your-mcp-server.com
```

### Connect to an MCP server via stdin/stdout
```bash
node dist/index.js "python your-mcp-server.py"
```

## REPL Commands

Once connected, you can use the following commands in the interactive REPL:

- `tools/list` - List all available tools
- `resources/list` - List all available resources  
- `tools/call <tool-name> [args...]` - Call a tool with arguments
- `resources/read <uri>` - Read a resource by URI
- `help` - Show available commands
- `exit` - Exit the REPL

## Features

- **Tab completion** - Press Tab to autocomplete commands
- **Command history** - Use up/down arrows to browse command history
- **Multiple connection modes** - Support for both HTTP/SSE and stdin/stdout connections
- **Interactive REPL** - Full-featured REPL with readline support

## Example Session

```
$ node dist/index.js "python my-mcp-server.py"
Connecting to MCP server...
Connected successfully!
MCP CLI - Type "help" for available commands
mcp> tools/list
Available tools:
  get_weather
    Get current weather for a location
  calculate
    Perform mathematical calculations
mcp> tools/call get_weather location "San Francisco"
Tool result:
{
  "content": [
    {
      "type": "text",
      "text": "The weather in San Francisco is sunny, 72°F"
    }
  ]
}
mcp> exit
Goodbye!
```
