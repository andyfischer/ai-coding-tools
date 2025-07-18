import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatList } from '../ChatList';
import { ProjectDirectory } from '../../types';

const mockProjects: ProjectDirectory[] = [
  {
    path: '-Users-johndoe-ai-coding-tools-claude-history-tool',
    sessions: [
      {
        sessionId: 'session-1',
        messages: [
          {
            parentUuid: null,
            isSidechain: false,
            userType: 'external',
            cwd: '/test',
            sessionId: 'session-1',
            version: '1.0.0',
            type: 'user',
            message: {
              role: 'user',
              content: 'Test message content for session 1',
            },
            uuid: 'msg-1',
            timestamp: '2025-01-15T10:30:00Z',
          }
        ],
        firstMessageTimestamp: '2025-01-15T10:30:00Z',
        lastMessageTimestamp: '2025-01-15T11:45:00Z',
        projectPath: '-Users-johndoe-ai-coding-tools-claude-history-tool',
        messageCount: 25
      }
    ]
  }
];

describe('ChatList', () => {
  it('renders chat history title', () => {
    const mockOnSessionSelect = vi.fn();
    render(<ChatList projects={mockProjects} onSessionSelect={mockOnSessionSelect} />);
    
    expect(screen.getByText('Chat History')).toBeInTheDocument();
  });

  it('displays project name correctly', () => {
    const mockOnSessionSelect = vi.fn();
    render(<ChatList projects={mockProjects} onSessionSelect={mockOnSessionSelect} />);
    
    expect(screen.getByText('ai/coding/tools/claude/history/tool')).toBeInTheDocument();
  });

  it('displays session information', () => {
    const mockOnSessionSelect = vi.fn();
    render(<ChatList projects={mockProjects} onSessionSelect={mockOnSessionSelect} />);
    
    expect(screen.getByText('25 messages')).toBeInTheDocument();
    expect(screen.getByText(/Test message content for session 1/)).toBeInTheDocument();
  });

  it('calls onSessionSelect when session is clicked', () => {
    const mockOnSessionSelect = vi.fn();
    render(<ChatList projects={mockProjects} onSessionSelect={mockOnSessionSelect} />);
    
    const sessionElement = screen.getByText(/Test message content for session 1/).closest('div');
    fireEvent.click(sessionElement!);
    
    expect(mockOnSessionSelect).toHaveBeenCalledWith(mockProjects[0].sessions[0]);
  });

  it('displays empty state when no projects', () => {
    const mockOnSessionSelect = vi.fn();
    render(<ChatList projects={[]} onSessionSelect={mockOnSessionSelect} />);
    
    expect(screen.getByText('No chat history found in ~/.claude/projects')).toBeInTheDocument();
  });
});