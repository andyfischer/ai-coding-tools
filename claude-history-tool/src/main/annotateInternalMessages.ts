import { ChatMessage } from "../types";

// Annotate messages that are terminal control messages or hooks
export function annotateInternalMessages(messages: ChatMessage[]) {

    for (const message of messages) {
      const content = message.message?.content;
      
      if (typeof content === 'string') {
        // Check for PreToolUse hook pattern (e.g., "PreToolUse:Edit")
        if (content.includes('PreToolUse:') && message.type === 'system') {
          message.internalMessageType = 'hook';
        }
        // Check for /clear command pattern
        else if (content.includes('<command-name>/clear</command-name>')) {
          message.internalMessageType = 'terminal_control';
        }
        // Check for command stdout pattern
        else if (content.includes('<local-command-stdout>')) {
          message.internalMessageType = 'terminal_control';
        }
      }
    }
  }