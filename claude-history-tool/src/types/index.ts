export interface ChatMessage {
  parentUuid: string | null;
  isSidechain: boolean;
  userType: string;
  cwd: string;
  sessionId: string;
  version: string;
  gitBranch?: string;
  type: 'user' | 'assistant' | 'system';
  message?: {
    role: 'user' | 'assistant';
    content: string | Array<{
      type: 'text' | 'tool_use' | 'tool_result';
      text?: string;
      id?: string;
      name?: string;
      input?: any;
      tool_use_id?: string;
    }>;
    id?: string;
    model?: string;
    stop_reason?: string | null;
    stop_sequence?: string | null;
    usage?: {
      input_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
      output_tokens?: number;
      service_tier?: string;
    };
  };
  content?: string;
  isMeta?: boolean;
  level?: string;
  toolUseID?: string;
  uuid: string;
  timestamp: string;
  requestId?: string;
  toolUseResult?: any;
  internalMessageType?: 'terminal_control' | 'hook';
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  firstMessageTimestamp: string;
  lastMessageTimestamp: string;
  projectPath: string;
  messageCount: number;
}

export interface ProjectDirectory {
  path: string;
  sessions: ChatSession[];
}