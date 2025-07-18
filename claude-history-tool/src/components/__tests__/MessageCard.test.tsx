import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageCard } from '../MessageCard';
import { ChatMessage } from '../../types';

const userMessage: ChatMessage = {
  parentUuid: null,
  isSidechain: false,
  userType: 'external',
  cwd: '/test',
  sessionId: 'session-1',
  version: '1.0.0',
  type: 'user',
  message: {
    role: 'user',
    content: 'This is a test user message',
  },
  uuid: 'user-msg-1',
  timestamp: '2025-01-15T10:30:00Z',
};

const assistantMessageWithTools: ChatMessage = {
  parentUuid: 'user-msg-1',
  isSidechain: false,
  userType: 'external',
  cwd: '/test',
  sessionId: 'session-1',
  version: '1.0.0',
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'I will help you with that.'
      },
      {
        type: 'tool_use',
        id: 'tool-1',
        name: 'Write',
        input: { file_path: '/test.txt', content: 'test content' }
      }
    ],
    id: 'msg-1',
    model: 'claude-3-sonnet',
  },
  uuid: 'assistant-msg-1',
  timestamp: '2025-01-15T10:31:00Z',
};

describe('MessageCard', () => {
  it('renders user message correctly', () => {
    render(<MessageCard message={userMessage} />);
    
    expect(screen.getByText('👤 User')).toBeInTheDocument();
    expect(screen.getByText('This is a test user message')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    render(<MessageCard message={assistantMessageWithTools} />);
    
    expect(screen.getByText('🤖 Assistant')).toBeInTheDocument();
    expect(screen.getByText('I will help you with that.')).toBeInTheDocument();
  });

  it('shows tool toggle button for messages with tools', () => {
    render(<MessageCard message={assistantMessageWithTools} />);
    
    expect(screen.getByText('Show Tools')).toBeInTheDocument();
  });

  it('does not show tool toggle for messages without tools', () => {
    render(<MessageCard message={userMessage} />);
    
    expect(screen.queryByText('Show Tools')).not.toBeInTheDocument();
  });

  it('expands and collapses tool content', () => {
    render(<MessageCard message={assistantMessageWithTools} />);
    
    const toggleButton = screen.getByText('Show Tools');
    
    // Tool content should not be visible initially
    expect(screen.queryByText('🛠️ Tool Use: Write')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(toggleButton);
    
    // Tool content should now be visible
    expect(screen.getByText('🛠️ Tool Use: Write')).toBeInTheDocument();
    expect(screen.getByText('Hide Tools')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(screen.getByText('Hide Tools'));
    
    // Tool content should be hidden again
    expect(screen.queryByText('🛠️ Tool Use: Write')).not.toBeInTheDocument();
    expect(screen.getByText('Show Tools')).toBeInTheDocument();
  });

  it('displays timestamp correctly', () => {
    render(<MessageCard message={userMessage} />);
    
    // Check that some form of timestamp is displayed
    expect(screen.getByText(/1\/15\/2025/)).toBeInTheDocument();
  });
});