import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock electronAPI for tests
(global as any).window = {
  electronAPI: {
    getChatSessions: vi.fn(),
    getSessionDetails: vi.fn(),
  },
};