import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import type { MobileProperty } from '@/types/mobileProperty';

jest.mock('@/lib/propertyCache', () => ({
  getCachedMobileProperty: jest.fn().mockResolvedValue(null),
  setCachedMobileProperty: jest.fn().mockResolvedValue(undefined),
  deleteCachedMobileProperty: jest.fn().mockResolvedValue(undefined),
  getAllCachedMobileProperties: jest.fn().mockResolvedValue([]),
  clearAllCachedProperties: jest.fn().mockResolvedValue(undefined),
  addCacheEventListener: jest.fn().mockReturnValue(() => {}),
  updateCacheStats: jest.fn().mockResolvedValue({
    totalEntries: 0, totalSize: 0, storageQuota: 0, storageUsed: 0,
    hitRate: 0, missRate: 0, oldestEntry: null, newestEntry: null,
  }),
  getCacheStats: jest.fn().mockResolvedValue({}),
  isCacheAvailable: jest.fn().mockReturnValue(true),
}));

jest.mock('@/lib/cacheManager', () => ({
  initCacheManager: jest.fn().mockResolvedValue(undefined),
  isNetworkOnline: jest.fn().mockReturnValue(true),
  addNetworkStateListener: jest.fn().mockReturnValue(() => {}),
  performBackgroundSync: jest.fn().mockResolvedValue(undefined),
  getSyncQueueLength: jest.fn().mockReturnValue(0),
  getCacheHealth: jest.fn().mockResolvedValue({ issues: [] }),
  optimizeCache: jest.fn().mockResolvedValue({ cleaned: 0 }),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import { OfflinePropertyCache } from '@/components/mobile/OfflinePropertyCache';

// jsdom doesn't ship fetch; provide a stub so spyOn works
if (!globalThis.fetch) {
  (globalThis as any).fetch = jest.fn();
}

const mockProperty: MobileProperty = {
  id: 'prop-1',
  name: 'Test Property',
  location: 'Test City',
  type: 'Residential',
  value: 500000,
  tokens: 100,
  roi: 8,
  monthlyIncome: 3000,
  images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  description: 'A test property',
};

describe('OfflinePropertyCache – real fetch progress (#500)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the available properties list when online', async () => {
    render(<OfflinePropertyCache properties={[mockProperty]} />);
    await waitFor(() => expect(screen.getByText('Test Property')).toBeInTheDocument());
  });

  it('uses fetch instead of setTimeout for download steps', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      });
      return new Response(body, { status: 200, headers: { 'content-length': '3' } }) as Response;
    });

    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');

    render(<OfflinePropertyCache properties={[mockProperty]} />);

    // Wait for cache init and "Available Properties" list to appear
    await waitFor(() => expect(screen.getByText('Available Properties')).toBeInTheDocument());

    // The Download button is the outline button directly beside the property name
    // It is NOT disabled and has an SVG; use getAllByRole and pick the last icon-only button
    // in the Available Properties section (Settings / Clear All / Download)
    const allButtons = screen.getAllByRole('button');
    // The download button for prop-1 is the one whose aria-label or nearby text is about downloading
    // Simplest: find the button containing the Download SVG (lucide-download class)
    const downloadBtn = allButtons.find((btn) =>
      btn.querySelector('.lucide-download') !== null
    );

    expect(downloadBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(downloadBtn!);
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    // Artificial 300ms / 200ms per-step delays must be gone
    const simulationDelays = setTimeoutSpy.mock.calls.filter(
      ([, delay]) => delay === 300 || delay === 200
    );
    expect(simulationDelays).toHaveLength(0);

    fetchSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });
});
