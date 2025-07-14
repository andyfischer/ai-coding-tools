# candle

Candle is a local process manager optimized for AI agents.

## Motivation

By default, Claude Code has trouble launching local servers for you. It often
does commands like `npm run dev &` which causes issues with leftover processes
running in the background, and no way for Claude to see the stdout for the server.

I wrote `candle` to make this much easier for Claude, this tool provides a much
more foolproof way to start the services, and gives it a reliable way to see recent logs.

Think of this as a simple alternative to `pm2` but optimized for local development
and working with coding AIs.

## Features

- MCP Integration: Processes can be launched and monitored by an AI agent using the MCP server.
- Simple interface: Commands are stored 
- Enforces limits so the same command is never launched more than once.
- Builtin unique port assignment (see 'Port Assignment' below)

## Installation using `npx` (fastest)

With Node.js installed, run `npx @andyfischer/candle --mcp`

Example command to add the MCP to Claude Code:

    $ claude mcp add candle -s user npx @andyfischer/candle --mcp

## Global installation (fast)

Install globally using npm:

    $ npm i -g @andyfischer/candle

Then add `candle --mcp` to your MCP configuration.

## Installing from source

 - Must have Node.js installed. (Version 22.x or above recommended)
 - Download the project with `git clone`
 - Run `npm install` and `npm run build`
 - Add the 'bin' folder to your PATH. Or run `npm i -g .`

## Agent Usage ##

This tool has been tested with Claude Code.

Once the MCP is installed, you might need to encourage the agent to
use the service, either through your prompt or your setup .md file.

For example saying "Start the server using Candle" works pretty well.
After that, Claude seems to do pretty well at using the other commands
such as GetLogs.

Full list of MCP tools available:

| name | description |
| -------------- | ------------------------------------------------- |
| SetCommand     | Sets the shell command used to launch a service. |
| StartService   | Start the service for the current directory. |
| GetLogs        | List the recent stdout & stderr logs for the locally running service |
| KillService    | Kill the running service process. |
| RestartService | Restart the running service process. |
| ListServices   | Fetch metadata for running services including their assigned port. |

# CLI Commands #

The `candle` tool can also be used on the command line:

### `candle --help`

List all CLI commands.

### `candle run [name] [-- <command>]`

Launch the process and start watching logs.

This will use the command string that was set with `set-command`.
The `name` is optional, if omitted then it will use the default command for this directory.

Press Ctrl-C to stop watching logs. The processes is launched in detached mode in the background,
so it will keep running (until you call `kill`).

Candle does not run the same command more than once, so if this command is already running,
then `candle run` will just watch and display the logs from the existing process.

#### Setting a command

If you use a `--` section, this will set the command string for that name.

Example:

    $ candle run -- yarn dev

This is the same thing as calling `set-command` before calling `run`.

### `candle set-command [optional name] -- [command str]`

Stores the run command related to the current directory.

Example:

    $ candle set-command -- yarn dev

Named commands can be used, in case there are multiple things to launch in the same directory:

    $ candle set-command server -- yarn dev
    $ candle set-command test -- yarn dev

### `candle list` or `candle ls`

List the active processes for this directory.

### `candle kill [name]`

Kill the process for this current directory.

### `candle restart [name]`

Restart the process for this current directory.

### `candle-mcp` or `candle --mcp`

Run Candle in MCP mode, using stdin as the transport.

# Infrequently used commands #

### `candle list-all`

List all processes that were launched by Candle.

### `candle kill-all`

Kill all processes that were launched by Candle.

### `candle clear-database`

Delete the database stored in `~/.candle`.

# Port Assignment #

By default, each process will be launched with a unique port number assigned to the `PORT` environment variable.
Port numbers start at 3001. Candle will pre-check each port to verify that it's actually available.

In order for your service to use these, it will need to actually use the `PORT` environment variable.
Some tools like Next.js use this by default. Some tools like Vite need to be specifically configured to use it.

# Debugging

If you add `export CANDLE_ENABLE_LOGS=1` to your environment, this will enable logging to a `candle.log` file.
This will log all MCP requests and responses.

