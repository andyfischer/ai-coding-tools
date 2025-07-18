import type { Meta, StoryObj } from '@storybook/react';
import { ChatSessionView } from './ChatSessionView';
import { ChatSession } from '../types';

const meta: Meta<typeof ChatSessionView> = {
  title: 'Components/ChatSessionView',
  component: ChatSessionView,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockSession: ChatSession = {
  sessionId: 'session-123',
  messages: [],
  firstMessageTimestamp: '2025-01-15T10:30:00Z',
  lastMessageTimestamp: '2025-01-15T11:45:00Z',
  projectPath: '-Users-johndoe-ai-coding-tools-claude-history-tool',
  messageCount: 25
};

// Mock the window.electronAPI for Storybook
if (typeof window !== 'undefined') {
  (window as any).electronAPI = {
    getSessionDetails: async (sessionId: string, projectName: string) => {
      // Return mock messages for Storybook
      return [
        {
          parentUuid: null,
          isSidechain: false,
          userType: 'external',
          cwd: '/Users/johndoe/project',
          sessionId: sessionId,
          version: '1.0.0',
          gitBranch: 'main',
          type: 'user',
          message: {
            role: 'user',
            content: 'Help me create a React component for displaying user profiles.',
          },
          uuid: 'user-message-1',
          timestamp: '2025-01-15T10:30:00Z',
        },
        {
          parentUuid: 'user-message-1',
          isSidechain: false,
          userType: 'external',
          cwd: '/Users/johndoe/project',
          sessionId: sessionId,
          version: '1.0.0',
          gitBranch: 'main',
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: 'I\'ll help you create a React component for user profiles. Let me create the component file.'
              },
              {
                type: 'tool_use',
                id: 'tool-1',
                name: 'Write',
                input: {
                  file_path: '/Users/johndoe/project/src/UserProfile.tsx',
                  content: 'React component code here...'
                }
              }
            ],
            id: 'msg-2',
            model: 'claude-3-sonnet',
            usage: {
              input_tokens: 120,
              output_tokens: 180,
              service_tier: 'standard'
            }
          },
          uuid: 'assistant-message-1',
          timestamp: '2025-01-15T10:31:00Z',
        }
      ];
    }
  };
}

export const Default: Story = {
  args: {
    session: mockSession,
  },
};