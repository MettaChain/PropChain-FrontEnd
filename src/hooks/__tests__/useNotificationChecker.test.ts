import { renderHook, act } from '@testing-library/react';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useWalletStore } from '@/store/walletStore';
import { notificationService } from '@/lib/notificationService';
import { logger } from '@/utils/logger';
import { useNotificationChecker } from '../useNotificationChecker';

jest.mock('@/store/savedSearchStore', () => ({
  useSavedSearchStore: jest.fn(),
}));

jest.mock('@/store/notificationStore', () => ({
  useNotificationStore: jest.fn(),
}));

jest.mock('@/store/walletStore', () => ({
  useWalletStore: jest.fn(),
}));

jest.mock('@/lib/notificationService', () => ({
  notificationService: {
    checkForNewMatches: jest.fn(),
    sendEmailNotification: jest.fn(),
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseSavedSearchStore = useSavedSearchStore as jest.MockedFunction<typeof useSavedSearchStore>;
const mockUseNotificationStore = useNotificationStore as jest.MockedFunction<typeof useNotificationStore>;
const mockUseWalletStore = useWalletStore as jest.MockedFunction<typeof useWalletStore>;
const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

const mockAddAlert = jest.fn();

function setupMocks({
  address = '0xwallet1',
  inAppEnabled = true,
  searches = [],
}: {
  address?: string | null;
  inAppEnabled?: boolean;
  searches?: any[];
} = {}) {
  mockUseWalletStore.mockReturnValue({ address } as any);
  mockUseNotificationStore.mockReturnValue({
    addAlert: mockAddAlert,
    settings: {
      email: 'test@example.com',
      inAppEnabled,
      emailEnabled: false,
      defaultFrequency: 'daily',
    },
  } as any);
  mockUseSavedSearchStore.mockReturnValue({ searches } as any);
}

describe('useNotificationChecker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not check when no address', () => {
    setupMocks({ address: null });

    renderHook(() => useNotificationChecker());

    expect(mockNotificationService.checkForNewMatches).not.toHaveBeenCalled();
  });

  it('does not check when in-app notifications disabled', () => {
    setupMocks({ inAppEnabled: false });

    renderHook(() => useNotificationChecker());

    expect(mockNotificationService.checkForNewMatches).not.toHaveBeenCalled();
  });

  it('checks for new matches on mount when address present and settings enabled', () => {
    setupMocks();
    mockNotificationService.checkForNewMatches.mockResolvedValue([]);

    renderHook(() => useNotificationChecker());

    expect(mockNotificationService.checkForNewMatches).toHaveBeenCalled();
  });

  it('calls notificationService.checkForNewMatches with searches', () => {
    const searches = [{ id: 's1', name: 'Search 1' }];
    setupMocks({ searches });
    mockNotificationService.checkForNewMatches.mockResolvedValue([]);

    renderHook(() => useNotificationChecker());

    expect(mockNotificationService.checkForNewMatches).toHaveBeenCalledWith(searches);
  });

  it('adds alerts to notification store', async () => {
    const alert = {
      id: 'a1',
      savedSearchId: 's1',
      savedSearchName: 'Search 1',
      matchingProperties: [],
      newPropertiesCount: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      isRead: false,
      userId: '0xwallet1',
    };
    setupMocks();
    mockNotificationService.checkForNewMatches.mockResolvedValue([alert]);

    await act(async () => {
      renderHook(() => useNotificationChecker());
    });

    expect(mockAddAlert).toHaveBeenCalledWith(alert);
  });

  it('sends email notifications when email settings enabled and savedSearch has emailNotifications', async () => {
    const search = {
      id: 's1',
      name: 'Search 1',
      emailNotifications: true,
    };
    const alert = {
      id: 'a1',
      savedSearchId: 's1',
      savedSearchName: 'Search 1',
      matchingProperties: [],
      newPropertiesCount: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      isRead: false,
      userId: '0xwallet1',
    };

    mockUseNotificationStore.mockReturnValue({
      addAlert: mockAddAlert,
      settings: {
        email: 'test@example.com',
        inAppEnabled: true,
        emailEnabled: true,
        defaultFrequency: 'daily',
      },
    } as any);
    mockUseSavedSearchStore.mockReturnValue({ searches: [search] } as any);
    mockUseWalletStore.mockReturnValue({ address: '0xwallet1' } as any);
    mockNotificationService.checkForNewMatches.mockResolvedValue([alert]);
    mockNotificationService.sendEmailNotification.mockResolvedValue(true);

    await act(async () => {
      renderHook(() => useNotificationChecker());
    });

    expect(mockNotificationService.sendEmailNotification).toHaveBeenCalledWith(
      'test@example.com',
      alert,
      search
    );
  });

  it('cleans up interval on unmount', () => {
    setupMocks();
    mockNotificationService.checkForNewMatches.mockResolvedValue([]);

    const { unmount } = renderHook(() => useNotificationChecker());

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('returns isChecking state', () => {
    setupMocks();
    mockNotificationService.checkForNewMatches.mockResolvedValue([]);

    const { result } = renderHook(() => useNotificationChecker());

    expect(typeof result.current.isChecking).toBe('boolean');
  });
});
