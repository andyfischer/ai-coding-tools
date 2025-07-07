import 'source-map-support/register';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { ProcessLog } from './database';
import { infoLog, getProcessLogs } from './logs';
import { handleRun } from './handleRun';
import { handleKill } from './handleKill';
import { handleRestart } from './handleRestart';
import { handleSetCommand } from './handleSetCommand';
import { handleList } from './handleList';
import { NeedRunCommandError } from './errors';
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
        name: 'SetCommand',
        description: 'Configure a run command for this directory',
        inputSchema: {
            type: 'object',
            properties: {
                command: {
                    type: 'string',
                    description: 'The command to set as the default run command',
                },
                cwd: {
                    type: 'string',
                    description: 'Current working directory (if different from process.cwd())',
                },
                commandName: {
                    type: 'string',
                    description: `Name of the command to set (optional). This is only needed if `
                        + `there will be multiple services for the same directory. Examples: "web", "api", "tests", etc. `
                        + `If this project only has one 'service', then leave this blank.`,
                },
            },
            required: ['command'],
        },
        handler: async (args) => {
            const command = args?.command as string;
            const cwd = args?.cwd as string | undefined || process.cwd();
            const commandName = args?.commandName as string | undefined;
            if (!command) {
                infoLog('MCP: SetCommand error - command is required');
                throw new McpError(ErrorCode.InvalidRequest, 'command is required');
            }
            await handleSetCommand({ commandString: command, cwd, commandName });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Set run command for ${cwd}: ${command}`,
                    },
                ],
            };
        },
    },
    {
        name: 'ListServices',
        description: 'List services with structured output',
        inputSchema: {
            type: 'object',
            properties: {
                cwd: {
                    type: 'string',
                    description: 'Current working directory to filter services by (optional)',
                },
                showAll: {
                    type: 'boolean',
                    description: 'Show all services or just current directory (optional)',
                },
            },
        },
        handler: async (args) => {
            const cwd = args?.cwd as string | undefined;
            const showAll = args?.showAll as boolean | undefined;
            // Set process.cwd() temporarily if cwd is provided
            const originalCwd = process.cwd();
            if (cwd) {
                process.chdir(cwd);
            }
            try {
                const listOutput = await handleList({ showAll });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(listOutput, null, 2),
                        },
                    ],
                };
            }
            finally {
                // Restore original cwd
                if (cwd) {
                    process.chdir(originalCwd);
                }
            }
        },
    },
    {
        name: 'GetLogs',
        description: 'Get recent logs for the service in the current directory',
        inputSchema: {
            type: 'object',
            properties: {
                cwd: {
                    type: 'string',
                    description: 'Current working directory (if different from process.cwd())',
                },
                commandName: {
                    type: 'string',
                    description: 'Name of the command to get logs for (defaults to "default")',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of log lines to return (optional)',
                },
            },
        },
        handler: async (args) => {
            const cwd = args?.cwd as string | undefined || process.cwd();
            const limit = args?.limit as number | undefined;
            const commandName = args?.commandName as string | undefined || 'default';
            // Get logs using working directory and command name
            const logs = getProcessLogs({
                workingDirectory: cwd,
                commandName,
                limit
            });
            if (logs.length === 0) {
                infoLog(`MCP: GetLogs - no logs found for command '${commandName}' in working directory: ${cwd}`);
                throw new McpError(ErrorCode.InvalidRequest, `No logs found for command '${commandName}' in working directory: ${cwd}`);
            }
            const formattedLogs = logs
                .reverse()
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
        description: 'Start the registered dev server for the current directory',
        inputSchema: {
            type: 'object',
            properties: {
                cwd: {
                    type: 'string',
                    description: 'Current working directory (if different from process.cwd())',
                },
                commandName: {
                    type: 'string',
                    description: 'Name of the command to start (optional)',
                },
            },
        },
        handler: async (args) => {
            const cwd = args?.cwd as string | undefined || process.cwd();
            const commandName = args?.commandName as string | undefined;
            await handleRun({ cwd, commandName, exitAfterMs: 3000, consoleOutputFormat: 'pretty' });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Service started successfully in ${cwd}`,
                    },
                ],
            };
        },
    },
    {
        name: 'KillService',
        description: 'Kill the running server for the current directory',
        inputSchema: {
            type: 'object',
            properties: {
                cwd: {
                    type: 'string',
                    description: 'Current working directory to filter processes by (optional)',
                },
                commandName: {
                    type: 'string',
                    description: 'Name of the command to kill (optional, defaults to "default")',
                },
            },
        },
        handler: async (args) => {
            const cwd = args?.cwd as string | undefined || process.cwd();
            const commandName = args?.commandName as string | undefined;
            await handleKill({ cwd, commandName });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Service killed successfully in ${cwd}`,
                    },
                ],
            };
        },
    },
    {
        name: 'RestartService',
        description: 'Restart the running server for the current directory',
        inputSchema: {
            type: 'object',
            properties: {
                cwd: {
                    type: 'string',
                    description: 'Current working directory (if different from process.cwd())',
                },
                commandName: {
                    type: 'string',
                    description: 'Name of the command to restart (optional, defaults to "default")',
                },
            },
        },
        handler: async (args) => {
            const cwd = args?.cwd as string | undefined || process.cwd();
            const commandName = args?.commandName as string | undefined;
            await handleRestart({ cwd, commandName, consoleOutputFormat: 'pretty' });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Service restarted successfully in ${cwd}`,
                    },
                ],
            };
        },
    },
];
export async function serveMCP() {
    infoLog('MCP: Starting MCP server');
    // Create server with proper initialization
    const server = new Server({
        name: 'candle',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
            resources: {},
        },
        instructions: 'Tool for running and managing local dev servers. Use this when launching any local servers, including '
            + 'web servers, APIs, and other services.',
    });
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
        }
        catch (error) {
            if (error instanceof McpError)
                throw error;
            if (error instanceof NeedRunCommandError) {
                throw new McpError(ErrorCode.InvalidRequest, `No run command configured for ${error.cwd}. Please use SetCommand first to configure a command for this directory.`);
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
