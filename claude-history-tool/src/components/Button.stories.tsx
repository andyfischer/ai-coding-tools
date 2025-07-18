import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PrimaryXS: Story = {
  args: {
    children: 'Primary XS',
    className: 'button-primary button-xs',
  },
};

export const SecondaryXS: Story = {
  args: {
    children: 'Secondary XS',
    className: 'button-secondary button-xs',
  },
};

export const PrimaryOnly: Story = {
  args: {
    children: 'Primary',
    className: 'button-primary',
  },
};

export const SecondaryOnly: Story = {
  args: {
    children: 'Secondary',
    className: 'button-secondary',
  },
};

export const BaseButton: Story = {
  args: {
    children: 'Base Button',
    className: '',
  },
};

export const ButtonGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Button className="button-primary button-xs">Save</Button>
      <Button className="button-secondary button-xs">Cancel</Button>
      <Button className="button-primary">Submit</Button>
      <Button className="button-secondary">Reset</Button>
    </div>
  ),
};