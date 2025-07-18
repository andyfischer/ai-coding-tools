#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DocsParser } from './docs-parser.js';

export class StandardStyleMCPServer {
  private server: Server;
  private docsParser: DocsParser;

  constructor() {
    this.server = new Server(
      {
        name: 'coding-guidelines-mcp',
        version: '1.0.0',
        instructions: 'Coding guidelines to use for all coding projects',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.docsParser = new DocsParser();
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const docResources = await this.docsParser.getDocResources();
      
      return {
        resources: docResources.map(doc => ({
          uri: doc.uri,
          name: doc.name,
          description: doc.description,
          mimeType: 'text/markdown',
        })),
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      
      if (uri.startsWith('docs://')) {
        const filename = uri.replace('docs://', '');
        const content = await this.docsParser.getDocContent(filename);
        
        if (content !== null) {
          return {
            contents: [
              {
                uri: uri,
                mimeType: 'text/markdown',
                text: content,
              },
            ],
          };
        }
      }
      
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown resource: ${uri}`
      );
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown tool: ${request.params.name}`
      );
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Handle SIGINT (Control-C) for graceful shutdown
    process.on('SIGINT', () => {
      process.exit(0);
    });

    // Handle SIGTERM for graceful shutdown
    process.on('SIGTERM', () => {
      process.exit(0);
    });
  }
}

if (require.main === module) {
  const server = new StandardStyleMCPServer();
  server.run().catch(console.error);
}
