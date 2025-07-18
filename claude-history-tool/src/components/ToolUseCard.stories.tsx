import type { Meta, StoryObj } from '@storybook/react';
import { ToolUseCard } from './ToolUseCard';

const meta: Meta<typeof ToolUseCard> = {
  title: 'Components/ToolUseCard',
  component: ToolUseCard,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TodoWriteTool: Story = {
  args: {
    toolName: 'TodoWrite',
    toolId: 'toolu_01TodoExample',
    input: {
      todos: [
        { id: '1', content: 'Create new component', status: 'pending', priority: 'high' },
        { id: '2', content: 'Add tests', status: 'in_progress', priority: 'medium' },
        { id: '3', content: 'Update documentation', status: 'completed', priority: 'low' }
      ]
    },
    result: 'Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress.',
    timestamp: '2025-07-20T05:06:24.957Z',
  },
};

export const EditTool: Story = {
  args: {
    toolName: 'Edit',
    toolId: 'toolu_01EditExample',
    input: {
      file_path: '/Users/andy/project/src/components/Button.tsx',
      old_string: 'className="old-button"',
      new_string: 'className="new-button"'
    },
    result: 'The file /Users/andy/project/src/components/Button.tsx has been updated successfully.',
    timestamp: '2025-07-20T05:06:24.957Z',
  },
};

export const ReadTool: Story = {
  args: {
    toolName: 'Read',
    toolId: 'toolu_01ReadExample',
    input: {
      file_path: '/Users/andy/project/package.json'
    },
    result: '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.0.0"\n  }\n}',
    timestamp: '2025-07-20T05:06:24.957Z',
  },
};

export const BashTool: Story = {
  args: {
    toolName: 'Bash',
    toolId: 'toolu_01BashExample',
    input: {
      command: 'npm run build',
      description: 'Build the project for production'
    },
    result: '> my-project@1.0.0 build\n> react-scripts build\n\nCreating an optimized production build...\nCompiled successfully.\n\nFile sizes after gzip:\n  41.2 KB  build/static/js/main.8f4b2c1a.js\n  1.78 KB  build/static/css/main.f855e6bc.css',
    timestamp: '2025-07-20T05:06:24.957Z',
  },
};

export const WriteTool: Story = {
  args: {
    toolName: 'Write',
    toolId: 'toolu_01WriteExample',
    input: {
      file_path: '/Users/andy/project/src/components/NewComponent.tsx',
      content: 'import React from \'react\';\n\nexport const NewComponent: React.FC = () => {\n  return <div>Hello World</div>;\n};'
    },
    result: 'File created successfully at: /Users/andy/project/src/components/NewComponent.tsx',
    timestamp: '2025-07-20T05:06:24.957Z',
  },
};

export const ToolWithoutResult: Story = {
  args: {
    toolName: 'Grep',
    toolId: 'toolu_01GrepExample',
    input: {
      pattern: 'useState',
      path: 'src/',
      output_mode: 'files_with_matches'
    },
    timestamp: '2025-07-20T05:06:24.957Z',
  },
};

export const UnknownTool: Story = {
  args: {
    toolName: 'CustomTool',
    toolId: 'toolu_01CustomExample',
    input: {
      customParam: 'value',
      anotherParam: 123
    },
    result: 'Custom tool executed successfully',
    timestamp: '2025-07-20T05:06:24.957Z',
  },
};