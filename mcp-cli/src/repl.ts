import * as readline from 'readline';
import { McpClient } from './mcp-client.js';

interface Command {
  name: string;
  description: string;
  handler: (args: string[]) => Promise<void>;
}

export class McpRepl {
  private rl: readline.Interface;
  private commands: Map<string, Command> = new Map();
  private history: string[] = [];

  constructor(private client: McpClient) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'mcp> ',
      completer: this.completer.bind(this),
      history: this.history
    });

    this.setupCommands();
  }

  private setupCommands(): void {
    this.commands.set('tools/list', {
      name: 'tools/list',
      description: 'List all available tools',
      handler: this.handleToolsList.bind(this)
    });

    this.commands.set('resources/list', {
      name: 'resources/list',
      description: 'List all available resources',
      handler: this.handleResourcesList.bind(this)
    });

    this.commands.set('tools/call', {
      name: 'tools/call',
      description: 'Call a tool: tools/call <tool-name> [args...]',
      handler: this.handleToolsCall.bind(this)
    });

    this.commands.set('resources/read', {
      name: 'resources/read',
      description: 'Read a resource: resources/read <uri>',
      handler: this.handleResourcesRead.bind(this)
    });

    this.commands.set('help', {
      name: 'help',
      description: 'Show available commands',
      handler: this.handleHelp.bind(this)
    });

    this.commands.set('exit', {
      name: 'exit',
      description: 'Exit the REPL',
      handler: this.handleExit.bind(this)
    });
  }

  private completer(line: string): [string[], string] {
    const completions = Array.from(this.commands.keys());
    const hits = completions.filter((c) => c.startsWith(line));
    return [hits.length ? hits : completions, line];
  }

  private async handleToolsList(): Promise<void> {
    try {
      const tools = await this.client.listTools();
      if (tools.length === 0) {
        console.log('No tools available');
        return;
      }
      
      console.log('Available tools:');
      tools.forEach(tool => {
        console.log(`  ${tool.name}`);
        if (tool.description) {
          console.log(`    ${tool.description}`);
        }
      });
    } catch (error) {
      console.error('Error listing tools:', error);
    }
  }

  private async handleResourcesList(): Promise<void> {
    try {
      const resources = await this.client.listResources();
      if (resources.length === 0) {
        console.log('No resources available');
        return;
      }
      
      console.log('Available resources:');
      resources.forEach(resource => {
        console.log(`  ${resource.uri}`);
        if (resource.name) {
          console.log(`    Name: ${resource.name}`);
        }
        if (resource.description) {
          console.log(`    Description: ${resource.description}`);
        }
        if (resource.mimeType) {
          console.log(`    Type: ${resource.mimeType}`);
        }
      });
    } catch (error) {
      console.error('Error listing resources:', error);
    }
  }

  private async handleToolsCall(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.log('Usage: tools/call <tool-name> [args...]');
      return;
    }

    const toolName = args[0];
    const toolArgs: Record<string, any> = {};

    // Simple argument parsing
    for (let i = 1; i < args.length; i += 2) {
      if (i + 1 < args.length) {
        toolArgs[args[i]] = args[i + 1];
      }
    }

    try {
      const result = await this.client.callTool(toolName, toolArgs);
      console.log('Tool result:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error calling tool:', error);
    }
  }

  private async handleResourcesRead(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.log('Usage: resources/read <uri>');
      return;
    }

    const uri = args[0];

    try {
      const result = await this.client.readResource(uri);
      console.log('Resource content:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error reading resource:', error);
    }
  }

  private async handleHelp(): Promise<void> {
    console.log('Available commands:');
    this.commands.forEach(command => {
      console.log(`  ${command.name} - ${command.description}`);
    });
  }

  private async handleExit(): Promise<void> {
    console.log('Goodbye!');
    await this.client.disconnect();
    process.exit(0);
  }

  async start(): Promise<void> {
    console.log('Connected - Type "help" for available commands');
    
    this.rl.on('line', async (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        this.rl.prompt();
        return;
      }

      this.history.push(trimmed);
      const parts = trimmed.split(/\s+/);
      const commandName = parts[0];
      const args = parts.slice(1);

      const command = this.commands.get(commandName);
      if (command) {
        await command.handler(args);
      } else {
        console.log(`Unknown command: ${commandName}. Type "help" for available commands.`);
      }

      this.rl.prompt();
    });

    this.rl.on('SIGINT', () => {
      console.log('\nUse "exit" to quit');
      this.rl.prompt();
    });

    this.rl.prompt();
  }
}