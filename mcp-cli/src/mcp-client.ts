import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { spawn } from 'child_process';
import { McpClientOptions, ToolInfo, ResourceInfo } from './types.js';

export class McpClient {
  private client: Client;
  private transport!: StdioClientTransport | SSEClientTransport;

  constructor(private options: McpClientOptions) {
    this.client = new Client(
      { name: 'mcp-cli', version: '1.0.0' },
      { capabilities: {} }
    );
  }

  async connect(): Promise<void> {
    if (this.options.serverUrl) {
      // HTTP/SSE connection
      this.transport = new SSEClientTransport(new URL(this.options.serverUrl));
    } else if (this.options.command) {
      // Stdin/stdout connection
      const childProcess = spawn(this.options.command[0], this.options.command.slice(1), {
        stdio: ['pipe', 'pipe', 'inherit'],
      });
      this.transport = new StdioClientTransport({
        command: this.options.command[0],
        args: this.options.command.slice(1),
      });
    } else {
      throw new Error('Either serverUrl or command must be provided');
    }

    await this.client.connect(this.transport);
  }

  async listTools(): Promise<ToolInfo[]> {
    const response = await this.client.listTools();
    return response.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  async listResources(): Promise<ResourceInfo[]> {
    const response = await this.client.listResources();
    return response.resources.map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType
    }));
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    const response = await this.client.callTool({
      name,
      arguments: args
    });
    return response;
  }

  async readResource(uri: string): Promise<any> {
    const response = await this.client.readResource({ uri });
    return response;
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }
}