import 'source-map-support/register';

import { McpClient } from './mcp-client.js';
import { McpRepl } from './repl.js';

export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Error: Missing server argument');
    console.error('Usage: mcp-cli <server>');
    console.error('  server: Server address (URL or command to run in stdin mode)');
    process.exit(1);
  }

  if (args[0] === '--help' || args[0] === '-h') {
    console.log('mcp-cli - Terminal-based UI for browsing MCP (Model Context Protocol) servers');
    console.log('');
    console.log('Usage: mcp-cli <server>');
    console.log('  server: Server address (URL or command to run in stdin mode)');
    console.log('');
    console.log('Examples:');
    console.log('  mcp-cli http://localhost:3000');
    console.log('  mcp-cli npx @modelcontextprotocol/server-filesystem /path/to/dir');
    process.exit(0);
  }

  try {
    let clientOptions;
    
    const server = args[0];
    if (server.startsWith('http://') || server.startsWith('https://')) {
      // URL mode
      clientOptions = { serverUrl: server };
    } else {
      // Stdin mode - use all args as the command
      clientOptions = { command: args };
    }

    console.log('Connecting to MCP server...');
    const client = new McpClient(clientOptions);
    await client.connect();

    const repl = new McpRepl(client);
    await repl.start();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}