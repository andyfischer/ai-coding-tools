import type { Meta, StoryObj } from '@storybook/react';
import { Typography } from './Typography';

const meta: Meta<typeof Typography> = {
  title: 'Design System/Typography',
  component: Typography,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['h1', 'h2', 'h3', 'h4', 'body', 'caption', 'small'],
    },
    color: {
      control: { type: 'color' },
    },
    weight: {
      control: { type: 'select' },
      options: ['normal', 'medium', 'semibold', 'bold'],
    },
    align: {
      control: { type: 'select' },
      options: ['left', 'center', 'right'],
    },
    children: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Heading1: Story = {
  args: {
    variant: 'h1',
    children: 'Claude History Tool',
  },
};

export const Heading2: Story = {
  args: {
    variant: 'h2',
    children: 'Chat Sessions',
  },
};

export const Heading3: Story = {
  args: {
    variant: 'h3',
    children: 'Project: /Users/johndoe/my-project',
  },
};

export const Heading4: Story = {
  args: {
    variant: 'h4',
    children: 'Session Details',
  },
};

export const Body: Story = {
  args: {
    variant: 'body',
    children: 'This is the main body text used throughout the application. It should be readable and comfortable for extended reading.',
  },
};

export const Caption: Story = {
  args: {
    variant: 'caption',
    children: 'Last activity: 2 hours ago • 15 messages',
  },
};

export const Small: Story = {
  args: {
    variant: 'small',
    children: 'Session ID: abc123-def456-ghi789',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Typography variant="h1">Heading 1 - Main Title</Typography>
      <Typography variant="h2">Heading 2 - Section Title</Typography>
      <Typography variant="h3">Heading 3 - Subsection</Typography>
      <Typography variant="h4">Heading 4 - Component Title</Typography>
      <Typography variant="body">
        Body text - This is the standard paragraph text used throughout the application. 
        It provides good readability and is suitable for longer content blocks.
      </Typography>
      <Typography variant="caption">
        Caption text - Used for metadata, timestamps, and secondary information
      </Typography>
      <Typography variant="small">
        Small text - Used for fine print, IDs, and tertiary information
      </Typography>
    </div>
  ),
};

export const ColorVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Typography variant="h3" color="#333">Default Color</Typography>
      <Typography variant="body" color="#007acc">Primary Blue</Typography>
      <Typography variant="body" color="#666">Secondary Gray</Typography>
      <Typography variant="body" color="#888">Tertiary Gray</Typography>
      <Typography variant="body" color="#e74c3c">Error Red</Typography>
      <Typography variant="body" color="#27ae60">Success Green</Typography>
    </div>
  ),
};

export const WeightVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Typography variant="body" weight="normal">Normal Weight</Typography>
      <Typography variant="body" weight="medium">Medium Weight</Typography>
      <Typography variant="body" weight="semibold">Semibold Weight</Typography>
      <Typography variant="body" weight="bold">Bold Weight</Typography>
    </div>
  ),
};

export const AlignmentVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Typography variant="body" align="left">Left aligned text</Typography>
      <Typography variant="body" align="center">Center aligned text</Typography>
      <Typography variant="body" align="right">Right aligned text</Typography>
    </div>
  ),
};

export const ApplicationExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <Typography variant="h1">Claude History Tool</Typography>
        <Typography variant="caption" color="#666">
          Browse and search your Claude conversation history
        </Typography>
      </div>
      
      <div>
        <Typography variant="h3" color="#333">
          /Users/johndoe/ai-coding-tools/my-project
        </Typography>
        <Typography variant="caption" color="#888">
          3 sessions • Last activity: 2 hours ago
        </Typography>
      </div>
      
      <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <Typography variant="body">
          Help me create a React component for displaying user profiles. 
          It should include a photo, name, email, and bio section.
        </Typography>
        <Typography variant="small" color="#666" style={{ marginTop: '0.5rem' }}>
          Yesterday at 3:42 PM • 25 messages
        </Typography>
      </div>
    </div>
  ),
};