import type { Meta, StoryObj } from '@storybook/react';
import { MetaCard } from './MetaCard';

const meta: Meta<typeof MetaCard> = {
  title: 'Components/MetaCard',
  component: MetaCard,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InfoMessage: Story = {
  args: {
    content: 'PreToolUse:Edit [/Users/andy.fischer/ai-coding-tools/ts-rubberstamp/bin/ts-rubberstamp] completed successfully',
    timestamp: '2025-07-20T05:06:24.957Z',
    level: 'info',
    toolUseID: 'toolu_01WgPC79uyPbZCwQ2EV2WpHu',
    isHiddenByDefault: true,
  },
};

export const ErrorMessage: Story = {
  args: {
    content: 'Tool execution failed: File not found',
    timestamp: '2025-07-20T05:06:24.957Z',
    level: 'error',
    isHiddenByDefault: false,
  },
};

export const WarningMessage: Story = {
  args: {
    content: 'Warning: This action will overwrite the existing file',
    timestamp: '2025-07-20T05:06:24.957Z',
    level: 'warn',
    isHiddenByDefault: false,
  },
};

export const TodoWriteMessage: Story = {
  args: {
    content: 'PreToolUse:TodoWrite [Creating todo list for refactoring task] completed successfully',
    timestamp: '2025-07-20T05:06:24.957Z',
    level: 'info',
    toolUseID: 'toolu_01TodoWriteExample',
    isHiddenByDefault: true,
  },
};

export const DebugMessage: Story = {
  args: {
    content: 'Debug: Processing file chunk 3 of 10',
    timestamp: '2025-07-20T05:06:24.957Z',
    level: 'debug',
    isHiddenByDefault: true,
  },
};

export const VisibleByDefault: Story = {
  args: {
    content: 'System notification: Build completed successfully',
    timestamp: '2025-07-20T05:06:24.957Z',
    level: 'info',
    isHiddenByDefault: false,
  },
};