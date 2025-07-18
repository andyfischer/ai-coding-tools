import React from 'react';

interface CloseButtonProps {
  onClose: () => void;
  className?: string;
  ariaLabel?: string;
}

export const CloseButton: React.FC<CloseButtonProps> = ({ 
  onClose, 
  className = '', 
  ariaLabel = 'Close' 
}) => {
  return (
    <button 
      className={className}
      onClick={onClose}
      aria-label={ariaLabel}
    >
      ×
    </button>
  );
};