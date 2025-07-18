import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ModalWithTrigger = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <Button onClick={() => setIsOpen(true)}>Open {title}</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {children}
      </Modal>
    </div>
  );
};

export const SimpleModal: Story = {
  render: () => (
    <ModalWithTrigger title="Simple Modal">
      <div style={{ padding: '24px', minWidth: '400px' }}>
        <h2 style={{ margin: '0 0 16px 0' }}>Simple Modal</h2>
        <p style={{ margin: '0 0 16px 0' }}>
          This is a simple modal dialog. You can click outside or press Escape to close it.
        </p>
        <Button onClick={() => {}}>Action Button</Button>
      </div>
    </ModalWithTrigger>
  ),
};

export const ModalWithForm: Story = {
  render: () => (
    <ModalWithTrigger title="Form Modal">
      <div style={{ padding: '24px', minWidth: '500px' }}>
        <h2 style={{ margin: '0 0 16px 0' }}>Create New Item</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Name
            </label>
            <input 
              type="text" 
              style={{ 
                width: '100%', 
                padding: '8px 12px', 
                border: '1px solid #e8eaed', 
                borderRadius: '6px' 
              }} 
              placeholder="Enter name"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Description
            </label>
            <textarea 
              style={{ 
                width: '100%', 
                padding: '8px 12px', 
                border: '1px solid #e8eaed', 
                borderRadius: '6px',
                minHeight: '80px',
                resize: 'vertical'
              }} 
              placeholder="Enter description"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button className="button-secondary button-xs">Cancel</Button>
            <Button className="button-primary button-xs">Create</Button>
          </div>
        </form>
      </div>
    </ModalWithTrigger>
  ),
};

export const LargeContentModal: Story = {
  render: () => (
    <ModalWithTrigger title="Large Content Modal">
      <div style={{ padding: '24px', maxWidth: '600px' }}>
        <h2 style={{ margin: '0 0 16px 0' }}>Large Content Modal</h2>
        <div style={{ marginBottom: '16px' }}>
          <p>This modal contains a lot of content to demonstrate scrolling behavior.</p>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
              nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button className="button-primary">Got it</Button>
        </div>
      </div>
    </ModalWithTrigger>
  ),
};

export const ConfirmationModal: Story = {
  render: () => (
    <ModalWithTrigger title="Confirmation Modal">
      <div style={{ padding: '24px', minWidth: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '16px', fontSize: '48px' }}>⚠️</div>
        <h2 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>Confirm Delete</h2>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280' }}>
          Are you sure you want to delete this item? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button className="button-secondary">Cancel</Button>
          <Button className="button-primary" style={{ backgroundColor: '#dc2626' }}>
            Delete
          </Button>
        </div>
      </div>
    </ModalWithTrigger>
  ),
};