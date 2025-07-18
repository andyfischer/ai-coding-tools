import type { Meta, StoryObj } from '@storybook/react';
import { UpgradeBanner } from './UpgradeBanner';

const meta: Meta<typeof UpgradeBanner> = {
  title: 'Components/UpgradeBanner',
  component: UpgradeBanner,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onClose: { action: 'closed' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleText: Story = {
  args: {
    html: '<p>A new version of the app is available. <a href="#">Download now</a></p>',
  },
};

export const WithHeading: Story = {
  args: {
    html: '<h3>Update Available</h3><p>Version 2.0 is now available with exciting new features!</p>',
  },
};

export const RichContent: Story = {
  args: {
    html: `
      <h3>🎉 Major Update Available!</h3>
      <p>Version 2.0 includes:</p>
      <ul>
        <li>New AI-powered features</li>
        <li>Improved performance</li>
        <li>Enhanced security</li>
      </ul>
      <p><a href="#" style="font-weight: bold;">Update now</a> to get the latest features.</p>
    `,
  },
};

export const CriticalUpdate: Story = {
  args: {
    html: `
      <h3 style="color: #dc2626;">⚠️ Critical Security Update</h3>
      <p>Please update immediately to protect your data. This update fixes important security vulnerabilities.</p>
      <p><a href="#" style="background: #dc2626; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none;">Update Now</a></p>
    `,
  },
};

export const MinimalNotice: Story = {
  args: {
    html: '<a href="#">New version available - click to update</a>',
  },
};