import React from 'react';
import { Modal } from './Modal';
import { CloseButton } from './CloseButton';
import { HtmlContent } from './HtmlContent';
import { useDismissNotification } from '../hooks/useDismissNotification';

interface UpgradeModalProps {
  isOpen: boolean;
  html: string;
  contentCode: string;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, html, contentCode, onClose }) => {
  const handleClose = useDismissNotification(contentCode, onClose);

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="upgrade-modal">
        <CloseButton 
          onClose={handleClose}
          className="upgrade-modal__close"
          ariaLabel="Close modal"
        />
        <HtmlContent 
          html={html}
          className="upgrade-modal__content"
        />
      </div>
    </Modal>
  );
};