import type { Meta, StoryObj } from '@storybook/react';
import { UpgradeModal } from './UpgradeModal';
import { Button } from './Button';
import { useState } from 'react';

const meta: Meta<typeof UpgradeModal> = {
  title: 'Components/UpgradeModal',
  component: UpgradeModal,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ModalWithTrigger = ({ html, title }: { html: string; title: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <Button onClick={() => setIsOpen(true)}>Open {title}</Button>
      <UpgradeModal 
        isOpen={isOpen} 
        html={html}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

export const SimpleUpdate: Story = {
  render: () => (
    <ModalWithTrigger 
      title="Simple Update"
      html="<h2>Update Available</h2><p>A new version of the app is ready to install. Click the button below to update now.</p>"
    />
  ),
};

export const FeatureAnnouncement: Story = {
  render: () => (
    <ModalWithTrigger 
      title="Feature Announcement"
      html={`
        <h2>🎉 New Features Available!</h2>
        <p>We've added some exciting new capabilities to improve your experience:</p>
        <ul>
          <li><strong>Smart Search:</strong> Find content faster with AI-powered search</li>
          <li><strong>Dark Mode:</strong> Easier on your eyes during late-night sessions</li>
          <li><strong>Export Tools:</strong> Save your work in multiple formats</li>
        </ul>
        <p>Update now to start using these features!</p>
        <div style="text-align: center; margin-top: 24px;">
          <button style="background: #2D5CDB; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">Update Now</button>
        </div>
      `}
    />
  ),
};

export const CriticalSecurityUpdate: Story = {
  render: () => (
    <ModalWithTrigger 
      title="Security Update"
      html={`
        <h2 style="color: #dc2626;">🛡️ Critical Security Update</h2>
        <p style="color: #374151; margin-bottom: 16px;">We've identified and fixed important security vulnerabilities in the previous version.</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <h4 style="color: #dc2626; margin: 0 0 8px 0;">What's Fixed:</h4>
          <ul style="margin: 0; color: #374151;">
            <li>Data encryption improvements</li>
            <li>Authentication security enhancements</li>
            <li>Network communication protection</li>
          </ul>
        </div>
        <p><strong>We strongly recommend updating immediately to protect your data.</strong></p>
        <div style="text-align: center; margin-top: 24px;">
          <button style="background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-right: 12px;">Update Now</button>
          <button style="background: transparent; color: #6b7280; border: 1px solid #d1d5db; padding: 12px 24px; border-radius: 6px; cursor: pointer;">Remind Me Later</button>
        </div>
      `}
    />
  ),
};

export const MaintenanceNotice: Story = {
  render: () => (
    <ModalWithTrigger 
      title="Maintenance Notice"
      html={`
        <h2>🔧 Scheduled Maintenance</h2>
        <p>We'll be performing system maintenance on <strong>Sunday, March 15th from 2:00 AM - 4:00 AM EST</strong>.</p>
        <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <h4 style="color: #d97706; margin: 0 0 8px 0;">What to Expect:</h4>
          <ul style="margin: 0; color: #374151;">
            <li>Brief service interruptions (5-10 minutes)</li>
            <li>Improved performance after maintenance</li>
            <li>New backup system deployment</li>
          </ul>
        </div>
        <p>We apologize for any inconvenience and appreciate your patience.</p>
        <div style="text-align: center; margin-top: 24px;">
          <button style="background: #2D5CDB; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">Got It</button>
        </div>
      `}
    />
  ),
};

export const WelcomeMessage: Story = {
  render: () => (
    <ModalWithTrigger 
      title="Welcome Message"
      html={`
        <h2>👋 Welcome to Claude History Tool v2.0!</h2>
        <p>Thank you for updating to the latest version. Here's what's new:</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0;">
          <div style="text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
            <h4 style="margin: 0 0 4px 0;">Better Search</h4>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Find conversations faster</p>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">📊</div>
            <h4 style="margin: 0 0 4px 0;">Analytics</h4>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Track your usage patterns</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <button style="background: #2D5CDB; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">Get Started</button>
        </div>
      `}
    />
  ),
};