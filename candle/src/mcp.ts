
import 'source-map-support/register';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { ProcessLog } from './database';
import { infoLog, getProcessLogs } from './logs';
import { handleRun } from './handleRun';
import { handleKill } from './handleKill';
import { handleRestart } from './handleRestart';
import { handleList } from './handleList';
import { NeedRunCommandError } from './errors';
import { findProjectDir, findSetupFile, findServiceByName, } from './setupFile';
import { addServerConfig } from './addServerConfig';

// Console.log wrapper for collecting logs
class ConsoleLogWrapper {
  private collectedLogs: string[] = [];
  private originalConsoleLog = console.log;
  private isWrapped = false;

  wrap() {
    if (this.isWrapped) return;
    
    console.log = (...args: any[]) => {
      const logMessage = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
      ).join(' ');
      this.collectedLogs.push(logMessage);
      this.originalConsoleLog(...args);
    };
    this.isWrapped = true;
  }

  reset() {
    console.log = this.originalConsoleLog;
    this.isWrapped = false;
  }

  getAndClearLogs(): string[] {
    const logs = [...this.collectedLogs];
    this.collectedLogs = [];
    return logs;
  }
}

const DEFAULT_LOGS_LIMIT = 200;

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<any>;
}

const toolDefinitions: ToolDefinition[] = [
  {
    name: 'ListServices',
    description: 'List services with structured output',
    inputSchema: {
      type: 'object',
      properties: {
        showAll: {
          type: 'boolean',
          description: 'Show all services or just current directory (optional)',
        },
      },
    },
    handler: async (args) => {
      const showAll = args?.showAll as boolean | undefined;
      
      const logWrapper = new ConsoleLogWrapper();
      logWrapper.wrap();
      try {
        const listOutput = await handleList({ showAll });
        const logs = logWrapper.getAndClearLogs();
        
        let responseText = '';
        if (logs.length > 0) {
          responseText = logs.join('\n') + '\n';
        }
        responseText += JSON.stringify(listOutput, null, 2);
        
        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } finally {
        logWrapper.reset();
      }
    },
  },
  {
    name: 'GetLogs',
    description: 'Get recent logs for a specific service',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the service to get logs for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of log lines to return (optional)',
        },
      },
      required: ['name'],
    },
    handler: async (args) => {
      const limit = args?.limit ?? DEFAULT_LOGS_LIMIT;
      const serviceName = args?.name as string;

      if (!serviceName) {
        throw new McpError(ErrorCode.InvalidRequest, 'Service name is required');
      }

      // Make sure the service actually exists
      const setupResult = findSetupFile(process.cwd());
      
      if (!setupResult) {
        throw new McpError(ErrorCode.InvalidRequest, 'No .candle-setup.json file found');
      }
      
      const service = findServiceByName(setupResult.config, serviceName);
      if (!service) {
        throw new McpError(ErrorCode.InvalidRequest, `Service '${serviceName}' not found in .candle-setup.json`);
      }
      
      const projectDir = findProjectDir();

      // Get logs using working directory and service name
      const logs = getProcessLogs({ 
        projectDir,
        commandName: serviceName,
        limit 
      });
      
      if (logs.length === 0) {
        infoLog(`MCP: GetLogs - no logs found for service '${serviceName}' in project directory: ${projectDir}`);
        throw new McpError(ErrorCode.InvalidRequest, `No logs found for service '${serviceName}' in project directory: ${projectDir}`);
      }
      
      const formattedLogs = logs
        .map((log: ProcessLog) => `[${new Date(log.timestamp * 1000).toISOString()}] ${log.content}`)
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: formattedLogs,
          },
        ],
      };
    },
  },
  {
    name: 'StartService',
    description: 'Start a specific service',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the service to start (optional - uses default service if not provided)',
        },
      },
    },
    handler: async (args) => {
      const serviceName = args?.name as string | undefined;
      const projectDir = findProjectDir();
      
      // Find the setup file and resolve the actual service name
      const setupResult = findSetupFile();
      if (!setupResult) {
        throw new McpError(ErrorCode.InvalidRequest, 'No .candle-setup.json file found');
      }
      
      const service = findServiceByName(setupResult.config, serviceName);
      if (!service) {
        if (serviceName) {
          throw new McpError(ErrorCode.InvalidRequest, `Service '${serviceName}' not found in .candle-setup.json`);
        } else {
          throw new McpError(ErrorCode.InvalidRequest, 'No services configured and no service name provided');
        }
      }
      
      const logWrapper = new ConsoleLogWrapper();
      logWrapper.wrap();
      try {
        // Use the resolved service name for handleRun
        const runOutput = await handleRun({ projectDir, commandName: service.name, watchLogs: false, consoleOutputFormat: 'pretty' });
        const logs = logWrapper.getAndClearLogs();
        
        let responseText = '';
        if (logs.length > 0) {
          responseText = logs.join('\n') + '\n';
        }
        responseText += runOutput.message;
        
        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } finally {
        logWrapper.reset();
      }
    },
  },
  {
    name: 'KillService',
    description: 'Kill a running service',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the service to kill (optional - uses default service if not provided)',
        },
      },
    },
    handler: async (args) => {
      const serviceName = args?.name as string | undefined;
      const projectDir = findProjectDir();
      
      const logWrapper = new ConsoleLogWrapper();
      logWrapper.wrap();
      try {
        // If no service name provided, kill all services in project directory
        if (!serviceName) {
          const result = await handleKill({ projectDir, commandName: serviceName });
          const logs = logWrapper.getAndClearLogs();
          
          let responseText = '';
          if (logs.length > 0) {
            responseText = logs.join('\n') + '\n';
          }
          responseText += result.message || `Service killed successfully`;
          
          return {
            content: [
              {
                type: 'text',
                text: responseText,
              },
            ],
          };
        }
        
        // Find the setup file and validate the service exists
        const setupResult = findSetupFile();
        if (!setupResult) {
          throw new McpError(ErrorCode.InvalidRequest, 'No .candle-setup.json file found');
        }
        
        const service = findServiceByName(setupResult.config, serviceName);
        if (!service) {
          throw new McpError(ErrorCode.InvalidRequest, `Service '${serviceName}' not found in .candle-setup.json`);
        }
        
        await handleKill({ projectDir, commandName: service.name });
        const logs = logWrapper.getAndClearLogs();
        
        let responseText = '';
        if (logs.length > 0) {
          responseText = logs.join('\n') + '\n';
        }
        responseText += `Service '${service.name}' killed successfully`;
        
        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } finally {
        logWrapper.reset();
      }
    },
  },
  {
    name: 'RestartService',
    description: 'Restart a running service',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the service to restart (optional - uses default service if not provided)',
        },
      },
    },
    handler: async (args) => {
      const serviceName = args?.name as string | undefined;
      const projectDir = findProjectDir();
      
      // Find the setup file and resolve the actual service name
      const setupResult = findSetupFile();
      if (!setupResult) {
        throw new McpError(ErrorCode.InvalidRequest, 'No .candle-setup.json file found');
      }
      
      const service = findServiceByName(setupResult.config, serviceName);
      if (!service) {
        if (serviceName) {
          throw new McpError(ErrorCode.InvalidRequest, `Service '${serviceName}' not found in .candle-setup.json`);
        } else {
          throw new McpError(ErrorCode.InvalidRequest, 'No services configured and no service name provided');
        }
      }
      
      const logWrapper = new ConsoleLogWrapper();
      logWrapper.wrap();
      try {
        await handleRestart({
          projectDir,
          commandName: service.name,
          consoleOutputFormat: 'pretty',
          watchLogs: false,
         });
        const logs = logWrapper.getAndClearLogs();
        
        let responseText = '';
        if (logs.length > 0) {
          responseText = logs.join('\n') + '\n';
        }
        responseText += `Service '${service.name}' restarted successfully`;
        
        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } finally {
        logWrapper.reset();
      }
    },
  },
  {
    name: 'AddServerConfig',
    description: 'Add a new server configuration to .candle-setup.json',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the service',
        },
        shell: {
          type: 'string',
          description: 'Shell command to run the service',
        },
        root: {
          type: 'string',
          description: 'Root directory for the service (optional)',
        },
        env: {
          type: 'object',
          description: 'Environment variables for the service (optional)',
        },
        default: {
          type: 'boolean',
          description: 'Mark this service as default (optional)',
        },
      },
      required: ['name', 'shell'],
    },
    handler: async (args) => {
      const { name, shell, root, env, default: isDefault } = args;
      
      if (!name || !shell) {
        throw new McpError(ErrorCode.InvalidRequest, 'Service name and shell command are required');
      }
      
      const logWrapper = new ConsoleLogWrapper();
      logWrapper.wrap();
      try {
        addServerConfig({
          name,
          shell,
          root,
          env,
          default: isDefault,
        });
        
        const logs = logWrapper.getAndClearLogs();
        
        let responseText = '';
        if (logs.length > 0) {
          responseText = logs.join('\n') + '\n';
        }
        responseText += `Service '${name}' added successfully to .candle-setup.json`;
        
        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } catch (error) {
        throw new McpError(ErrorCode.InvalidRequest, error.message);
      } finally {
        logWrapper.reset();
      }
    },
  },
];

