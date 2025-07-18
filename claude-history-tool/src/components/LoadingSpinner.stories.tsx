import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from './LoadingSpinner';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'Components/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: {
        type: 'range',
        min: 20,
        max: 100,
        step: 5,
      },
    },
    color: {
      control: {
        type: 'color',
      },
    },
    message: {
      control: {
        type: 'text',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 40,
    color: '#007acc',
    message: 'Loading...',
  },
};

export const Large: Story = {
  args: {
    size: 60,
    color: '#007acc',
    message: 'Loading chat history...',
  },
};

export const Small: Story = {
  args: {
    size: 24,
    color: '#007acc',
    message: 'Loading...',
  },
};

export const CustomColor: Story = {
  args: {
    size: 40,
    color: '#ff6b6b',
    message: 'Processing...',
  },
};

export const NoMessage: Story = {
  args: {
    size: 40,
    color: '#007acc',
    message: '',
  },
};

export const ChatHistoryLoading: Story = {
  args: {
    size: 50,
    color: '#007acc',
    message: 'Loading chat history...',
  },
};

export const SessionDetailsLoading: Story = {
  args: {
    size: 40,
    color: '#007acc',
    message: 'Loading session details...',
  },
};