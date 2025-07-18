import type { Meta, StoryObj } from '@storybook/react';
import { MessageCard } from './MessageCard';
import { ChatMessage } from '../types';

const meta: Meta<typeof MessageCard> = {
  title: 'Components/MessageCard',
  component: MessageCard,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const userMessage: ChatMessage = {
  parentUuid: null,
  isSidechain: false,
  userType: 'external',
  cwd: '/Users/johndoe/project',
  sessionId: 'session-1',
  version: '1.0.0',
  gitBranch: 'main',
  type: 'user',
  message: {
    role: 'user',
    content: 'Help me create a React component for displaying user profiles. It should include a photo, name, email, and bio section.',
  },
  uuid: 'user-message-1',
  timestamp: '2025-01-15T10:30:00Z',
};

const assistantMessage: ChatMessage = {
  parentUuid: 'user-message-1',
  isSidechain: false,
  userType: 'external',
  cwd: '/Users/johndoe/project',
  sessionId: 'session-1',
  version: '1.0.0',
  gitBranch: 'main',
  type: 'assistant',
  message: {
    role: 'assistant',
    content: 'I\'ll help you create a React component for user profiles. Let me create a clean, responsive component with the features you requested.',
    id: 'msg-1',
    model: 'claude-3-sonnet',
    usage: {
      input_tokens: 50,
      output_tokens: 25,
      service_tier: 'standard'
    }
  },
  uuid: 'assistant-message-1',
  timestamp: '2025-01-15T10:31:00Z',
};

const assistantMessageWithTools: ChatMessage = {
  parentUuid: 'user-message-1',
  isSidechain: false,
  userType: 'external',
  cwd: '/Users/johndoe/project',
  sessionId: 'session-1',
  version: '1.0.0',
  gitBranch: 'main',
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'I\'ll create a new file for the UserProfile component.'
      },
      {
        type: 'tool_use',
        id: 'tool-1',
        name: 'Write',
        input: {
          file_path: '/Users/johndoe/project/src/UserProfile.tsx',
          content: 'import React from \'react\';\n\ninterface UserProfileProps {\n  name: string;\n  email: string;\n  bio: string;\n  photoUrl: string;\n}\n\nexport const UserProfile: React.FC<UserProfileProps> = ({ name, email, bio, photoUrl }) => {\n  return (\n    <div className="user-profile">\n      <img src={photoUrl} alt={name} />\n      <h2>{name}</h2>\n      <p>{email}</p>\n      <p>{bio}</p>\n    </div>\n  );\n};'
        }
      }
    ],
    id: 'msg-2',
    model: 'claude-3-sonnet',
    usage: {
      input_tokens: 120,
      output_tokens: 180,
      cache_creation_input_tokens: 50,
      service_tier: 'standard'
    }
  },
  uuid: 'assistant-message-2',
  timestamp: '2025-01-15T10:32:00Z',
};

export const UserMessage: Story = {
  args: {
    message: userMessage,
  },
};

export const AssistantMessage: Story = {
  args: {
    message: assistantMessage,
  },
};

export const AssistantMessageWithTools: Story = {
  args: {
    message: assistantMessageWithTools,
  },
};

const metaMessage: ChatMessage = {
  parentUuid: 'user-message-1',
  isSidechain: false,
  userType: 'external',
  cwd: '/Users/johndoe/project',
  sessionId: 'session-1',
  version: '1.0.0',
  gitBranch: 'main',
  type: 'system',
  content: 'PreToolUse:Edit [/Users/johndoe/project/src/components/Button.tsx] completed successfully',
  isMeta: true,
  level: 'info',
  toolUseID: 'toolu_01ExampleToolUse',
  uuid: 'meta-message-1',
  timestamp: '2025-01-15T10:33:00Z',
};

const visibleMetaMessage: ChatMessage = {
  parentUuid: 'user-message-1',
  isSidechain: false,
  userType: 'external',
  cwd: '/Users/johndoe/project',
  sessionId: 'session-1',
  version: '1.0.0',
  gitBranch: 'main',
  type: 'system',
  content: 'Build completed successfully with 0 errors and 2 warnings',
  isMeta: false,
  level: 'info',
  uuid: 'meta-message-2',
  timestamp: '2025-01-15T10:34:00Z',
};

export const HiddenMetaMessage: Story = {
  args: {
    message: metaMessage,
  },
};

export const VisibleMetaMessage: Story = {
  args: {
    message: visibleMetaMessage,
  },
};