export async function serveMCP() {
  infoLog('MCP: Starting MCP server');
  
  // Create server with proper initialization
  const server = new Server(
    {
      name: 'candle',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
      instructions: 'Tool for running and managing local dev servers. Use this when launching any local servers, including '
      + 'web servers, APIs, and other services.',
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    infoLog('MCP: Received ListTools request:', request);
    const response = {
      tools: toolDefinitions.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };

    infoLog('MCP: Responding to ListTools:', response);
    return response;
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    infoLog('MCP: Received CallTool request:', request);

    const tool = toolDefinitions.find(t => t.name === name);
    if (!tool) {
      infoLog(`MCP: CallTool error - Unknown tool: ${name}`);
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    try {
      const result = await tool.handler(args);
      infoLog(`MCP: Responding to ${name}:`, result);
      return result;
    } catch (error) {
      if (error instanceof McpError) throw error;
      if (error instanceof NeedRunCommandError) {
        throw new McpError(
          ErrorCode.InvalidRequest, 
          `No .candle-setup.json file found or service '${error.commandName}' not configured in ${error.cwd}. Please create a .candle-setup.json file to define your services.`
        );
      }
      infoLog(`MCP: ${name} error:`, error);
      throw new McpError(ErrorCode.InternalError, `Failed to execute ${name}: ${error.message}`);
    }
  });

  // Create transport and connect
  const transport = new StdioServerTransport();
  await server.connect(transport);
  infoLog('MCP: Server launched and connected');
}

export async function main(): Promise<void> {
    await serveMCP();
}
