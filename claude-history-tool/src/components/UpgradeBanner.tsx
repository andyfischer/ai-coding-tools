import React from 'react';
import { CloseButton } from './CloseButton';
import { HtmlContent } from './HtmlContent';
import { useDismissNotification } from '../hooks/useDismissNotification';

interface UpgradeBannerProps {
  html: string;
  contentCode: string;
  onClose: () => void;
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ html, contentCode, onClose }) => {
  const handleClose = useDismissNotification(contentCode, onClose);

  return (
    <div className="upgrade-banner">
      <HtmlContent 
        html={html}
        className="upgrade-banner__content"
      />
      <CloseButton 
        onClose={handleClose}
        className="upgrade-banner__close"
        ariaLabel="Close banner"
      />
    </div>
  );
};