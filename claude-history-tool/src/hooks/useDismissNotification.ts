import { useCallback } from 'react';

export const useDismissNotification = (contentCode: string, onClose: () => void) => {
  return useCallback(async () => {
    await window.electronAPI.dismissNotification(contentCode);
    onClose();
  }, [contentCode, onClose]);
};