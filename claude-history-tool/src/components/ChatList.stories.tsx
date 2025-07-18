import type { Meta, StoryObj } from '@storybook/react';
import { ChatList } from './ChatList';
import { ProjectDirectory } from '../types';

const meta: Meta<typeof ChatList> = {
  title: 'Components/ChatList',
  component: ChatList,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onSessionSelect: (session) => console.log('Selected session:', session),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockProjects: ProjectDirectory[] = [
  {
    path: '-Users-johndoe-ai-coding-tools-claude-history-tool',
    sessions: [
      {
        sessionId: 'session-1',
        messages: [],
        firstMessageTimestamp: '2025-01-15T10:30:00Z',
        lastMessageTimestamp: '2025-01-15T11:45:00Z',
        projectPath: '-Users-johndoe-ai-coding-tools-claude-history-tool',
        messageCount: 25
      },
      {
        sessionId: 'session-2',
        messages: [],
        firstMessageTimestamp: '2025-01-14T14:20:00Z',
        lastMessageTimestamp: '2025-01-14T15:30:00Z',
        projectPath: '-Users-johndoe-ai-coding-tools-claude-history-tool',
        messageCount: 12
      }
    ]
  },
  {
    path: '-Users-johndoe-web-development-react-app',
    sessions: [
      {
        sessionId: 'session-3',
        messages: [],
        firstMessageTimestamp: '2025-01-13T09:15:00Z',
        lastMessageTimestamp: '2025-01-13T16:45:00Z',
        projectPath: '-Users-johndoe-web-development-react-app',
        messageCount: 87
      }
    ]
  }
];

export const Default: Story = {
  args: {
    projects: mockProjects,
  },
};

export const Empty: Story = {
  args: {
    projects: [],
  },
};

export const SingleProject: Story = {
  args: {
    projects: [mockProjects[0]],
  },
};