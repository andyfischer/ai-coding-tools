export interface McpClientOptions {
  serverUrl?: string;
  command?: string[];
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ResourceInfo {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface ToolInfo {
  name: string;
  description?: string;
  inputSchema: any;
}