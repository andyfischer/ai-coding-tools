import { useQuery } from '@tanstack/react-query';
import { UpgradeNoticeResponse } from '../types/upgrade';

export const useUpgradeNotice = () => {
  return useQuery<UpgradeNoticeResponse>({
    queryKey: ['upgradeNotice'],
    queryFn: async (): Promise<UpgradeNoticeResponse> => {
      try {
        const apiHostname = await window.electronAPI.getApiHostname();
        const response = await fetch(`${apiHostname}/desktop-tool/upgrade-notice?appVersion=0.1.0`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const filteredData: UpgradeNoticeResponse = {};

        if (data.bannerHtml && data.bannerContentCode) {
          const bannerDismissed = await window.electronAPI.isNotificationDismissed(data.bannerContentCode);
          if (!bannerDismissed) {
            filteredData.bannerHtml = data.bannerHtml;
            filteredData.bannerContentCode = data.bannerContentCode;
          }
        }

        if (data.popupHtml && data.popupContentCode) {
          const popupDismissed = await window.electronAPI.isNotificationDismissed(data.popupContentCode);
          if (!popupDismissed) {
            filteredData.popupHtml = data.popupHtml;
            filteredData.popupContentCode = data.popupContentCode;
          }
        }

        return filteredData;
      } catch (error) {
        console.warn('Failed to fetch upgrade notice:', error);
        return {};
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000,
  });
};